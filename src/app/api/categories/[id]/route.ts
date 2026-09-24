import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permission';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permError = await requirePermission("category:manage");
    if (permError) return permError;

    const { id } = await params;
    const data = await request.json();
    
    const category = await prisma.category.update({
      where: { id },
      data,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('更新分类失败:', error);
    return NextResponse.json({ error: '更新分类失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permError = await requirePermission("category:manage");
    if (permError) return permError;

    const { id } = await params;
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除分类失败:', error);
    return NextResponse.json({ error: '删除分类失败' }, { status: 500 });
  }
}
