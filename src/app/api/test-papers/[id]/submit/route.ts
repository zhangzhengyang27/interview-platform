import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/test-papers/[id]/submit — 提交试卷并判分
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录，请先登录" }, { status: 401 });
    }
    const userId = session.user.id;

    const { id: testPaperId } = await params;
    const body = await request.json();
    const { answers } = body; // { questionId: boolean }

    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "缺少 answers 参数" }, { status: 400 });
    }

    // 获取试卷及题目（含标准答案）
    const paper = await prisma.testPaper.findUnique({
      where: { id: testPaperId },
      include: {
        items: {
          include: {
            question: {
              select: { id: true, questionType: true, answer: true },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!paper) {
      return NextResponse.json({ error: "试卷不存在" }, { status: 404 });
    }

    // 仅对判断题（questionType === "judge" 且 answer !== null）进行判分
    const judgeItems = paper.items.filter(
      (item) => item.question.questionType === "judge" && item.question.answer !== null,
    );

    const total = judgeItems.length;
    let correctCount = 0;
    const answerDetails: Record<string, { userAnswer: boolean | null; correctAnswer: boolean; isCorrect: boolean }> = {};

    for (const item of judgeItems) {
      const qId = item.question.id;
      const userAnswer = answers[qId] !== undefined ? Boolean(answers[qId]) : null;
      const correctAnswer = Boolean(item.question.answer);
      const isCorrect = userAnswer !== null && userAnswer === correctAnswer;

      if (isCorrect) correctCount++;

      answerDetails[qId] = { userAnswer, correctAnswer, isCorrect };
    }

    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    // 保存提交记录
    const submission = await prisma.testPaperSubmission.create({
      data: {
        testPaperId,
        userId,
        score,
        total,
        correctCount,
        answers: answerDetails,
      },
    });

    return NextResponse.json({
      submissionId: submission.id,
      score,
      total,
      correctCount,
      submittedAt: submission.submittedAt,
      details: answerDetails,
    });
  } catch (error) {
    console.error("POST /api/test-papers/[id]/submit error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// GET /api/test-papers/[id]/submit — 获取当前用户在该试卷的历史提交记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const userId = session.user.id;

    const { id: testPaperId } = await params;

    const submissions = await prisma.testPaperSubmission.findMany({
      where: { testPaperId, userId },
      orderBy: { submittedAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("GET /api/test-papers/[id]/submit error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
