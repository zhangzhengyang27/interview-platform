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
    const { banned } = await request.json();
    
    // 使用 bio 字段存储封禁状态（临时方案）
    // 更好的方案是在 User 模型中添加 banned 字段
    const user = await prisma.user.update({
      where: { id },
      data: { 
        bio: banned ? '[BANNED]' : null 
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('封禁用户失败:', error);
    return NextResponse.json({ error: '封禁用户失败' }, { status: 500 });
  }
}
