import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params;
    const body = await request.json();
    const { studyPlanDayId, questionId, sortOrder } = body;

    if (!studyPlanDayId || !questionId) {
      return NextResponse.json(
        { error: "缺少必填字段: studyPlanDayId, questionId" },
        { status: 400 }
      );
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
            mastery: true,
          },
        },
      },
    });

    return NextResponse.json(item, { status: 201 });
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
  try {
    await params;
    const body = await request.json();
    const { studyPlanDayId, questionId } = body;

    if (!studyPlanDayId || !questionId) {
      return NextResponse.json(
        { error: "缺少必填字段: studyPlanDayId, questionId" },
        { status: 400 }
      );
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
