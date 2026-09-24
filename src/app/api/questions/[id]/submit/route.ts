import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { judgeCode } from "@/lib/judge";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionId } = await params;
    const body = await request.json();
    const { code, language } = body;

    // 获取当前用户（未登录也允许判题，但不写练习记录）
    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (!code || !language) {
      return NextResponse.json(
        { error: "缺少必要参数: code 和 language" },
        { status: 400 }
      );
    }

    // 调用公共判题函数
    let judgeResult;
    try {
      judgeResult = await judgeCode(questionId, code, language);
    } catch (err) {
      const message = err instanceof Error ? err.message : "判题失败";
      if (message === "题目不存在") {
        return NextResponse.json({ error: message }, { status: 404 });
      }
      if (message === "该题暂无测试用例") {
        return NextResponse.json({ error: message }, { status: 400 });
      }
      throw err;
    }

    const { status: overallStatus, passedCount, totalCount, duration: totalDuration, results } = judgeResult;

    // 写入练习记录（多用户）
    // 状态映射：accepted → completed，其余 → failed，与 practice/reminders/leaderboard 保持一致
    if (userId) {
      const historyStatus = overallStatus === "accepted" ? "completed" : "failed";
      await prisma.practiceHistory.create({
        data: {
          questionId,
          userId,
          status: historyStatus,
          durationSeconds: Math.round(totalDuration / 1000),
        },
      });

      // 通过判题后自动把个人掌握状态从 unsolved 推进到 learning
      // （不回退已标记 mastered/learning 的状态）
      const existingState = await prisma.userQuestionState.findUnique({
        where: { userId_questionId: { userId, questionId } },
        select: { mastery: true },
      });
      if (!existingState) {
        await prisma.userQuestionState.create({
          data: { userId, questionId, mastery: "learning" },
        });
      } else if (existingState.mastery === "unsolved") {
        await prisma.userQuestionState.update({
          where: { userId_questionId: { userId, questionId } },
          data: { mastery: "learning" },
        });
      }
    }

    return NextResponse.json({
      status: overallStatus,
      passedCount,
      totalCount,
      duration: totalDuration,
      results,
    });
  } catch (error) {
    console.error("POST /api/questions/[id]/submit error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
