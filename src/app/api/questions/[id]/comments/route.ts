import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";

const MAX_CONTENT_LENGTH = 5000;

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
    const body = await request.json();
    const content: string | undefined = body.content;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `评论过长，最多 ${MAX_CONTENT_LENGTH} 字符` },
        { status: 400 }
      );
    }

    // 作者名取自登录账号，不接受客户端自填（防冒名）
    const comment = await prisma.comment.create({
      data: {
        questionId: id,
        content: content.trim(),
        author: user!.name ?? null,
        userId: user!.id,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/questions/[id]/comments error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
