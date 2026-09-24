import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 获取当前用户的所有收藏夹
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const folders = await prisma.bookmarkFolder.findMany({
      where: { userId: session.user.id },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    const result = folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      icon: folder.icon,
      sortOrder: folder.sortOrder,
      createdAt: folder.createdAt,
      itemCount: folder._count.items,
    }));

    return NextResponse.json({ folders: result });
  } catch (error) {
    console.error("GET /api/bookmarks/folders error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

// 创建新收藏夹
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { name, icon } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "收藏夹名称不能为空" },
        { status: 400 }
      );
    }

    // 获取当前用户最大排序值
    const maxSort = await prisma.bookmarkFolder.aggregate({
      where: { userId: session.user.id },
      _max: { sortOrder: true },
    });

    const folder = await prisma.bookmarkFolder.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        icon: icon ?? null,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("POST /api/bookmarks/folders error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
