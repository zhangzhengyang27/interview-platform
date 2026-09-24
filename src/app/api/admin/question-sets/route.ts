import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { handleApiError } from "@/lib/api-response";

// 管理端：题集列表（含未发布，带题目数与题目预览）
export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const take = Math.min(parseInt(searchParams.get("take") ?? "50") || 50, 100);
    const skip = parseInt(searchParams.get("skip") ?? "0") || 0;

    const [sets, total] = await Promise.all([
      prisma.questionSet.findMany({
        include: {
          _count: { select: { items: true } },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take,
        skip,
      }),
      prisma.questionSet.count(),
    ]);

    return NextResponse.json({
      sets: sets.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        cover: s.cover,
        isPublished: s.isPublished,
        sortOrder: s.sortOrder,
        viewCount: s.viewCount,
        createdAt: s.createdAt,
        questionCount: s._count.items,
      })),
      total,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/question-sets");
  }
}

// 管理端：创建题集（基本信息）
export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name, slug, description, cover, isPublished, sortOrder, questionIds } = body;

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: "名称和别名（slug）不能为空" }, { status: 400 });
    }

    const normalizedSlug = String(slug).trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
      return NextResponse.json({ error: "别名（slug）只能包含小写字母、数字和连字符" }, { status: 400 });
    }

    // slug 唯一性检查
    const existing = await prisma.questionSet.findUnique({ where: { slug: normalizedSlug } });
    if (existing) {
      return NextResponse.json({ error: "该别名（slug）已被使用" }, { status: 400 });
    }

    const questionIdsArr = Array.isArray(questionIds)
      ? Array.from(new Set(questionIds.map((x: string) => x).filter(Boolean)))
      : [];
    const set = await prisma.questionSet.create({
      data: {
        name: name.trim(),
        slug: normalizedSlug,
        description: description?.trim() || null,
        cover: cover?.trim() || null,
        isPublished: isPublished !== false,
        sortOrder: Number(sortOrder) || 0,
        items: questionIdsArr.length
          ? {
              create: questionIdsArr.map((questionId: string, index: number) => ({
                questionId,
                sortOrder: index + 1,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json({ id: set.id, name: set.name }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST /api/admin/question-sets");
  }
}
