import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { ids, status } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '无效的 ID 列表' }, { status: 400 });
    }

    if (!['resolved', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: '无效的状态值' }, { status: 400 });
    }

    const result = await prisma.report.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('批量处理举报失败:', error);
    return NextResponse.json({ error: '批量处理举报失败' }, { status: 500 });
  }
}
