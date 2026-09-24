import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '20');
    const keyword = searchParams.get('keyword') || '';

    const where = keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: 'insensitive' as const } },
            { email: { contains: keyword, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        where,
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 });
  }
}
