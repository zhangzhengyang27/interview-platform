import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";
import { computeStreakStats } from "@/lib/streak";

export const dynamic = "force-dynamic";

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  /** 当前进度值 */
  progress: number;
  /** 达成所需值 */
  target: number;
  achieved: boolean;
}

/** 成就规则（纯数据，达成判定即时计算，无需建表） */
function buildAchievements(stats: {
  practiceCount: number;
  currentStreak: number;
  solutionCount: number;
  masteredCount: number;
  followers: number;
}): Achievement[] {
  const def = (
    id: string,
    name: string,
    icon: string,
    description: string,
    progress: number,
    targets: [number, ...number[]]
  ): Achievement[] =>
    targets.map((target) => ({
      id: `${id}-${target}`,
      name,
      icon,
      description,
      progress,
      target,
      achieved: progress >= target,
    }));

  return [
    ...def("practice", "勤学不辍", "📚", "累计练习题次数", stats.practiceCount, [1, 50, 200, 500]),
    ...def("streak", "坚持打卡", "🔥", "连续打卡天数", stats.currentStreak, [3, 7, 30]),
    ...def("solution", "乐于分享", "✍️", "发布题解数", stats.solutionCount, [1, 10, 50]),
    ...def("mastered", "融会贯通", "🧠", "掌握题目数", stats.masteredCount, [10, 50, 100]),
    ...def("followers", "备受信赖", "⭐", "粉丝数", stats.followers, [1, 10, 50]),
  ];
}

// GET /api/achievements — 当前用户的成就进度（即时计算，无表）
export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();
  const userId = user!.id;

  try {
    const [practiceCount, solutionCount, masteredCount, followers, streak] =
      await Promise.all([
        prisma.practiceHistory.count({ where: { userId } }),
        prisma.solution.count({ where: { userId } }),
        prisma.userQuestionState.count({ where: { userId, mastery: "mastered" } }),
        prisma.follow.count({ where: { followingId: userId } }),
        computeStreakStats(userId).catch(() => ({ currentStreak: 0, longestStreak: 0 })),
      ]);

    const achievements = buildAchievements({
      practiceCount,
      currentStreak: streak.currentStreak,
      solutionCount,
      masteredCount,
      followers,
    });

    return NextResponse.json({
      achievements,
      achievedCount: achievements.filter((a) => a.achieved).length,
      total: achievements.length,
    });
  } catch (error) {
    console.error("GET /api/achievements error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
