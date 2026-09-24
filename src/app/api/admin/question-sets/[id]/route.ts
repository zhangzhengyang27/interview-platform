import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { handleApiError } from "@/lib/api-response";

// 管理端：单个题集详情（含已绑定题目，供编辑回填）
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const set = await prisma.questionSet.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            question: {
              select: { id: true, title: true, difficulty: true, questionType: true },
            },
          },
        },
      },
    });

    if (!set) {
      return NextResponse.json({ error: "题集不存在" }, { status: 404 });
    }

    return NextResponse.json({
      id: set.id,
      name: set.name,
      slug: set.slug,
      description: set.description,
      cover: set.cover,
      isPublished: set.isPublished,
      sortOrder: set.sortOrder,
      createdAt: set.createdAt,
      questions: set.items.map((i) => ({ ...i.question, sortOrder: i.sortOrder })),
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/question-sets/[id]");
  }
}

// 管理端：更新题集基本信息（并可选替换绑定题目）
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, description, cover, isPublished, sortOrder, questionIds } = body;

    const existing = await prisma.questionSet.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "题集不存在" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
      data.name = name.trim();
    }
    if (slug !== undefined) {
      const normalizedSlug = String(slug).trim().toLowerCase();
      if (!normalizedSlug) return NextResponse.json({ error: "别名（slug）不能为空" }, { status: 400 });
      if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
        return NextResponse.json({ error: "别名（slug）只能包含小写字母、数字和连字符" }, { status: 400 });
      }
      const conflict = await prisma.questionSet.findUnique({ where: { slug: normalizedSlug } });
      if (conflict && conflict.id !== id) {
        return NextResponse.json({ error: "该别名（slug）已被使用" }, { status: 400 });
      }
      data.slug = normalizedSlug;
    }
    if (description !== undefined) data.description = description?.trim() || null;
    if (cover !== undefined) data.cover = cover?.trim() || null;
    if (isPublished !== undefined) data.isPublished = Boolean(isPublished);
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder) || 0;

    // 更新题集信息
    const set = await prisma.questionSet.update({ where: { id }, data });

    // 若提供了 questionIds，则替换绑定题目
    if (Array.isArray(questionIds)) {
      const questionIdsArr = questionIds.map((x: string) => x).filter(Boolean);
      const uniqueIds = Array.from(new Set(questionIdsArr));
      await prisma.$transaction([
        prisma.questionSetItem.deleteMany({ where: { questionSetId: id } }),
        ...(uniqueIds.length
          ? [
              prisma.questionSetItem.createMany({
                data: uniqueIds.map((questionId, index) => ({
                  questionSetId: id,
                  questionId,
                  sortOrder: index + 1,
                })),
              }),
            ]
          : []),
      ]);
    }

    return NextResponse.json({ id: set.id, name: set.name, success: true });
  } catch (error) {
    return handleApiError(error, "PATCH /api/admin/question-sets/[id]");
  }
}

// 管理端：删除题集（级联删除绑定题目）
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;
    await prisma.questionSet.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/admin/question-sets/[id]");
  }
}
