import { NextRequest, NextResponse } from "next/server";
import { validateDeepSeekApiKey, callDeepSeek, callDeepSeekStream } from "@/lib/deepseek";
import { requireAuth, getCurrentUser } from "@/lib/session";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `你是一位专业的前端/全栈技术面试教练，风格严谨但友善，擅长：
1. 解析算法题，提供最优解和思路引导
2. 讲解系统设计原理，循序渐进
3. 模拟真实面试场景，追问细节
4. 对面试回答给出改进建议

回答格式规范，适当使用 Markdown 代码块。`;

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  // 用户级速率限制：每分钟最多 20 次 AI 请求
  const rl = rateLimit(`ai:${user?.id}`, 20, 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "AI 请求过于频繁，请稍后再试" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  const validation = validateDeepSeekApiKey();
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 503 }
    );
  }

  // 支持 ?stream=false 降级为非流式模式
  const { searchParams } = new URL(request.url);
  const useStream = searchParams.get("stream") !== "false";

  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages 参数无效" }, { status: 400 });
    }

    const allMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...messages,
    ];

    // ── 非流式降级模式 ───────────────────────────────────────────────
    if (!useStream) {
      const content = await callDeepSeek(allMessages);
      return NextResponse.json({ content });
    }

    // ── SSE 流式模式（默认） ─────────────────────────────────────────
    const stream = await callDeepSeekStream(allMessages);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI route error:", error);
    return NextResponse.json({ error: "服务端内部错误" }, { status: 500 });
  }
}
