import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";
import { createNotification } from "@/lib/notify";
import { parseBody } from "@/lib/validate";
import { createCommentSchema } from "@/lib/schemas";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") ?? "date";

    const orderBy = sort === "upvotes"
      ? { upvotes: "desc" as const }
      : { createdAt: "desc" as const };

    const comments = await prisma.comment.findMany({
      where: { questionId: id },
      orderBy,
      // 返回 userId/parentId 供前端渲染回复关系与删除权限判断
      select: {
        id: true,
        parentId: true,
        content: true,
        author: true,
        userId: true,
        upvotes: true,
        createdAt: true,
      },
    });
    return NextResponse.json(comments);
  } catch (error) {
    console.error("GET /api/questions/[id]/comments error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 评论必须登录：杜绝匿名冒名与不可治理的垃圾内容
    const authError = await requireAuth();
    if (authError) return authError;
    const user = await getCurrentUser();

    const { id } = await params;
    const parsed = await parseBody(request, createCommentSchema);
    if (!parsed.success) return parsed.response;
    const content = parsed.data.content;
    let parentCommentId: string | undefined = parsed.data.parentId;

    // 回复目标校验：必须属于同一题目的评论，且仅支持一层嵌套
    let parentAuthorId: string | null = null;
    if (parentCommentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentCommentId },
        select: { id: true, questionId: true, parentId: true, userId: true },
      });
      if (!parent || parent.questionId !== id) {
        return NextResponse.json({ error: "回复的评论不存在" }, { status: 404 });
      }
      if (parent.parentId) {
        // 二层及以上的回复统一挂到根评论，保持一层嵌套
        parentCommentId = parent.parentId;
      }
      parentAuthorId = parent.userId;
    }

    const comment = await prisma.comment.create({
      data: {
        questionId: id,
        content: content.trim(),
        author: user!.name ?? null,
        userId: user!.id,
        parentId: parentCommentId ?? null,
      },
    });

    // 通知被回复人（自己回复自己不通知，由 createNotification 内部处理）
    if (parentAuthorId) {
      await createNotification(
        {
          userId: parentAuthorId,
          type: "comment_reply",
          title: `${user!.name ?? "有人"} 回复了你的评论`,
          body: content.trim().slice(0, 100),
          link: `/questions/${id}?tab=discussion`,
        },
        user!.id
      );
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/questions/[id]/comments error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
