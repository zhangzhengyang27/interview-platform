import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveCode, isRateLimited } from "@/lib/verify-code";
import { sendVerificationCode } from "@/lib/mailer";
import { rateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // IP 级速率限制：每分钟最多 5 次发送（补充邮箱级限制）
  const ip = getClientIp(request);
  const rl = rateLimit(`send-code:${ip}`, 5, 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "发送过于频繁，请稍后再试" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const { email } = await request.json();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 409 });
    }

    if (await isRateLimited(email)) {
      return NextResponse.json(
        { error: "发送过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    const code = await saveCode(email);
    await sendVerificationCode(email, code);

    return NextResponse.json({ message: "验证码已发送" });
  } catch (error) {
    console.error("Send-code error:", error);
    return NextResponse.json(
      { error: "验证码发送失败，请稍后重试" },
      { status: 500 }
    );
  }
}
