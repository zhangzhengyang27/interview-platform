import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const paper = await prisma.testPaper.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          question: {
            select: {
              id: true,
              title: true,
              difficulty: true,
              questionType: true,
              content: true,
              codeTemplate: true,
              answer: true, // 判断题标准答案（true/false）
              solution: true, // 解析
              tags: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      user: { select: { id: true, name: true, image: true } },
    },
  });

  if (!paper) {
    return NextResponse.json({ error: "试卷不存在" }, { status: 404 });
  }

  return NextResponse.json(paper);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const paper = await prisma.testPaper.findUnique({ where: { id } });
  if (!paper) {
    return NextResponse.json({ error: "试卷不存在" }, { status: 404 });
  }
  if (paper.userId !== session.user.id) {
    return NextResponse.json({ error: "无权修改" }, { status: 403 });
  }

  const updated = await prisma.testPaper.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.detail !== undefined && { detail: body.detail }),
      ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      ...(body.tags !== undefined && { tags: body.tags }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;

  const paper = await prisma.testPaper.findUnique({ where: { id } });
  if (!paper) {
    return NextResponse.json({ error: "试卷不存在" }, { status: 404 });
  }
  if (paper.userId !== session.user.id) {
    return NextResponse.json({ error: "无权删除" }, { status: 403 });
  }

  await prisma.testPaper.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
