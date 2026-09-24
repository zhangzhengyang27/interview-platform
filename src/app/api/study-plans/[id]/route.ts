import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
                    mastery: true,
                  },
                },
              },
            },
          },
        },
        progress: true,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "学习计划不存在" },
        { status: 404 }
      );
    }

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
          question: item.question,
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
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, totalDays } = body;

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
    const updateData: { title?: string; description?: string; totalDays?: number } = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (totalDays !== undefined) updateData.totalDays = totalDays;

    const plan = await prisma.studyPlan.update({
      where: { id },
      data: updateData,
      include: {
        days: {
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    // 如果增加了天数，创建新的天数记录
    if (totalDays !== undefined && totalDays > existingPlan.days.length) {
      const newDays = Array.from(
        { length: totalDays - existingPlan.days.length },
        (_, i) => ({
          studyPlanId: id,
          dayNumber: existingPlan.days.length + i + 1,
        })
      );

      await prisma.studyPlanDay.createMany({
        data: newDays,
      });
    }

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
  try {
    const { id } = await params;

    // 验证学习计划是否存在
    const existingPlan = await prisma.studyPlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: "学习计划不存在" },
        { status: 404 }
      );
    }

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
