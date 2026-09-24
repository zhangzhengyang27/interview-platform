import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const by = searchParams.get("by") ?? "solved";
    const period = searchParams.get("period") ?? "all";

    // 构建时间过滤条件
    let dateFilter: Record<string, unknown> = {};
    if (period !== "all") {
      const now = new Date();
      if (period === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: weekAgo };
      } else if (period === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = { gte: monthAgo };
      }
    }

    let leaderboard;

    switch (by) {
      case "solved": {
        // 解题数排行
        const solvedStats = await prisma.practiceHistory.groupBy({
          by: ["userId"],
          where: {
            ...(period !== "all" ? { attemptedAt: dateFilter } : {}),
            status: "completed",
          },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 100,
        });

        const userIds = solvedStats.map((s) => s.userId).filter(Boolean) as string[];
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, image: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));

        leaderboard = solvedStats.map((s, index) => ({
          rank: index + 1,
          userId: s.userId,
          userName: s.userId ? userMap.get(s.userId)?.name ?? "匿名用户" : "匿名用户",
          userImage: s.userId ? userMap.get(s.userId)?.image ?? null : null,
          value: s._count.id,
        }));
        break;
      }

      case "submissions": {
        // 提交数排行
        const subStats = await prisma.practiceHistory.groupBy({
          by: ["userId"],
          where: {
            ...(period !== "all" ? { attemptedAt: dateFilter } : {}),
          },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 100,
        });

        const userIds = subStats.map((s) => s.userId).filter(Boolean) as string[];
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, image: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));

        leaderboard = subStats.map((s, index) => ({
          rank: index + 1,
          userId: s.userId,
          userName: s.userId ? userMap.get(s.userId)?.name ?? "匿名用户" : "匿名用户",
          userImage: s.userId ? userMap.get(s.userId)?.image ?? null : null,
          value: s._count.id,
        }));
        break;
      }

      case "accuracy": {
        // 正确率排行
        const allStats = await prisma.practiceHistory.groupBy({
          by: ["userId", "status"],
          where: {
            ...(period !== "all" ? { attemptedAt: dateFilter } : {}),
          },
          _count: { id: true },
        });

        // 按用户聚合计算正确率
        const userAccuracyMap = new Map<
          string,
          { completed: number; total: number; userId: string | null }
        >();

        for (const stat of allStats) {
          const existing = userAccuracyMap.get(stat.userId ?? "") || {
            completed: 0,
            total: 0,
            userId: stat.userId,
          };

          if (stat.status === "completed") {
            existing.completed += stat._count.id;
          }
          existing.total += stat._count.id;
          userAccuracyMap.set(stat.userId ?? "", existing);
        }

        const accuracyList = Array.from(userAccuracyMap.values())
          .filter((u) => u.total >= 5) // 至少5次提交才有意义
          .map((u) => ({
            ...u,
            accuracy: Math.round((u.completed / u.total) * 10000) / 100,
          }))
          .sort((a, b) => b.accuracy - a.accuracy)
          .slice(0, 100);

        const userIds = accuracyList.map((a) => a.userId).filter(Boolean) as string[];
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, image: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));

        leaderboard = accuracyList.map((a, index) => ({
          rank: index + 1,
          userId: a.userId,
          userName: a.userId ? userMap.get(a.userId)?.name ?? "匿名用户" : "匿名用户",
          userImage: a.userId ? userMap.get(a.userId)?.image ?? null : null,
          value: a.accuracy,
        }));
        break;
      }

      default:
        return NextResponse.json({ error: "不支持的排序维度" }, { status: 400 });
    }

    return NextResponse.json({
      leaderboard,
      by,
      period,
      totalUsers: leaderboard.length,
    });
  } catch (error) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
