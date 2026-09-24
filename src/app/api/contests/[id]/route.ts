import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requirePermission } from "@/lib/permission";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const contest = await prisma.contest.findUnique({
      where: { id },
      include: {
        problems: {
          include: {
            question: {
              select: {
                id: true,
                title: true,
                difficulty: true,
                questionType: true,
                codeTemplate: true,
              },
            },
          },
          orderBy: { orderBy: "asc" },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (!contest) {
      return NextResponse.json({ error: "竞赛不存在" }, { status: 404 });
    }

    // 获取当前用户的提交状态
    let userSubmissions: Array<{
      id: string;
      questionId: string;
      status: string;
      score: number;
      submittedAt: Date;
    }> = [];
    if (session?.user?.id) {
      userSubmissions = await prisma.contestSubmission.findMany({
        where: {
          contestId: id,
          userId: session.user.id,
        },
        select: {
          id: true,
          questionId: true,
          status: true,
          score: true,
          submittedAt: true,
        },
      });
    }

    return NextResponse.json({
      ...contest,
      userSubmissions,
    });
  } catch (error) {
    console.error("GET /api/contests/[id] error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permError = await requirePermission("contest:manage");
    if (permError) return permError;

    const { id } = await params;

    await prisma.contest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/contests/[id] error:", error);
    return NextResponse.json({ error: "删除竞赛失败" }, { status: 500 });
  }
}

/**
 * 编辑竞赛（供后台管理使用）。
 * 更新基础字段，并可选重置题目列表。
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permError = await requirePermission("contest:manage");
    if (permError) return permError;

    const { id } = await params;
    const body = await request.json();
    const { title, description, startTime, duration, type, problemIds } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少竞赛 ID" }, { status: 400 });
    }

    const existing = await prisma.contest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "竞赛不存在" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (startTime !== undefined) data.startTime = new Date(startTime);
    if (duration !== undefined) data.duration = parseInt(String(duration), 10);
    if (type !== undefined) data.type = type;

    // 更新竞赛基础信息
    const contest = await prisma.contest.update({ where: { id }, data });

    // 可选：重置题目列表
    if (problemIds !== undefined && Array.isArray(problemIds)) {
      // 校验题目是否存在
      const questions = await prisma.question.findMany({
        where: { id: { in: problemIds } },
        select: { id: true },
      });
      if (questions.length !== problemIds.length) {
        return NextResponse.json(
          { error: "部分题目不存在，请检查题目ID" },
          { status: 400 }
        );
      }
      // 事务：删除旧题 + 重建新题
      await prisma.$transaction(async (tx) => {
        await tx.contestProblem.deleteMany({ where: { contestId: id } });
        await tx.contestProblem.createMany({
          data: problemIds.map((questionId: string, index: number) => ({
            contestId: id,
            questionId,
            orderBy: index + 1,
            score: 100,
          })),
        });
      });
    }

    return NextResponse.json(contest);
  } catch (error) {
    console.error("PATCH /api/contests/[id] error:", error);
    return NextResponse.json({ error: "更新竞赛失败" }, { status: 500 });
  }
}
