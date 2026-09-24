import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { getCurrentUser } from '@/lib/session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const { banned } = await request.json();

    if (typeof banned !== 'boolean') {
      return NextResponse.json({ error: 'banned 必须为布尔值' }, { status: 400 });
    }

    // 不能封禁自己（避免管理员自锁；Bearer JWT 调用方无 session，跳过此检查）
    const actor = await getCurrentUser();
    if (actor?.id && actor.id === id) {
      return NextResponse.json({ error: '不能封禁自己的账号' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!target) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { banned },
      // 白名单脱敏：不回传 password
      select: { id: true, email: true, name: true, role: true, banned: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('封禁用户失败:', error);
    return NextResponse.json({ error: '封禁用户失败' }, { status: 500 });
  }
}
