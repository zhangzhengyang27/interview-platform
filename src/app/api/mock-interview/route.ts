import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRandomBehavioralQuestions } from "@/lib/behavioral-questions";
import { requireAuth, getCurrentUser } from "@/lib/session";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const DIRECTION_LABELS: Record<string, string> = {
  java: "Java",
  frontend: "前端",
  backend: "后端",
  algorithm: "算法",
  "system-design": "系统设计",
  python: "Python",
  general: "通用",
};

function getDirectionLabel(direction: string): string {
  return DIRECTION_LABELS[direction] ?? direction;
}

function sse(obj: Record<string, unknown>): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  // 每场面试都会消耗 DeepSeek 配额，按用户限流
  const rl = rateLimit(`mock-interview:${user!.id}`, 10, 60 * 1000);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "创建过于频繁，请稍后再试" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rateLimitHeaders(rl) },
    });
  }

  try {
    const body = await request.json();
    const { direction } = body;

    if (!direction || typeof direction !== "string") {
      return new Response(JSON.stringify({ error: "请提供面试方向 (direction)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey || apiKey === "sk-your-deepseek-api-key-here" || apiKey === "fake") {
      return new Response(
        JSON.stringify({ error: "DEEPSEEK_API_KEY 未配置，请在 .env 文件中设置有效的 API Key" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const directionLabel = getDirectionLabel(direction);
    const isBehavioral = direction === "behavioral";

    // Create the mock interview record
    const interview = await prisma.mockInterview.create({
      data: { direction, status: "in-progress", userId: user?.id },
    });

    // For behavioral interviews, use question bank instead of AI generation
    if (isBehavioral) {
      const [randomQuestion] = getRandomBehavioralQuestions(1);

      // Save the behavioral question to DB
      await prisma.mockInterviewTurn.create({
        data: {
          mockInterviewId: interview.id,
          aiQuestion: randomQuestion.question,
          turnOrder: 1,
        },
      });

      // Return SSE with the pre-selected question
      const header = sse({ event: "interview", id: interview.id });
      const chunkEvent = sse({ event: "chunk", content: randomQuestion.question });
      const doneEvent = sse({ event: "done" });

      return new Response(
        new ReadableStream({
          start(controller) {
            const enc = new TextEncoder();
            controller.enqueue(enc.encode(header));
            // Simulate streaming by splitting the question
            setTimeout(() => {
              controller.enqueue(enc.encode(chunkEvent));
              setTimeout(() => {
                controller.enqueue(enc.encode(doneEvent));
                controller.close();
              }, 100);
            }, 50);
          },
        }),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        }
      );
    }

    // Build the prompt for non-behavioral interviews
    const systemPrompt = `你是一位资深技术面试官，正在进行一场${directionLabel}方向的模拟面试。
规则：
1. 每次只问一个问题，等候选人回答后再追问或进入下一题
2. 问题要循序渐进，从基础到深入
3. 根据候选人的回答进行有针对性的追问
4. 保持专业但友善的语气`;

    // Call DeepSeek with streaming
    const dsResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `请开始这场${directionLabel}方向的模拟面试，提出第一个面试问题。只需要提出问题，不需要额外的解释。`,
          },
        ],
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!dsResponse.ok) {
      const errorText = await dsResponse.text();
      return new Response(
        JSON.stringify({ error: `DeepSeek API 错误: ${dsResponse.status} - ${errorText}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const dsBody = dsResponse.body!;
    const reader = dsBody.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullQuestion = "";

    // Send interview ID first
    const header = sse({ event: "interview", id: interview.id });

    const stream = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        controller.enqueue(enc.encode(header));

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") continue;

              try {
                const parsed = JSON.parse(payload);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullQuestion += content;
                  controller.enqueue(
                    enc.encode(sse({ event: "chunk", content }))
                  );
                }
              } catch {
                /* skip malformed lines */
              }
            }
          }

          // Save the complete question to DB
          await prisma.mockInterviewTurn.create({
            data: {
              mockInterviewId: interview.id,
              aiQuestion: fullQuestion,
              turnOrder: 1,
            },
          });

          controller.enqueue(enc.encode(sse({ event: "done" })));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(
            enc.encode(sse({ event: "error", message: "生成问题失败" }))
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Failed to create mock interview:", error);
    const message = error instanceof Error ? error.message : "创建模拟面试失败";
    return new Response(JSON.stringify({ error: message }), {
      status: message.includes("DEEPSEEK_API_KEY") ? 503 : 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
