import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contestId } = await params;

    // 验证竞赛存在
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      select: { id: true, title: true, status: true },
    });

    if (!contest) {
      return NextResponse.json({ error: "竞赛不存在" }, { status: 404 });
    }

    // 获取所有提交，按用户分组统计
    const submissions = await prisma.contestSubmission.groupBy({
      by: ["userId"],
      where: { contestId },
      _sum: { score: true },
      _count: { id: true },
      _max: { submittedAt: true },
      orderBy: { _sum: { score: "desc" } },
    });

    // 获取用户信息
    const userIds = submissions.map((s) => s.userId).filter(Boolean) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // 统计每个用户的解题数（去重）
    const uniqueSolves = await prisma.contestSubmission.groupBy({
      by: ["userId", "questionId"],
      where: {
        contestId,
        status: "accepted",
      },
    });

    const solveCountMap = new Map<string, number>();
    for (const solve of uniqueSolves) {
      if (solve.userId) {
        solveCountMap.set(solve.userId, (solveCountMap.get(solve.userId) || 0) + 1);
      }
    }

    const leaderboard = submissions
      .map((s, index) => ({
        rank: index + 1,
        userId: s.userId,
        userName: s.userId ? userMap.get(s.userId)?.name ?? "匿名用户" : "匿名用户",
        userImage: s.userId ? userMap.get(s.userId)?.image ?? null : null,
        totalScore: s._sum.score ?? 0,
        solvedCount: s.userId ? (solveCountMap.get(s.userId) ?? 0) : 0,
        submissionCount: s._count.id,
        lastSubmitTime: s._max.submittedAt,
      }))
      .sort((a, b) => {
        // 先按总分降序，再按解题数降序，最后按时间升序
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
        return a.lastSubmitTime!.getTime() - b.lastSubmitTime!.getTime();
      })
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return NextResponse.json({
      contestId,
      contestTitle: contest.title,
      contestStatus: contest.status,
      leaderboard,
      totalParticipants: leaderboard.length,
    });
  } catch (error) {
    console.error("GET /api/contests/[id]/leaderboard error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
