import { NextRequest, NextResponse } from "next/server";
import { runCode } from "@/lib/code-runner";
import { requireAuth, getCurrentUser } from "@/lib/session";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // 认证检查：禁止未登录用户执行代码
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  // 用户级速率限制：每分钟最多 30 次代码执行
  const rl = rateLimit(`run-code:${user?.id}`, 30, 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "代码执行过于频繁，请稍后再试" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const { code, language, stdin } = await request.json();
    if (!code || !language) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }
    // 15 秒超时
    const result = await Promise.race([
      runCode(code, language, stdin),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("执行超时 (15s)")), 15000)
      ),
    ]);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "执行失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
