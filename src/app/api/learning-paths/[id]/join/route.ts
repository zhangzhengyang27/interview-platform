import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/learning-paths/[id]/join
 * 将学习路线一键加入学习计划
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pathId } = await params;

    // 1. 查询学习路线及其所有题目
    const learningPath = await prisma.learningPath.findUnique({
      where: { id: pathId },
      include: {
        items: {
          orderBy: [{ dayNumber: "asc" }, { sortOrder: "asc" }],
          include: {
            question: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!learningPath) {
      return NextResponse.json(
        { error: "学习路线不存在" },
        { status: 404 }
      );
    }

    // 2. 按天分组，获取所有不重复的天数
    const dayNumbers = [
      ...new Set(learningPath.items.map((item) => item.dayNumber)),
    ].sort((a, b) => a - b);

    // 3. 创建学习计划（StudyPlan + StudyPlanDay + StudyPlanItem）
    const plan = await prisma.studyPlan.create({
      data: {
        title: `${learningPath.icon ?? ""} ${learningPath.title}`,
        description: learningPath.description
          ? `从「${learningPath.title}」学习路线创建，共 ${dayNumbers.length} 天`
          : undefined,
        icon: learningPath.icon,
        totalDays: dayNumbers.length,
        days: {
          create: dayNumbers.map((dayNumber) => {
            const dayItems = learningPath.items.filter(
              (item) => item.dayNumber === dayNumber
            );
            return {
              dayNumber,
              targetQuestionCount: dayItems.length,
              items: {
                create: dayItems.map((item, idx) => ({
                  questionId: item.questionId,
                  sortOrder: idx,
                })),
              },
            };
          }),
        },
      },
      include: {
        days: {
          orderBy: { dayNumber: "asc" },
          include: {
            items: {
              orderBy: { sortOrder: "asc" },
              include: {
                question: {
                  select: {
                    id: true,
                    title: true,
                    difficulty: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // 4. 计算统计信息
    const totalQuestions = plan.days.reduce(
      (sum, day) => sum + day.items.length,
      0
    );

    return NextResponse.json(
      {
        message: "已成功加入学习计划",
        studyPlan: {
          id: plan.id,
          title: plan.title,
          description: plan.description,
          icon: plan.icon,
          totalDays: plan.totalDays,
          totalQuestions,
          createdAt: plan.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/learning-paths/[id]/join error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
