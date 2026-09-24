import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";
import { parseBody } from "@/lib/validate";
import { updateStudyPlanSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

// 校验计划归属：返回 403 响应或 null
async function checkOwnership(planId: string, userId: string) {
  const plan = await prisma.studyPlan.findUnique({
    where: { id: planId },
    select: { userId: true },
  });
  if (!plan) return { plan: null, error: NextResponse.json({ error: "学习计划不存在" }, { status: 404 }) };
  if (plan.userId !== userId) {
    return { plan: null, error: NextResponse.json({ error: "无权访问此学习计划" }, { status: 403 }) };
  }
  return { plan, error: null };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  try {
    const { id } = await params;
    const { error } = await checkOwnership(id, user!.id);
    if (error) return error;

    const plan = await prisma.studyPlan.findUnique({
      where: { id },
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
        progress: {
          where: { userId: user!.id },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "学习计划不存在" },
        { status: 404 }
      );
    }

    // 合并当前用户的题目掌握状态
    const questionIds = plan.days.flatMap((day) => day.items.map((item) => item.question.id));
    const states = questionIds.length
      ? await prisma.userQuestionState.findMany({
          where: { userId: user!.id, questionId: { in: questionIds } },
          select: { questionId: true, mastery: true },
        })
      : [];
    const stateMap = new Map(states.map((s) => [s.questionId, s.mastery]));

    const totalQuestions = plan.days.reduce(
      (sum, day) => sum + day.items.length,
      0
    );
    const completedCount = plan.progress.length;

    const result = {
      id: plan.id,
      title: plan.title,
      description: plan.description,
      totalDays: plan.totalDays,
      days: plan.days.map((day) => ({
        dayNumber: day.dayNumber,
        targetQuestionCount: day.targetQuestionCount,
        items: day.items.map((item) => ({
          id: item.id,
          sortOrder: item.sortOrder,
          question: {
            ...item.question,
            mastery: stateMap.get(item.question.id) ?? "unsolved",
          },
        })),
      })),
      progress: plan.progress.map((p) => ({
        questionId: p.questionId,
        completedAt: p.completedAt,
      })),
      completedCount,
      totalQuestions,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/study-plans/[id] error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  try {
    const { id } = await params;
    const { error } = await checkOwnership(id, user!.id);
    if (error) return error;

    const parsed = await parseBody(request, updateStudyPlanSchema);
    if (!parsed.success) return parsed.response;
    const { title, description, totalDays } = parsed.data;

    // 验证学习计划是否存在
    const existingPlan = await prisma.studyPlan.findUnique({
      where: { id },
      include: { days: true },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: "学习计划不存在" },
        { status: 404 }
      );
    }

    // 验证 totalDays 不能小于当前已有的天数
    if (totalDays !== undefined) {
      if (typeof totalDays !== "number" || totalDays < 1) {
        return NextResponse.json(
          { error: "totalDays 必须是正整数" },
          { status: 400 }
        );
      }

      const currentMaxDay = Math.max(
        ...existingPlan.days.map((d) => d.dayNumber),
        0
      );
      if (totalDays < currentMaxDay) {
        return NextResponse.json(
          { error: `totalDays 不能小于当前已有的 ${currentMaxDay} 天` },
          { status: 400 }
        );
      }
    }

    // 更新学习计划基本信息
    const updateData: { title?: string; description?: string | null; totalDays?: number } = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (totalDays !== undefined) updateData.totalDays = totalDays;

    // 更新基本信息 + 扩展天数：包在事务中保证一致性
    const plan = await prisma.$transaction(async (tx) => {
      const updated = await tx.studyPlan.update({
        where: { id },
        data: updateData,
        include: {
          days: {
            orderBy: { dayNumber: "asc" },
          },
        },
      });

      if (totalDays !== undefined && totalDays > existingPlan.days.length) {
        const newDays = Array.from(
          { length: totalDays - existingPlan.days.length },
          (_, i) => ({
            studyPlanId: id,
            dayNumber: existingPlan.days.length + i + 1,
          })
        );

        await tx.studyPlanDay.createMany({
          data: newDays,
        });
      }

      return updated;
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("PUT /api/study-plans/[id] error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  try {
    const { id } = await params;
    const { error } = await checkOwnership(id, user!.id);
    if (error) return error;

    // 删除学习计划（级联删除相关的 days、items、progress）
    await prisma.studyPlan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/study-plans/[id] error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
