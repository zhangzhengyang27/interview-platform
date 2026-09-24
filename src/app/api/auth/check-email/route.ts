import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/auth/check-email?email=xxx
// 返回该邮箱的注册与验证状态，用于登录失败时区分「未注册/未验证/密码错误」
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "缺少邮箱参数" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  if (!user) {
    return NextResponse.json({ registered: false });
  }

  return NextResponse.json({
    registered: true,
    verified: !!user.emailVerified,
  });
}
