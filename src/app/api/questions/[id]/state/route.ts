import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";
import { parseBody } from "@/lib/validate";
import { updateQuestionStateSchema } from "@/lib/schemas";

// PATCH /api/questions/[id]/state — 更新当前用户对该题的掌握/收藏状态
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  try {
    const { id } = await params;
    const parsed = await parseBody(request, updateQuestionStateSchema);
    if (!parsed.success) return parsed.response;
    const { mastery, isBookmarked } = parsed.data;

    const questionExists = await prisma.question.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!questionExists) {
      return NextResponse.json({ error: "题目不存在" }, { status: 404 });
    }

    const state = await prisma.userQuestionState.upsert({
      where: { userId_questionId: { userId: user!.id, questionId: id } },
      update: {
        ...(mastery !== undefined && { mastery }),
        ...(isBookmarked !== undefined && { isBookmarked }),
      },
      create: {
        userId: user!.id,
        questionId: id,
        mastery: mastery ?? "unsolved",
        isBookmarked: isBookmarked ?? false,
      },
    });

    return NextResponse.json({
      questionId: state.questionId,
      mastery: state.mastery,
      isBookmarked: state.isBookmarked,
    });
  } catch (error) {
    console.error("PATCH /api/questions/[id]/state error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// GET /api/questions/[id]/state — 查询当前用户对该题的状态
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  const { id } = await params;
  const state = await prisma.userQuestionState.findUnique({
    where: { userId_questionId: { userId: user!.id, questionId: id } },
  });

  return NextResponse.json({
    questionId: id,
    mastery: state?.mastery ?? "unsolved",
    isBookmarked: state?.isBookmarked ?? false,
  });
}
