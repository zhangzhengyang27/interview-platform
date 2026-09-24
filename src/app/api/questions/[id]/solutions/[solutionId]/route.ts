import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; solutionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id, solutionId } = await params;
  const { isFeatured } = await request.json();

  // 验证题目存在
  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) {
    return NextResponse.json({ error: "题目不存在" }, { status: 404 });
  }

  // 验证题解存在
  const solution = await prisma.solution.findUnique({ where: { id: solutionId } });
  if (!solution || solution.questionId !== id) {
    return NextResponse.json({ error: "题解不存在" }, { status: 404 });
  }

  // 更新精选状态
  const updated = await prisma.solution.update({
    where: { id: solutionId },
    data: { isFeatured: Boolean(isFeatured) },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; solutionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id, solutionId } = await params;

  const solution = await prisma.solution.findUnique({ where: { id: solutionId } });
  if (!solution || solution.questionId !== id) {
    return NextResponse.json({ error: "题解不存在" }, { status: 404 });
  }

  // 只有作者本人可以删除
  if (solution.userId !== session.user.id) {
    return NextResponse.json({ error: "无权删除" }, { status: 403 });
  }

  await prisma.solution.delete({ where: { id: solutionId } });
  return NextResponse.json({ success: true });
}
