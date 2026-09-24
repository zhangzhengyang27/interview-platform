import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const { role } = await request.json();
    
    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json({ error: '无效的角色' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      // 白名单脱敏：不回传 password 等敏感字段
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('更新用户角色失败:', error);
    return NextResponse.json({ error: '更新用户角色失败' }, { status: 500 });
  }
}
