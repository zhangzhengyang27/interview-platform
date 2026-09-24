import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { judgeCode } from "@/lib/judge";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contestId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { questionId, code, language } = body;

    if (!questionId || !code || !language) {
      return NextResponse.json(
        { error: "缺少必填字段: questionId, code, language" },
        { status: 400 }
      );
    }

    // 检查竞赛是否存在
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        problems: {
          where: { questionId },
          select: { id: true, score: true },
        },
      },
    });

    if (!contest) {
      return NextResponse.json({ error: "竞赛不存在" }, { status: 404 });
    }

    // 检查竞赛状态
    const now = new Date();
    const startTime = new Date(contest.startTime);
    const endTime = new Date(startTime.getTime() + contest.duration * 60000);

    if (now < startTime) {
      return NextResponse.json({ error: "竞赛尚未开始" }, { status: 400 });
    }

    if (now > endTime) {
      return NextResponse.json({ error: "竞赛已结束" }, { status: 400 });
    }

    // 检查题目是否属于该竞赛
    if (contest.problems.length === 0) {
      return NextResponse.json({ error: "该题目不属于此竞赛" }, { status: 400 });
    }

    const problemScore = contest.problems[0].score;

    // 真实判题：使用 TestCase 逐用例执行（包含隐藏用例）
    let judgeResult;
    try {
      judgeResult = await judgeCode(questionId, code, language, true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "判题失败";
      if (message === "题目不存在") {
        return NextResponse.json({ error: message }, { status: 404 });
      }
      if (message === "该题暂无测试用例") {
        return NextResponse.json({ error: message }, { status: 400 });
      }
      console.error("竞赛判题错误:", err);
      return NextResponse.json({ error: "判题服务异常: " + message }, { status: 500 });
    }

    const { status, passedCount, totalCount, duration } = judgeResult;

    // 得分策略：全部通过得满分，部分通过按比例折算
    const score = status === "accepted"
      ? problemScore
      : Math.round((passedCount / totalCount) * problemScore);

    // 记录提交
    const submission = await prisma.contestSubmission.create({
      data: {
        contestId,
        questionId,
        userId,
        code,
        language,
        status,
        score,
        duration,
      },
    });

    return NextResponse.json({
      submission: {
        id: submission.id,
        status,
        score,
        passedCount,
        totalCount,
        duration,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (error) {
    console.error("POST /api/contests/[id]/submit error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
