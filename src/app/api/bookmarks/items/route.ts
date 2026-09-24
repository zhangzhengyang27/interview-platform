import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 添加收藏
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { folderId, questionId, note } = body;

    if (!folderId || !questionId) {
      return NextResponse.json(
        { error: "folderId 和 questionId 不能为空" },
        { status: 400 }
      );
    }

    // 验证收藏夹归属
    const folder = await prisma.bookmarkFolder.findFirst({
      where: { id: folderId, userId: session.user.id },
    });

    if (!folder) {
      return NextResponse.json({ error: "收藏夹不存在" }, { status: 404 });
    }

    // 验证题目是否存在
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json({ error: "题目不存在" }, { status: 404 });
    }

    // 检查是否已收藏（唯一约束）
    const existing = await prisma.bookmarkItem.findUnique({
      where: {
        folderId_questionId: { folderId, questionId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "该题目已在此收藏夹中" },
        { status: 409 }
      );
    }

    const item = await prisma.bookmarkItem.create({
      data: {
        folderId,
        questionId,
        note: note ?? null,
      },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            difficulty: true,
          },
        },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("POST /api/bookmarks/items error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

// 移除收藏
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const questionId = searchParams.get("questionId");

    if (!folderId || !questionId) {
      return NextResponse.json(
        { error: "需要提供 folderId 和 questionId 参数" },
        { status: 400 }
      );
    }

    // 验证收藏夹归属
    const folder = await prisma.bookmarkFolder.findFirst({
      where: { id: folderId, userId: session.user.id },
    });

    if (!folder) {
      return NextResponse.json({ error: "收藏夹不存在" }, { status: 404 });
    }

    // 删除收藏项
    await prisma.bookmarkItem.delete({
      where: {
        folderId_questionId: { folderId, questionId },
      },
    }).catch(() => {
      // 收藏项不存在也视为成功
    });

    return NextResponse.json({ message: "已移除" });
  } catch (error) {
    console.error("DELETE /api/bookmarks/items error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
