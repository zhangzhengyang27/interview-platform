import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateDeepSeekApiKey, callDeepSeekStream } from "@/lib/deepseek";
import { requireAuth, getCurrentUser } from "@/lib/session";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const REVIEW_SYSTEM_PROMPT = `你是一位资深技术面试官，擅长代码审查和技术评估。请以建设性、鼓励性的语气对用户提交的代码进行专业审查。

审查要求：
1. 先给出总体评分（1-10分）和总体评价
2. 然后分以下维度详细分析：
   - **正确性 (Correctness)**：逻辑是否正确，边界条件是否考虑
   - **时间复杂度 (Time Complexity)**：算法效率分析
   - **空间复杂度 (Space Complexity)**：内存使用分析
   - **代码质量 (Code Quality)**：命名规范、可读性、最佳实践
   - **改进建议 (Suggestions)**：具体的优化建议
3. 最后如有明显可优化的地方，给出改进后的参考代码

输出格式规范：
- 使用 Markdown 格式
- 各维度用不同颜色的标签区分（用 emoji 标识）
- 语气要建设性、鼓励性
- 中文输出`;

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  const rl = rateLimit(`ai-review:${user?.id}`, 20, 60 * 1000);
  if (!rl.success) {
    return new Response(
      JSON.stringify({ error: "AI 请求过于频繁，请稍后再试" }),
      { status: 429, headers: { "Content-Type": "application/json", ...rateLimitHeaders(rl) } }
    );
  }

  const validation = validateDeepSeekApiKey();
  if (!validation.valid) {
    return new Response(
      JSON.stringify({ error: validation.error }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await request.json();
    const { code, language, questionId, questionTitle } = body;

    if (!code || !language) {
      return new Response(
        JSON.stringify({ error: "缺少必要参数: code, language" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 如果提供了题目ID，获取题目信息
    let questionContext = "";
    if (questionId) {
      try {
        const question = await prisma.question.findUnique({
          where: { id: questionId },
          select: {
            title: true,
            content: true,
            solution: true,
          },
        });

        if (question) {
          questionContext = `

【题目信息】
题目标题：${question.title || questionTitle || "未知"}
题目描述：
${question.content?.slice(0, 2000) || "无"}

${question.solution ? `参考答案：
${question.solution.slice(0, 2000)}` : ""}`;
        }
      } catch {
        // 获取题目信息失败不影响审查流程
        console.warn("Failed to fetch question info for review");
      }
    }

    // 构造用户消息
    const userMessage = `请审查以下${language}代码：${questionContext ? `\n${questionContext}` : ""}

\`\`\`${language}
${code}
\`\`\`

请按照要求的格式进行全面的代码审查。`;

    // 调用 DeepSeek API（流式）
    const stream = await callDeepSeekStream(
      [
        { role: "system", content: REVIEW_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      { temperature: 0.7, max_tokens: 4096 }
    );

    // 创建 SSE 流式响应
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += new TextDecoder().decode(value, { stream: true });
            const parts = buffer.split("\n\n");
            buffer = parts.pop() ?? "";

            for (const part of parts) {
              if (!part.startsWith("data: ")) continue;
              if (part.includes("[DONE]")) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ event: "done" })}\n\n`)
                );
                continue;
              }

              try {
                const data = JSON.parse(part.slice(6));
                const content = data.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ event: "review", content })}\n\n`
                    )
                  );
                }
              } catch {
                // skip malformed chunks
              }
            }
          }

          // 发送完成事件
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ event: "done" })}\n\n`)
          );
        } catch (error) {
          console.error("Stream processing error:", error);
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
    console.error("AI code review route error:", error);
    return new Response(
      JSON.stringify({ error: "服务端内部错误" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
