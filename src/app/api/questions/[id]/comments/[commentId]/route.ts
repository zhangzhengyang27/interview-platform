import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  // 点赞需登录 + 限流（此前匿名可无限刷赞）
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  const rl = rateLimit(`comment-upvote:${user!.id}`, 30, 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "操作过于频繁，请稍后再试" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const { id, commentId } = await params;
    const comment = await prisma.comment.update({
      where: { id: commentId, questionId: id },
      data: { upvotes: { increment: 1 } },
    });
    return NextResponse.json(comment);
  } catch (error) {
    console.error("PATCH /api/questions/[id]/comments/[commentId] error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  // 删除需登录，且仅本人或管理员
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  try {
    const { id, commentId } = await params;
    const comment = await prisma.comment.findUnique({
      where: { id: commentId, questionId: id },
      select: { id: true, userId: true },
    });
    if (!comment) {
      return NextResponse.json({ error: "评论不存在" }, { status: 404 });
    }
    if (comment.userId !== user!.id && user!.role !== "admin") {
      return NextResponse.json({ error: "无权删除此评论" }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/questions/[id]/comments/[commentId] error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
