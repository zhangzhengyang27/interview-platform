import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const note = await prisma.note.findFirst({
      where: { id, userId: user!.id },
    });

    if (!note) {
      return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("GET /api/notes/[id] error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const body = await request.json();
    const { title, content, company, questionIds } = body;

    // 检查笔记是否存在且属于当前用户
    const existingNote = await prisma.note.findFirst({
      where: { id, userId: user!.id },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "笔记不存在或无权访问" }, { status: 404 });
    }

    // 部分更新：只更新提供的字段
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (company !== undefined) updateData.company = company;
    if (questionIds !== undefined) updateData.questionIds = questionIds;

    const note = await prisma.note.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("PUT /api/notes/[id] error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const user = await getCurrentUser();

    // 检查笔记是否存在且属于当前用户
    const existingNote = await prisma.note.findFirst({
      where: { id, userId: user!.id },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "笔记不存在或无权访问" }, { status: 404 });
    }

    await prisma.note.delete({
      where: { id },
    });

    return NextResponse.json({ message: "笔记已删除" });
  } catch (error) {
    console.error("DELETE /api/notes/[id] error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
