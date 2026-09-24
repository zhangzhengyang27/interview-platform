import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const question = await prisma.question.findUnique({
      where: { id },
      include: { tags: true },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const result = {
      id: question.id,
      title: question.title,
      content: question.content,
      solution: question.solution,
      codeTemplate: question.codeTemplate,
      questionType: question.questionType,
      difficulty: question.difficulty,
      company: question.company,
      jobRole: question.jobRole,
      categoryId: question.categoryId,
      tags: question.tags.map((t) => t.tag),
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/questions/[id]/edit error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
