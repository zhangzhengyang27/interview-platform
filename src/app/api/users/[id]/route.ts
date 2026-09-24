import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            practiceHistory: true,
            comments: true,
          },
        },
        practiceHistory: {
          take: 10,
          orderBy: { attemptedAt: 'desc' },
          select: {
            id: true,
            status: true,
            durationSeconds: true,
            attemptedAt: true,
            question: {
              select: {
                title: true,
                difficulty: true,
              },
            },
          },
        },
        comments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            question: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('获取用户详情失败:', error);
    return NextResponse.json({ error: '获取用户详情失败' }, { status: 500 });
  }
}
