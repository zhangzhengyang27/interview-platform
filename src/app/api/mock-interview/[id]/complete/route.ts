import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  try {
    const { id } = await params;

    const interview = await prisma.mockInterview.findUnique({
      where: { id },
      include: { turns: true },
    });

    if (!interview) {
      return new Response(JSON.stringify({ error: "面试不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 归属验证
    if (interview.userId && interview.userId !== user?.id) {
      return new Response(JSON.stringify({ error: "无权操作此面试" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (interview.status === "completed") {
      return new Response(
        JSON.stringify({ error: "面试已结束" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const scoredTurns = interview.turns.filter(
      (turn) => typeof turn.score === "number"
    );
    const overallScore =
      scoredTurns.length > 0
        ? Math.round(
            scoredTurns.reduce((sum, turn) => sum + (turn.score ?? 0), 0) /
              scoredTurns.length
          )
        : null;

    const completed = await prisma.mockInterview.update({
      where: { id },
      data: {
        status: "completed",
        endedAt: new Date(),
        overallScore,
        summary: overallScore
          ? `面试已结束，共 ${interview.turns.length} 轮问答，综合评分 ${overallScore} 分。`
          : `面试已结束，共 ${interview.turns.length} 轮问答。`,
      },
    });

    return new Response(JSON.stringify(completed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to complete mock interview:", error);
    const message = error instanceof Error ? error.message : "结束失败";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
