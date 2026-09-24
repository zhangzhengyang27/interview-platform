import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { computeStreakStats } from "@/lib/streak";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const userId = session.user.id;

  const totalPractices = await prisma.practiceHistory.count({ where: { userId } });
  const completedCount = await prisma.practiceHistory.count({ where: { userId, status: "completed" } });
  const masteredCount = await prisma.question.count({ where: { mastery: "mastered" } });

  // 连续打卡数据从当前用户的 PracticeHistory 推导
  let streakData = { currentStreak: 0, longestStreak: 0 };
  try {
    streakData = await computeStreakStats(userId);
  } catch {}

  const easyCount = await prisma.question.count({ where: { difficulty: "easy" } });
  const mediumCount = await prisma.question.count({ where: { difficulty: "medium" } });
  const hardCount = await prisma.question.count({ where: { difficulty: "hard" } });
  const accuracyRate = totalPractices > 0 ? Math.round((completedCount / totalPractices) * 100) : 0;

  return NextResponse.json({
    overview: { totalPractices, completedCount, masteredCount, accuracyRate, currentStreak: streakData.currentStreak || 0 },
    difficultyDistribution: [
      { name: "简单", value: easyCount },
      { name: "中等", value: mediumCount },
      { name: "困难", value: hardCount },
    ],
    suggestions: generateSuggestions(accuracyRate, masteredCount, streakData.currentStreak),
  });
}

function generateSuggestions(accuracy: number, mastered: number, streak: number | undefined): string[] {
  const s: string[] = [];
  if (accuracy < 60) s.push("正确率偏低，建议先巩固基础题目再挑战高难度");
  if (mastered < 5) s.push("已掌握题目较少，建议每天完成至少 3 道练习");
  if (!streak || streak < 3) s.push("连续打卡天数较少，坚持每日学习效果更好");
  if (accuracy >= 80 && mastered >= 10) s.push("表现优秀！可以尝试更多难题提升能力");
  return s;
}
