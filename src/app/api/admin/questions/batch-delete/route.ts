import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permission';

export async function POST(request: NextRequest) {
  const authError = await requirePermission('question:manage');
  if (authError) return authError;

  try {
    const { ids } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '无效的 ID 列表' }, { status: 400 });
    }

    const result = await prisma.question.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      count: result.count 
    });
  } catch (error) {
    console.error('批量删除题目失败:', error);
    return NextResponse.json({ error: '批量删除题目失败' }, { status: 500 });
  }
}
