import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signJWT } from "@/lib/jwt";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // 管理员入口可被爆破密码：IP 维度严格限流
    const ipRl = rateLimit(`admin-login-ip:${getClientIp(request)}`, 5, 60 * 1000);
    if (!ipRl.success) {
      return NextResponse.json(
        { error: "尝试过于频繁，请稍后再试" },
        { status: 429, headers: rateLimitHeaders(ipRl) }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    // 按邮箱统计失败次数（仅在失败分支计数，成功登录不消耗），10 次/小时锁定
    const emailFailureCheck = () => {
      const emailRl = rateLimit(`admin-login-fail:${email}`, 10, 60 * 60 * 1000);
      if (!emailRl.success) {
        return NextResponse.json(
          { error: "失败次数过多，该邮箱已被锁定 1 小时" },
          { status: 429, headers: rateLimitHeaders(emailRl) }
        );
      }
      return null;
    };

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return emailFailureCheck() ?? NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return emailFailureCheck() ?? NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // 检查是否是管理员
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "无权限访问后台管理系统" },
        { status: 403 }
      );
    }

    // 生成 JWT token
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 返回用户信息和 JWT token
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
