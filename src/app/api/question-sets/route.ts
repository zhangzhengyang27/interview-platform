import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-response";

// 公开题集列表（仅已发布），含题目数
export async function GET() {
  try {
    const sets = await prisma.questionSet.findMany({
      where: { isPublished: true },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    const result = sets.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      cover: s.cover,
      viewCount: s.viewCount,
      createdAt: s.createdAt,
      questionCount: s._count.items,
    }));

    return NextResponse.json({ sets: result });
  } catch (error) {
    return handleApiError(error, "GET /api/question-sets");
  }
}
