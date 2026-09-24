import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const EXPIRES_MINUTES = 5;
const RESEND_SECONDS = 60;

/** 生成 6 位数字验证码 */
export function generateCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

/** 保存验证码到 VerificationToken 表，返回验证码 */
export async function saveCode(email: string): Promise<string> {
  const code = generateCode();
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: code,
      expires: new Date(Date.now() + EXPIRES_MINUTES * 60 * 1000),
    },
  });
  return code;
}

/**
 * 校验验证码是否有效且未过期。
 * 校验成功后删除该邮箱全部历史验证码（一次性使用 + 清理残留）。
 */
export async function verifyCode(email: string, code: string): Promise<boolean> {
  const record = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      token: code,
      expires: { gt: new Date() },
    },
  });

  if (!record) return false;

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  return true;
}

/** 该邮箱最近一次发码时间是否在限流窗口内 */
export async function isRateLimited(email: string): Promise<boolean> {
  const recent = await prisma.verificationToken.findFirst({
    where: { identifier: email },
    orderBy: { expires: "desc" },
  });
  return (
    !!recent &&
    recent.expires.getTime() > Date.now() - RESEND_SECONDS * 1000
  );
}
