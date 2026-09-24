import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const question = await prisma.question.findUnique({
      where: { id },
      include: { tags: true, practiceHistory: true, comments: true },
    });

    if (!question) {
      return NextResponse.json({ error: "题目不存在" }, { status: 404 });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error("GET /api/questions/[id] error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      content,
      solution,
      codeTemplate,
      difficulty,
      company,
      jobRole,
      categoryId,
      tags,
      mastery,
      isBookmarked,
      answer,
      questionType,
    } = body;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (solution !== undefined) data.solution = solution;
    if (codeTemplate !== undefined) data.codeTemplate = codeTemplate;
    if (difficulty !== undefined) data.difficulty = difficulty;
    if (company !== undefined) data.company = company;
    if (jobRole !== undefined) data.jobRole = jobRole;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (mastery !== undefined) data.mastery = mastery;
    if (isBookmarked !== undefined) data.isBookmarked = isBookmarked;
    if (questionType !== undefined) data.questionType = questionType;
    if (answer !== undefined) data.answer = answer;

    const hasBasicFields = Object.keys(data).length > 0;
    const hasTags = tags !== undefined && Array.isArray(tags);

    if (!hasBasicFields && !hasTags) {
      return NextResponse.json(
        { error: "未提供任何更新字段" },
        { status: 400 }
      );
    }

    const question = await prisma.$transaction(async (tx) => {
      if (hasTags) {
        await tx.questionTag.deleteMany({
          where: { questionId: id },
        });

        if (tags.length > 0) {
          await tx.questionTag.createMany({
            data: tags.map((tag: string) => ({
              questionId: id,
              tag,
            })),
          });
        }
      }

      if (hasBasicFields) {
        return await tx.question.update({
          where: { id },
          data,
          include: { tags: true },
        });
      }

      return await tx.question.findUnique({
        where: { id },
        include: { tags: true },
      });
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error("PATCH /api/questions/[id] error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
