import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";

async function checkOwnership(planId: string, userId: string) {
  const plan = await prisma.studyPlan.findUnique({
    where: { id: planId },
    select: { id: true, userId: true },
  });
  if (!plan) return { plan: null, error: NextResponse.json({ error: "学习计划不存在" }, { status: 404 }) };
  if (plan.userId !== userId) {
    return { plan: null, error: NextResponse.json({ error: "无权访问此学习计划" }, { status: 403 }) };
  }
  return { plan, error: null };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  try {
    const { id: studyPlanId } = await params;
    const { error } = await checkOwnership(studyPlanId, user!.id);
    if (error) return error;

    const body = await request.json();
    const { studyPlanDayId, questionId, sortOrder } = body;

    if (!studyPlanDayId || !questionId) {
      return NextResponse.json(
        { error: "缺少必填字段: studyPlanDayId, questionId" },
        { status: 400 }
      );
    }

    // 校验 day 属于该计划，防止跨计划写入
    const day = await prisma.studyPlanDay.findFirst({
      where: { id: studyPlanDayId, studyPlanId },
      select: { id: true },
    });
    if (!day) {
      return NextResponse.json({ error: "计划天数不存在" }, { status: 404 });
    }

    const item = await prisma.studyPlanItem.create({
      data: {
        studyPlanDayId,
        questionId,
        sortOrder: sortOrder ?? 0,
      },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            difficulty: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...item,
        question: { ...item.question, mastery: "unsolved" },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/study-plans/[id]/items error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  try {
    const { id: studyPlanId } = await params;
    const { error } = await checkOwnership(studyPlanId, user!.id);
    if (error) return error;

    const body = await request.json();
    const { studyPlanDayId, questionId } = body;

    if (!studyPlanDayId || !questionId) {
      return NextResponse.json(
        { error: "缺少必填字段: studyPlanDayId, questionId" },
        { status: 400 }
      );
    }

    // 校验 day 属于该计划，防止跨计划删除
    const day = await prisma.studyPlanDay.findFirst({
      where: { id: studyPlanDayId, studyPlanId },
      select: { id: true },
    });
    if (!day) {
      return NextResponse.json({ error: "计划天数不存在" }, { status: 404 });
    }

    await prisma.studyPlanItem.deleteMany({
      where: {
        studyPlanDayId,
        questionId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/study-plans/[id]/items error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
