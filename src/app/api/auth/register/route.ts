import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyCode } from "@/lib/verify-code";
import { rateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // IP 级速率限制：每小时最多 10 次注册尝试
  const ip = getClientIp(request);
  const rl = rateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "注册尝试过于频繁，请稍后再试" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const { email, password, name, code } = await request.json();

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "密码至少6位" },
        { status: 400 }
      );
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      );
    }

    // 密码强度基础校验
    if (password.length > 128) {
      return NextResponse.json(
        { error: "密码长度不能超过128位" },
        { status: 400 }
      );
    }

    // 先查重，避免已注册邮箱消费验证码
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    // 验证码校验（先于建号）
    if (!code) {
      return NextResponse.json(
        { error: "请输入邮箱验证码" },
        { status: 400 }
      );
    }
    const codeOk = await verifyCode(email, code);
    if (!codeOk) {
      return NextResponse.json(
        { error: "验证码错误或已过期" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "注册失败" },
      { status: 500 }
    );
  }
}
