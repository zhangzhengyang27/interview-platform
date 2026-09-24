import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [total, mastered, unsolved, recentHistory, errorStats] = await Promise.all([
      prisma.question.count(),
      prisma.question.count({ where: { mastery: "mastered" } }),
      prisma.question.count({ where: { mastery: "unsolved" } }),
      prisma.practiceHistory.findMany({
        orderBy: { attemptedAt: "desc" },
        take: 10,
        include: { question: { include: { tags: true } } },
      }),
      prisma.practiceHistory.groupBy({
        by: ["questionId"],
        where: { status: "failed" },
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
      unsolved,
      recentHistory,
      topErrors,
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
