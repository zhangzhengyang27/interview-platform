import { prisma } from "@/lib/prisma";

// 艾宾浩斯遗忘曲线间隔（天）
export const EBINGHAUS_INTERVALS = [1, 2, 4, 7, 15, 30];

export interface DueReviewItem {
  questionId: string;
  title: string;
  difficulty: string;
  categoryName: string | null;
  lastPracticedAt: Date;
  nextReviewAt: Date;
  daysOverdue: number;
  stage: number;
}

export interface ReviewSchedule {
  questionId: string;
  title: string;
  stages: {
    stage: number;
    intervalDays: number;
    scheduledAt: Date | null;
    completedAt: Date | null;
    isDue: boolean;
  }[];
}

/**
 * 根据最后复习日期和复习次数计算下次复习时间
 */
export function calculateNextReview(
  lastReviewDate: Date,
  reviewCount: number
): Date {
  const stage = Math.min(reviewCount, EBINGHAUS_INTERVALS.length - 1);
  const intervalDays = EBINGHAUS_INTERVALS[stage];
  const nextReview = new Date(lastReviewDate);
  nextReview.setDate(nextReview.getDate() + intervalDays);
  return nextReview;
}

/**
 * 获取待复习题目列表
 * 按紧急程度排序（逾期最久的排最前）
 */
export async function getDueReviewQuestions(
  userId?: string,
  limit: number = 20,
  stageFilter?: number
): Promise<DueReviewItem[]> {
  const now = new Date();

  // 查询所有练习记录，按 questionId 分组，取最新一次
  const practiceRecords = await prisma.practiceHistory.groupBy({
    by: ["questionId"],
    _max: {
      attemptedAt: true,
    },
    _count: {
      _all: true,
    },
    where: userId ? { userId } : {},
    orderBy: {
      _max: {
        attemptedAt: "desc",
      },
    },
  });

  if (practiceRecords.length === 0) return [];

  const questionIds = practiceRecords.map((r) => r.questionId);

  // 批量获取题目信息
  const questions = await prisma.question.findMany({
    where: {
      id: { in: questionIds },
    },
    select: {
      id: true,
      title: true,
      difficulty: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  // 计算每个题目的复习状态
  const dueReviews: DueReviewItem[] = [];

  for (const record of practiceRecords) {
    const lastPracticedAt = record._max.attemptedAt!;
    const reviewCount = record._count._all - 1; // 第一次练习不算复习

    const stage = Math.min(reviewCount, EBINGHAUS_INTERVALS.length - 1);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _intervalDays = EBINGHAUS_INTERVALS[stage];
    const nextReviewAt = calculateNextReview(lastPracticedAt, reviewCount);
    const daysOverdue = Math.floor(
      (now.getTime() - nextReviewAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 只返回需要复习的（已到或超过复习时间）
    if (daysOverdue >= 0) {
      const question = questionMap.get(record.questionId);
      if (question) {
        // 应用阶段筛选
        if (stageFilter !== undefined && stage !== stageFilter) continue;

        dueReviews.push({
          questionId: record.questionId,
          title: question.title,
          difficulty: question.difficulty,
          categoryName: question.category?.name ?? null,
          lastPracticedAt,
          nextReviewAt,
          daysOverdue,
          stage: stage + 1, // 从 1 开始显示
        });
      }
    }
  }

  // 按逾期天数降序排列（最紧急的排前面）
  dueReviews.sort((a, b) => b.daysOverdue - a.daysOverdue);

  return dueReviews.slice(0, limit);
}

/**
 * 获取某题的完整复习计划
 */
export async function getQuestionReviewSchedule(
  questionId: string,
  userId?: string
): Promise<ReviewSchedule | null> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      title: true,
    },
  });

  if (!question) return null;

  // 获取该题的所有练习记录，按时间排序
  const practices = await prisma.practiceHistory.findMany({
    where: {
      questionId,
      ...(userId ? { userId } : {}),
    },
    orderBy: {
      attemptedAt: "asc",
    },
    select: {
      attemptedAt: true,
    },
  });

  if (practices.length === 0) {
    return {
      questionId: question.id,
      title: question.title,
      stages: EBINGHAUS_INTERVALS.map((interval, idx) => ({
        stage: idx + 1,
        intervalDays: interval,
        scheduledAt: null,
        completedAt: null,
        isDue: false,
      })),
    };
  }

  const now = new Date();
  const firstPractice = practices[0].attemptedAt;

  // 构建完整的复习计划
  const stages = EBINGHAUS_INTERVALS.map((interval, idx) => {
    let scheduledAt: Date | null = null;
    let completedAt: Date | null = null;
    let isDue = false;

    if (idx === 0) {
      // 第一阶段：第一次练习后 1 天
      scheduledAt = new Date(firstPractice);
      scheduledAt.setDate(scheduledAt.getDate() + interval);
    } else {
      // 后续阶段：基于上一阶段的计划时间
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _prevInterval = EBINGHAUS_INTERVALS[idx - 1];
      let baseDate = firstPractice;
      for (let i = 0; i < idx; i++) {
        baseDate = new Date(baseDate);
        baseDate.setDate(baseDate.getDate() + EBINGHAUS_INTERVALS[i]);
      }
      scheduledAt = new Date(baseDate);
      scheduledAt.setDate(scheduledAt.getDate() + interval);
    }

    // 检查是否已完成该阶段复习（有对应时间的练习记录）
    if (practices[idx]) {
      completedAt = practices[idx].attemptedAt;
    }

    // 判断是否到期
    if (!completedAt && scheduledAt && scheduledAt <= now) {
      isDue = true;
    }

    return {
      stage: idx + 1,
      intervalDays: interval,
      scheduledAt,
      completedAt,
      isDue,
    };
  });

  return {
    questionId: question.id,
    title: question.title,
    stages,
  };
}
