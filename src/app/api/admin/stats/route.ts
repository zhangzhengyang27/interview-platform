import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const [
      totalUsers,
      totalQuestions,
      totalCategories,
      totalContests,
      totalPracticeHistory,
      totalComments,
      pendingReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.question.count(),
      prisma.category.count(),
      prisma.contest.count(),
      prisma.practiceHistory.count(),
      prisma.comment.count(),
      prisma.report.count({ where: { status: 'pending' } }),
    ]);

    // 今日新增用户
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // 近30天每日刷题数
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentPractice = await prisma.practiceHistory.findMany({
      where: {
        attemptedAt: { gte: thirtyDaysAgo },
      },
      select: { attemptedAt: true },
      orderBy: { attemptedAt: 'asc' },
    });

    // 按日期分组
    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }
    for (const p of recentPractice) {
      const key = p.attemptedAt.toISOString().split('T')[0];
      if (dailyMap[key] !== undefined) {
        dailyMap[key]++;
      }
    }
    const dailyPracticeTrend = Object.entries(dailyMap).map(([date, count]) => ({
      date,
      count,
    }));

    // 难度分布
    const [easyCount, mediumCount, hardCount] = await Promise.all([
      prisma.question.count({ where: { difficulty: 'easy' } }),
      prisma.question.count({ where: { difficulty: 'medium' } }),
      prisma.question.count({ where: { difficulty: 'hard' } }),
    ]);
    const difficultyDistribution = [
      { name: '简单', value: easyCount },
      { name: '中等', value: mediumCount },
      { name: '困难', value: hardCount },
    ];

    // 分类分布
    const categoryStats = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { questions: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    const categoryDistribution = categoryStats
      .filter((c) => c._count?.questions > 0)
      .map((c) => ({ id: c.id, name: c.name, value: c._count.questions }))
      .sort((a, b) => b.value - a.value);

    return NextResponse.json({
      totalUsers,
      totalQuestions,
      totalCategories,
      totalContests,
      totalPracticeHistory,
      totalComments,
      pendingReports,
      recentUsers,
      dailyPracticeTrend,
      difficultyDistribution,
      categoryDistribution,
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 });
  }
}
