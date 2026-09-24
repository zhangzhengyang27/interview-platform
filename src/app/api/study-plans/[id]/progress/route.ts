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
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: "缺少必填字段: questionId" },
        { status: 400 }
      );
    }

    // 进度按 (计划, 用户, 题目) 三元组隔离，多人不再互相覆盖
    const progress = await prisma.studyPlanProgress.upsert({
      where: {
        studyPlanId_userId_questionId: {
          studyPlanId,
          userId: user!.id,
          questionId,
        },
      },
      update: {},
      create: {
        studyPlanId,
        userId: user!.id,
        questionId,
      },
    });

    const completedCount = await prisma.studyPlanProgress.count({
      where: { studyPlanId, userId: user!.id },
    });

    return NextResponse.json({ progress, completedCount });
  } catch (error) {
    console.error("POST /api/study-plans/[id]/progress error:", error);
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
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: "缺少必填字段: questionId" },
        { status: 400 }
      );
    }

    await prisma.studyPlanProgress.deleteMany({
      where: {
        studyPlanId,
        userId: user!.id,
        questionId,
      },
    });

    const completedCount = await prisma.studyPlanProgress.count({
      where: { studyPlanId, userId: user!.id },
    });

    return NextResponse.json({ completedCount });
  } catch (error) {
    console.error("DELETE /api/study-plans/[id]/progress error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
