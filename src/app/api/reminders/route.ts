import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// 艾宾浩斯遗忘曲线间隔（天）
const SPACED_INTERVALS = [1, 3, 7, 15, 30];

export const dynamic = "force-dynamic";

// GET /api/reminders — 获取待复习题目列表
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // 若用户关闭了学习提醒，直接返回空列表
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { reminderEnabled: true },
    });
    if (!user?.reminderEnabled) {
      return NextResponse.json({ reminders: [], total: 0 });
    }

    // 获取该用户的练习记录，按题目分组取最新一次
    const practiceRecords = await prisma.practiceHistory.groupBy({
      by: ["questionId"],
      _max: { attemptedAt: true },
      where: {
        userId,
      },
    });

    if (practiceRecords.length === 0) {
      return NextResponse.json({ reminders: [], total: 0 });
    }

    // 一次性获取所有题目的练习次数（避免 N+1 查询）
    const practiceCounts = await prisma.practiceHistory.groupBy({
      by: ["questionId"],
      where: { userId },
      _count: { id: true },
    });
    const countMap = new Map(practiceCounts.map((c) => [c.questionId, c._count.id]));

    const now = new Date();
    const reminders = [];

    for (const record of practiceRecords) {
      const lastPractice = record._max.attemptedAt!;
      const daysSinceLastPractice = Math.floor(
        (now.getTime() - lastPractice.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 从预查询的 Map 中获取练习次数
      const practiceCount = countMap.get(record.questionId) ?? 0;

      // 根据已练习次数确定下一个复习间隔
      // 第1次练习后：1天
      // 第2次练习后：3天
      // 以此类推...
      const nextIntervalIndex = Math.min(practiceCount, SPACED_INTERVALS.length - 1);
      const nextReviewDays = SPACED_INTERVALS[nextIntervalIndex];

      // 判断是否到达或超过下次复习时间
      if (daysSinceLastPractice >= nextReviewDays) {
        const question = await prisma.question.findUnique({
          where: { id: record.questionId },
          select: {
            id: true,
            title: true,
            difficulty: true,
            questionType: true,
            company: true,
          },
        });

        if (question) {
          const nextReviewDate = new Date(lastPractice);
          nextReviewDate.setDate(nextReviewDate.getDate() + nextReviewDays);

          reminders.push({
            ...question,
            lastPracticeAt: lastPractice.toISOString(),
            daysSinceLastPractice,
            nextReviewIn: Math.max(0, nextReviewDays - daysSinceLastPractice),
            nextReviewAt: nextReviewDate.toISOString(),
            practiceCount,
            intervalLevel: nextIntervalIndex + 1,
          });
        }
      }
    }

    // 按紧急程度排序（超过最久的优先）
    reminders.sort((a, b) => b.daysSinceLastPractice - a.daysSinceLastPractice);

    return NextResponse.json({
      reminders,
      total: reminders.length,
    });
  } catch (error) {
    console.error("GET /api/reminders error:", error);
    return NextResponse.json(
      { error: "获取复习提醒失败" },
      { status: 500 }
    );
  }
}

// POST /api/reminders — 标记复习完成
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    const { questionId, status = "completed", durationSeconds } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: "缺少 questionId 参数" },
        { status: 400 }
      );
    }

    // 检查题目是否存在
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: "题目不存在" },
        { status: 404 }
      );
    }

    // 创建新的练习记录（标记本次复习完成）
    const newRecord = await prisma.practiceHistory.create({
      data: {
        questionId,
        status,
        durationSeconds: durationSeconds ?? null,
        userId,
      },
    });

    // 计算下一次复习间隔
    const practiceCount = await prisma.practiceHistory.count({
      where: { questionId, userId },
    });

    const nextIntervalIndex = Math.min(practiceCount, SPACED_INTERVALS.length - 1);
    const nextReviewDays = SPACED_INTERVALS[nextIntervalIndex];

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextReviewDays);

    // 判断是否已完成所有复习周期
    const isFullyReviewed = practiceCount >= SPACED_INTERVALS.length;

    return NextResponse.json({
      success: true,
      practiceRecord: newRecord,
      nextReviewAt: isFullyReviewed ? null : nextReviewDate.toISOString(),
      nextReviewDays: isFullyReviewed ? null : nextReviewDays,
      practiceCount,
      intervalLevel: nextIntervalIndex + 1,
      isFullyReviewed,
      message: isFullyReviewed
        ? "🎉 恭喜！该题目已完成全部复习周期"
        : `✅ 复习完成！下次复习时间：${nextReviewDays} 天后`,
    });
  } catch (error) {
    console.error("POST /api/reminders error:", error);
    return NextResponse.json(
      { error: "标记复习失败" },
      { status: 500 }
    );
  }
}

// POST /api/reminders/generate — 批量生成复习计划
export async function PUT() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // 获取当前用户所有有练习记录的题目
    const practicedQuestions = await prisma.practiceHistory.findMany({
      where: { userId },
      select: { questionId: true },
      distinct: ["questionId"],
    });

    if (practicedQuestions.length === 0) {
      return NextResponse.json({
        message: "暂无练习记录",
        generatedPlans: 0,
      });
    }

    const now = new Date();
    const reviewPlans = [];

    for (const { questionId } of practicedQuestions) {
      const records = await prisma.practiceHistory.findMany({
        where: { questionId, userId },
        orderBy: { attemptedAt: "desc" },
      });

      const lastPractice = records[0].attemptedAt;
      const practiceCount = records.length;
      const nextIntervalIndex = Math.min(practiceCount, SPACED_INTERVALS.length - 1);
      const nextReviewDays = SPACED_INTERVALS[nextIntervalIndex];
      const daysSinceLastPractice = Math.floor(
        (now.getTime() - lastPractice.getTime()) / (1000 * 60 * 60 * 24)
      );

      const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { id: true, title: true, difficulty: true },
      });

      if (question) {
        const nextReviewDate = new Date(lastPractice);
        nextReviewDate.setDate(nextReviewDate.getDate() + nextReviewDays);

        reviewPlans.push({
          questionId: question.id,
          title: question.title,
          difficulty: question.difficulty,
          lastPracticeAt: lastPractice.toISOString(),
          practiceCount,
          currentInterval: SPACED_INTERVALS[nextIntervalIndex - 1] ?? 0,
          nextInterval: nextReviewDays,
          nextReviewAt: nextReviewDate.toISOString(),
          isDue: daysSinceLastPractice >= nextReviewDays,
          daysOverdue: Math.max(0, daysSinceLastPractice - nextReviewDays),
        });
      }
    }

    // 按 overdue 程度排序
    reviewPlans.sort((a, b) => b.daysOverdue - a.daysOverdue);

    return NextResponse.json({
      message: `成功生成 ${reviewPlans.length} 条复习计划`,
      generatedPlans: reviewPlans.length,
      plans: reviewPlans,
      summary: {
        total: reviewPlans.length,
        dueNow: reviewPlans.filter((p) => p.isDue).length,
        upcoming: reviewPlans.filter((p) => !p.isDue).length,
      },
    });
  } catch (error) {
    console.error("PUT /api/reminders/generate error:", error);
    return NextResponse.json(
      { error: "生成复习计划失败" },
      { status: 500 }
    );
  }
}
