import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studyPlanId } = await params;
    const body = await request.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: "缺少必填字段: questionId" },
        { status: 400 }
      );
    }

    const progress = await prisma.studyPlanProgress.upsert({
      where: {
        studyPlanId_questionId: {
          studyPlanId,
          questionId,
        },
      },
      update: {},
      create: {
        studyPlanId,
        questionId,
      },
    });

    const completedCount = await prisma.studyPlanProgress.count({
      where: { studyPlanId },
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
  try {
    const { id: studyPlanId } = await params;
    const body = await request.json();
    const { questionId } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: "缺少必填字段: questionId" },
        { status: 400 }
      );
    }

    await prisma.studyPlanProgress.delete({
      where: {
        studyPlanId_questionId: {
          studyPlanId,
          questionId,
        },
      },
    });

    const completedCount = await prisma.studyPlanProgress.count({
      where: { studyPlanId },
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
