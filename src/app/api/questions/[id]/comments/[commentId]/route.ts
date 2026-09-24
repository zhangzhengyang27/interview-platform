import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
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
  try {
    const { id, commentId } = await params;
    await prisma.comment.delete({ where: { id: commentId, questionId: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/questions/[id]/comments/[commentId] error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
