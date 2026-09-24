import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signJWT } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
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
