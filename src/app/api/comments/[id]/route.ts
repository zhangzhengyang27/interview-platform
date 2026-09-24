import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: '评论不存在' }, { status: 404 });
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('获取评论详情失败:', error);
    return NextResponse.json({ error: '获取评论详情失败' }, { status: 500 });
  }
}
