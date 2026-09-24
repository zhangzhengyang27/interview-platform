import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
    const { id } = await params;
    const body = await request.json();
    const { content, author } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // 可选鉴权：登录用户记录 userId
    const session = await auth();
    const userId = session?.user?.id ?? null;

    const comment = await prisma.comment.create({
      data: {
        questionId: id,
        content: content.trim(),
        author: author?.trim() || null,
        userId,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/questions/[id]/comments error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
