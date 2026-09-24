import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "题解内容不能为空" },
        { status: 400 }
      );
    }

    // 检查题解是否存在
    const existingSolution = await prisma.solution.findUnique({
      where: { id },
    });

    if (!existingSolution) {
      return NextResponse.json({ error: "题解不存在" }, { status: 404 });
    }

    // 权限检查：只能修改自己的题解
    if (existingSolution.userId !== user!.id) {
      return NextResponse.json({ error: "无权修改他人的题解" }, { status: 403 });
    }

    const solution = await prisma.solution.update({
      where: { id },
      data: {
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(solution);
  } catch (error) {
    console.error("PATCH /api/solutions/[id] error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const user = await getCurrentUser();

    // 检查题解是否存在
    const existingSolution = await prisma.solution.findUnique({
      where: { id },
    });

    if (!existingSolution) {
      return NextResponse.json({ error: "题解不存在" }, { status: 404 });
    }

    // 权限检查：只能删除自己的题解
    if (existingSolution.userId !== user!.id) {
      return NextResponse.json({ error: "无权删除他人的题解" }, { status: 403 });
    }

    await prisma.solution.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/solutions/[id] error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
