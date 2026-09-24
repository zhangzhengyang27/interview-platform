import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const userId = session.user.id;

  // 从数据库查询当前用户的能力数据
  const practiceHistory = await prisma.practiceHistory.findMany({
    where: { userId },
    include: {
      question: {
        include: {
          category: true,
          tags: true,
        },
      },
    },
    orderBy: {
      attemptedAt: "desc",
    },
  });

  // 根据练习历史计算各领域得分
  const categoryScores: Record<string, { correct: number; total: number }> = {
    算法: { correct: 0, total: 0 },
    前端: { correct: 0, total: 0 },
    后端: { correct: 0, total: 0 },
    数据库: { correct: 0, total: 0 },
    系统设计: { correct: 0, total: 0 },
  };

  practiceHistory.forEach((history) => {
    const category = history.question.category?.name || "前端";
    if (!categoryScores[category]) {
      categoryScores[category] = { correct: 0, total: 0 };
    }
    categoryScores[category].total++;
    if (history.status === "completed") {
      categoryScores[category].correct++;
    }
  });

  // 计算各领域得分（正确率 * 100，最高100分）
  const abilityData = Object.entries(categoryScores).map(([subject, data]) => ({
    subject,
    score: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    fullMark: 100,
  }));

  // 查询最近30天的每日做题数
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const dailyStats = await prisma.practiceHistory.groupBy({
    by: ["attemptedAt"],
    where: {
      userId,
      attemptedAt: {
        gte: thirtyDaysAgo,
      },
    },
    _count: {
      id: true,
    },
  });

  // 生成30天的进度数据
  const progressData: Array<{ date: string; count: number }> = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split("T")[0];

    const stat = dailyStats.find(
      (s) => s.attemptedAt.toISOString().split("T")[0] === dateStr
    );

    progressData.push({
      date: dateStr,
      count: stat?._count.id || 0,
    });
  }

  return NextResponse.json({ abilityData, progressData });
}
