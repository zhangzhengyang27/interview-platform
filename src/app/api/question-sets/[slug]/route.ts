import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-response";

// 公开题集详情 + 题目分页列表
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const take = Math.min(parseInt(searchParams.get("take") ?? "24") || 24, 100);
    const skip = parseInt(searchParams.get("skip") ?? "0") || 0;

    const set = await prisma.questionSet.findUnique({
      where: { slug },
      include: { _count: { select: { items: true } } },
    });

    if (!set || !set.isPublished) {
      return NextResponse.json({ error: "题集不存在或未发布" }, { status: 404 });
    }

    // 仅首次进入（skip=0）时自增浏览量，翻页不重复计数
    let viewCount = set.viewCount;
    if (skip === 0) {
      const updated = await prisma.questionSet.update({
        where: { id: set.id },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      });
      viewCount = updated.viewCount;
    }

    const [items, total] = await Promise.all([
      prisma.questionSetItem.findMany({
        where: { questionSetId: set.id },
        include: {
          question: {
            include: { tags: true, category: { select: { id: true, name: true } } },
          },
        },
        orderBy: { sortOrder: "asc" },
        skip,
        take,
      }),
      prisma.questionSetItem.count({ where: { questionSetId: set.id } }),
    ]);

    return NextResponse.json({
      set: {
        id: set.id,
        name: set.name,
        slug: set.slug,
        description: set.description,
        cover: set.cover,
        viewCount,
        createdAt: set.createdAt,
        questionCount: set._count.items,
      },
      questions: items.map((i) => i.question),
      total,
      take,
      skip,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/question-sets/[slug]");
  }
}
