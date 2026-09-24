import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ALLOWED_DIRECTIONS = new Set([
  "java",
  "backend",
  "frontend",
  "algorithm",
  "system-design",
  "python",
  "general",
]);

const MAX_TURNS = 100;
const MAX_FIELD_LENGTH = 20000;

interface SavePayload {
  interviewId: string;
  direction: string;
  turns: { question: string; answer: string }[];
  overallScore?: number | null;
  summary?: string | null;
}

/**
 * 视频面试转写结果落库
 *
 * 视频面试结束后，前端将 SeedRealtime 对话的问答转写文本提交到此接口，
 * 统一写入 mockInterview / mockInterviewTurn，保证历史可回看。
 *
 * 鉴权：必须登录。interviewId 已存在时仅归属人可写入（防 IDOR 覆盖他人记录），
 * 不存在时作为新面试创建并归属当前用户。
 */
export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  const rl = rateLimit(`video-save:${user!.id}`, 30, 60 * 1000);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rateLimitHeaders(rl) },
    });
  }

  try {
    const body = (await request.json()) as SavePayload;

    if (!body.interviewId || typeof body.interviewId !== "string") {
      return new Response(JSON.stringify({ error: "参数不完整" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(body.turns)) {
      return new Response(JSON.stringify({ error: "turns 必须是数组" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (body.turns.length > MAX_TURNS) {
      return new Response(
        JSON.stringify({ error: `turns 数量超限（最多 ${MAX_TURNS} 条）` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 校验每个 turn 的字段类型与长度
    for (const turn of body.turns) {
      if (typeof turn.question !== "string" || typeof turn.answer !== "string") {
        return new Response(
          JSON.stringify({ error: "turns 项格式不正确" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      if (turn.question.length > MAX_FIELD_LENGTH || turn.answer.length > MAX_FIELD_LENGTH) {
        return new Response(
          JSON.stringify({ error: "turn 内容超长" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // direction 白名单校验（非法值回退 general）
    const direction =
      typeof body.direction === "string" && ALLOWED_DIRECTIONS.has(body.direction)
        ? body.direction
        : "general";

    // overallScore 校验：必须为 0-100 的整数
    let overallScore: number | null = null;
    if (body.overallScore != null) {
      const score = body.overallScore;
      if (typeof score === "number" && Number.isInteger(score) && score >= 0 && score <= 100) {
        overallScore = score;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      let interview = await tx.mockInterview.findUnique({
        where: { id: body.interviewId },
      });

      if (interview && interview.userId && interview.userId !== user!.id) {
        return null;
      }

      if (!interview) {
        interview = await tx.mockInterview.create({
          data: {
            id: body.interviewId,
            direction,
            status: "completed",
            userId: user!.id,
          },
        });
      } else if (!interview.userId) {
        // 历史匿名记录：本次写入即确立归属
        await tx.mockInterview.update({
          where: { id: interview.id },
          data: { userId: user!.id },
        });
      }

      // 清除旧转写，重新写入
      await tx.mockInterviewTurn.deleteMany({
        where: { mockInterviewId: body.interviewId },
      });

      for (let i = 0; i < body.turns.length; i++) {
        const turn = body.turns[i];
        await tx.mockInterviewTurn.create({
          data: {
            mockInterviewId: body.interviewId,
            aiQuestion: turn.question,
            userAnswer: turn.answer,
            turnOrder: i + 1,
          },
        });
      }

      await tx.mockInterview.update({
        where: { id: body.interviewId },
        data: {
          status: "completed",
          endedAt: new Date(),
          overallScore,
          summary:
            typeof body.summary === "string" ? body.summary.slice(0, MAX_FIELD_LENGTH) : null,
        },
      });

      return interview;
    });

    if (!result) {
      return new Response(JSON.stringify({ error: "无权写入此面试记录" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, interviewId: result.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Failed to save video interview:", error);
    return new Response(JSON.stringify({ error: "转写落库失败，请稍后重试" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
