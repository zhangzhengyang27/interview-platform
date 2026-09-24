import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Convert a UTC Date to its Asia/Shanghai (UTC+8) calendar date string "YYYY-MM-DD". */
function toShanghaiDateStr(d: Date): string {
  const shanghai = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return shanghai.toISOString().split("T")[0];
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const userId = session.user.id;

    // ── Date boundaries in Asia/Shanghai (UTC+8) ──────────────────────────
    const now = new Date();
    const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

    // Shift UTC "now" into Shanghai time so we can read the calendar date
    const shanghaiNow = new Date(now.getTime() + SHANGHAI_OFFSET_MS);

    // Midnight Shanghai-time today, expressed as a UTC instant
    const todayStartUtc = new Date(
      Date.UTC(
        shanghaiNow.getUTCFullYear(),
        shanghaiNow.getUTCMonth(),
        shanghaiNow.getUTCDate()
      ) - SHANGHAI_OFFSET_MS
    );

    const weekAgoUtc = new Date(todayStartUtc.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgoUtc = new Date(todayStartUtc.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgoUtc = new Date(todayStartUtc.getTime() - 90 * 24 * 60 * 60 * 1000);

    // ── Parallel data fetch ───────────────────────────────────────────────
    const [
      dailyCount,
      weeklyCount,
      monthlyCount,
      recentPractices,
      heatmapPractices,
      masteryStats,
      uniqueQuestions,
    ] = await Promise.all([
      // Period counts
      prisma.practiceHistory.count({
        where: { userId, attemptedAt: { gte: todayStartUtc } },
      }),
      prisma.practiceHistory.count({
        where: { userId, attemptedAt: { gte: weekAgoUtc } },
      }),
      prisma.practiceHistory.count({
        where: { userId, attemptedAt: { gte: monthAgoUtc } },
      }),
      // Practices in last 30 days with question + category for distributions
      prisma.practiceHistory.findMany({
        where: { userId, attemptedAt: { gte: monthAgoUtc } },
        select: {
          question: {
            select: {
              difficulty: true,
              category: { select: { name: true } },
            },
          },
        },
      }),
      // Practices in last 90 days for heatmap
      prisma.practiceHistory.findMany({
        where: { userId, attemptedAt: { gte: ninetyDaysAgoUtc } },
        select: { attemptedAt: true },
      }),
      // Mastery breakdown across ALL questions
      prisma.question.groupBy({
        by: ["mastery"],
        _count: true,
      }),
      // Unique questions ever practiced by the current user
      prisma.practiceHistory.groupBy({
        by: ["questionId"],
        where: { userId },
      }),
    ]);

    // ── Category distribution (top 10) ────────────────────────────────────
    const categoryMap = new Map<string, number>();
    for (const p of recentPractices) {
      const name = p.question.category?.name;
      if (name) {
        categoryMap.set(name, (categoryMap.get(name) ?? 0) + 1);
      }
    }
    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── Difficulty distribution ───────────────────────────────────────────
    const difficultyMap = new Map<string, number>();
    for (const p of recentPractices) {
      const diff = p.question.difficulty;
      difficultyMap.set(diff, (difficultyMap.get(diff) ?? 0) + 1);
    }
    const difficultyDistribution = Array.from(difficultyMap.entries())
      .map(([difficulty, count]) => ({ difficulty, count }))
      .sort((a, b) => b.count - a.count);

    // ── Heatmap (last 90 days, include zero-count days) ───────────────────
    // Bucket practices by their Shanghai calendar date
    const practiceByDate = new Map<string, number>();
    for (const p of heatmapPractices) {
      const dateStr = toShanghaiDateStr(p.attemptedAt);
      practiceByDate.set(dateStr, (practiceByDate.get(dateStr) ?? 0) + 1);
    }

    // Generate all 90 day labels (oldest → today)
    const heatmap: { date: string; count: number }[] = [];
    for (let i = 89; i >= 0; i--) {
      const dayUtc = new Date(todayStartUtc.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = toShanghaiDateStr(dayUtc);
      heatmap.push({ date: dateStr, count: practiceByDate.get(dateStr) ?? 0 });
    }

    // ── Overall stats ─────────────────────────────────────────────────────
    const masteryLookup: Record<string, number> = {};
    for (const row of masteryStats) {
      masteryLookup[row.mastery] = row._count;
    }

    return NextResponse.json({
      dailyCount,
      weeklyCount,
      monthlyCount,
      categoryDistribution,
      difficultyDistribution,
      heatmap,
      overallStats: {
        totalSeen: uniqueQuestions.length,
        mastered: masteryLookup["mastered"] ?? 0,
        learning: masteryLookup["learning"] ?? 0,
        unsolved: masteryLookup["unsolved"] ?? 0,
      },
    });
  } catch (error) {
    console.error("GET /api/stats/extended error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
