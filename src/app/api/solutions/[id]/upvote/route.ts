import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notify";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    const actorId = session?.user?.id ?? null;

    // 检查题解是否存在
    const solution = await prisma.solution.findUnique({
      where: { id },
    });

    if (!solution) {
      return NextResponse.json({ error: "题解不存在" }, { status: 404 });
    }

    // 更新点赞数（toggle 逻辑由前端处理，这里简单 +1）
    const updatedSolution = await prisma.solution.update({
      where: { id },
      data: {
        upvotes: solution.upvotes + 1,
      },
    });

    // 通知题解作者：有人点赞了你的题解
    if (solution.userId && actorId) {
      await createNotification(
        {
          userId: solution.userId,
          type: "system",
          title: "你的题解收到了新的点赞",
          body: `你的题解获得了一次点赞，当前共 ${updatedSolution.upvotes} 赞`,
          link: `/questions/${solution.questionId}`,
        },
        actorId,
      );
    }

    return NextResponse.json({
      upvoted: true,
      upvotes: updatedSolution.upvotes,
    });
  } catch (error) {
    console.error("PATCH /api/solutions/[id]/upvote error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
