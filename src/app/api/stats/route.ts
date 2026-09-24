import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();
  const userId = user!.id;

  try {
    const [total, mastered, learning, recentHistory, errorStats] = await Promise.all([
      prisma.question.count(),
      // 掌握统计基于当前用户的个人状态（多用户数据隔离）
      prisma.userQuestionState.count({ where: { userId, mastery: "mastered" } }),
      prisma.userQuestionState.count({ where: { userId, mastery: "learning" } }),
      prisma.practiceHistory.findMany({
        where: { userId },
        orderBy: { attemptedAt: "desc" },
        take: 10,
        include: { question: { include: { tags: true } } },
      }),
      prisma.practiceHistory.groupBy({
        by: ["questionId"],
        where: { status: "failed", userId },
        _count: true,
        orderBy: { _count: { questionId: "desc" } },
        take: 5,
      }),
    ]);

    // Get question titles for error stats
    const errorQuestionIds = errorStats.map((s) => s.questionId);
    const errorQuestions = await prisma.question.findMany({
      where: { id: { in: errorQuestionIds } },
      select: { id: true, title: true },
    });

    const topErrors = errorStats.map((s) => ({
      questionId: s.questionId,
      count: s._count,
      title: errorQuestions.find((q) => q.id === s.questionId)?.title ?? "",
    }));

    return NextResponse.json({
      total,
      mastered,
      unsolved: total - mastered - learning,
      recentHistory,
      topErrors,
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
