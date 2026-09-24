import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 获取收藏夹详情（含所有收藏的题目）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;

    const folder = await prisma.bookmarkFolder.findFirst({
      where: { id, userId: session.user.id },
      include: {
        items: {
          orderBy: { addedAt: "desc" },
          include: {
            question: {
              select: {
                id: true,
                title: true,
                difficulty: true,
                questionType: true,
                tags: true,
                company: true,
                categoryId: true,
              },
            },
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: "收藏夹不存在" }, { status: 404 });
    }

    const result = {
      id: folder.id,
      name: folder.name,
      icon: folder.icon,
      createdAt: folder.createdAt,
      items: folder.items.map((item) => ({
        id: item.id,
        questionId: item.questionId,
        addedAt: item.addedAt,
        note: item.note,
        question: item.question,
      })),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/bookmarks/folders/[id] error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

// 更新收藏夹名称/图标
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, icon } = body;

    // 验证收藏夹归属
    const existing = await prisma.bookmarkFolder.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "收藏夹不存在" }, { status: 404 });
    }

    const updateData: Record<string, string | null> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (icon !== undefined) updateData.icon = icon;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "没有需要更新的字段" },
        { status: 400 }
      );
    }

    const folder = await prisma.bookmarkFolder.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error("PATCH /api/bookmarks/folders/[id] error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

// 删除收藏夹及其所有内容
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;

    // 验证收藏夹归属
    const existing = await prisma.bookmarkFolder.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "收藏夹不存在" }, { status: 404 });
    }

    // 删除收藏夹（级联删除所有 items）
    await prisma.bookmarkFolder.delete({
      where: { id },
    });

    return NextResponse.json({ message: "已删除" });
  } catch (error) {
    console.error("DELETE /api/bookmarks/folders/[id] error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
