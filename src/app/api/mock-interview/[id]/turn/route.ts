import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
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

function parseDeepSeekJSON(content: string): Record<string, unknown> {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
  return JSON.parse(jsonString);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  // 每一轮追问都会消耗 DeepSeek 配额，按用户限流
  const rl = rateLimit(`mock-interview-turn:${user!.id}`, 20, 60 * 1000);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "回答提交过于频繁，请稍后再试" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rateLimitHeaders(rl) },
    });
  }

  // ── Validate & prepare (non-streaming, returns JSON on error) ──────────────
  const { id } = await params;
  const body = await request.json();
  const { answer } = body;

  const jsonError = (msg: string, status: number) =>
    new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  if (!answer || typeof answer !== "string") {
    return jsonError("请提供回答内容 (answer)", 400);
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === "sk-your-deepseek-api-key-here" || apiKey === "fake") {
    return jsonError("DEEPSEEK_API_KEY 未配置", 503);
  }

  const interview = await prisma.mockInterview.findUnique({
    where: { id },
    include: { turns: { orderBy: { turnOrder: "asc" } } },
  });

  if (!interview) return jsonError("面试不存在", 404);
  if (interview.status === "completed") return jsonError("该面试已结束", 400);

  // 归属验证：只能操作自己的面试
  if (interview.userId && interview.userId !== user?.id) {
    return jsonError("无权操作此面试", 403);
  }

  const currentTurn = interview.turns[interview.turns.length - 1];
  if (!currentTurn) return jsonError("面试轮次异常", 400);
  if (currentTurn.userAnswer) return jsonError("当前轮次已回答", 400);

  const directionLabel = getDirectionLabel(interview.direction);
  const currentTurnOrder = currentTurn.turnOrder;
  const isLastTurn = currentTurnOrder >= 5;
  const isBehavioral = interview.direction === "behavioral";

  // Build conversation history
  const conversationHistory = interview.turns.flatMap((turn) => [
    { role: "assistant" as const, content: turn.aiQuestion },
    ...(turn.userAnswer ? [{ role: "user" as const, content: turn.userAnswer }] : []),
  ]);

  // Save user answer
  await prisma.mockInterviewTurn.update({
    where: { id: currentTurn.id },
    data: { userAnswer: answer },
  });

  // Build evaluation prompt based on direction type
  let systemPrompt: string;

  if (isBehavioral) {
    systemPrompt = `你是一位资深的行为面试官，正在进行一场行为面试。
你的核心任务是引导候选人使用 **STAR 法则** 回答问题，并评价回答质量。

## STAR 法则说明
- **S (Situation 情境)**：描述具体的背景和场景
- **T (Task 任务)**：明确面临的任务或挑战
- **A (Action 行动)**：详细描述你采取的具体行动
- **R (Result 结果)**：量化或具体化最终结果

## 面试规则
1. 每次只问一个问题，等候选人回答后再追问或进入下一题
2. 问题要围绕软技能：领导力、团队协作、冲突解决、抗压能力、沟通表达、创新主动性等
3. 如果候选人的回答缺少 STAR 某个维度，要在反馈中明确指出并引导补充
4. 保持专业但友善的语气

## 评分标准（1-10分）
- **完整性（40%）**：是否覆盖了 STAR 四个维度
- **具体性（25%）**：是否有具体的例子和数据支撑
- **逻辑性（20%）**：叙述结构是否清晰、因果关系合理
- **表达力（15%）**：语言表达是否清晰、自信、有条理`;
  } else {
    systemPrompt = `你是一位资深技术面试官，正在进行一场${directionLabel}方向的模拟面试。
规则：
1. 每次只问一个问题，等候选人回答后再追问或进入下一题
2. 问题要循序渐进，从基础到深入
3. 根据候选人的回答进行有针对性的追问
4. 保持专业但友善的语气`;
  }

  const evaluationPrompt = isLastTurn
    ? (isBehavioral
        ? `候选人对当前问题的回答是：
"${answer}"

这是第${currentTurnOrder}轮行为面试（最后一轮）。请按照 STAR 法则评价这个回答，并给出整场面试的总结。

请严格按照以下JSON格式返回（不要包含其他内容）：
{
  "feedback": "对当前回答的详细评价，包括STAR各维度的覆盖情况、优点和改进建议",
  "score": 7,
  "isComplete": true,
  "overallScore": 75,
  "summary": "行为面试总结报告，包括软技能优势、不足和提升建议"
}

其中 score 是对当前这个回答的评分（1-10），overallScore 是整场面试的综合评分（0-100）。`
        : `候选人对当前问题的回答是：
"${answer}"

这是第${currentTurnOrder}轮面试（最后一轮）。请评价这个回答，并给出整场面试的总结。

请严格按照以下JSON格式返回（不要包含其他内容）：
{
  "feedback": "对当前回答的详细评价和改进建议",
  "score": 7,
  "isComplete": true,
  "overallScore": 75,
  "summary": "面试总结报告，包括优势、不足和改进建议"
}

其中 score 是对当前这个回答的评分（1-10），overallScore 是整场面试的综合评分（0-100）。`)
    : (isBehavioral
        ? `候选人对当前问题的回答是：
"${answer}"

这是第${currentTurnOrder}轮行为面试。请按照 STAR 法则评价这个回答，并提出下一个行为面试问题。

请严格按照以下JSON格式返回（不要包含其他内容）：
{
  "feedback": "对回答的详细评价，包括STAR完整性分析、具体性评估和改进建议",
  "score": 7,
  "nextQuestion": "下一个行为面试问题（围绕领导力、团队协作、冲突解决、抗压能力、沟通表达、创新主动性等主题）",
  "isComplete": false
}

其中 score 是对当前这个回答的评分（1-10），重点考察完整性、具体性、逻辑性和表达力。`
        : `候选人对当前问题的回答是：
"${answer}"

这是第${currentTurnOrder}轮面试。请评价这个回答，并提出下一个面试问题。

请严格按照以下JSON格式返回（不要包含其他内容）：
{
  "feedback": "对回答的详细评价和改进建议",
  "score": 7,
  "nextQuestion": "下一个面试问题",
  "isComplete": false
}

其中 score 是对当前这个回答的评分（1-10）。`);

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(0, -1),
    { role: "user", content: evaluationPrompt },
  ];

  // ── Start SSE streaming response ──────────────────────────────────────────
  const dsResponse = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      stream: true,
      temperature: 0.7,
    }),
  });

  if (!dsResponse.ok) {
    const errorText = await dsResponse.text();
    return jsonError(`DeepSeek API 错误: ${dsResponse.status} - ${errorText}`, 502);
  }

  const dsBody = dsResponse.body!;
  const dsReader = dsBody.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullFeedback = "";

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();

      try {
        // ── 1. Stream the evaluation feedback ───────────────────────────────
        while (true) {
          const { done, value } = await dsReader.read();
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
                fullFeedback += content;
                controller.enqueue(
                  enc.encode(sse({ event: "feedback", content }))
                );
              }
            } catch {
              /* skip */
            }
          }
        }

        // ── 2. Parse the accumulated JSON ───────────────────────────────────
        let parsed: {
          feedback: string;
          score: number;
          nextQuestion?: string;
          isComplete: boolean;
          overallScore?: number;
          summary?: string;
        };

        try {
          parsed = parseDeepSeekJSON(fullFeedback) as typeof parsed;
        } catch {
          controller.enqueue(
            enc.encode(sse({ event: "error", message: "AI 返回了无法解析的内容" }))
          );
          controller.close();
          return;
        }

        // ── 3. Save feedback & score to DB ──────────────────────────────────
        await prisma.mockInterviewTurn.update({
          where: { id: currentTurn.id },
          data: { aiFeedback: parsed.feedback, score: parsed.score },
        });

        // ── 4. Handle interview completion or next question ─────────────────
        if (isLastTurn || parsed.isComplete) {
          await prisma.mockInterview.update({
            where: { id },
            data: {
              status: "completed",
              endedAt: new Date(),
              overallScore: parsed.overallScore ?? null,
              summary: parsed.summary ?? null,
            },
          });

          controller.enqueue(
            enc.encode(
              sse({
                event: "done",
                score: parsed.score,
                status: "completed",
                overallScore: parsed.overallScore ?? null,
                summary: parsed.summary ?? null,
              })
            )
          );
        } else {
          const nextQuestion = parsed.nextQuestion ?? "请继续。";

          await prisma.mockInterviewTurn.create({
            data: {
              mockInterviewId: id,
              aiQuestion: nextQuestion,
              turnOrder: currentTurnOrder + 1,
            },
          });

          controller.enqueue(
            enc.encode(
              sse({
                event: "done",
                score: parsed.score,
                status: "in-progress",
                nextQuestion,
              })
            )
          );
        }

        controller.close();
      } catch (error) {
        console.error("Streaming error:", error);
        controller.enqueue(
          enc.encode(sse({ event: "error", message: "处理面试回答时出错" }))
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
}
