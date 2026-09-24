import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permission";

export const dynamic = "force-dynamic";

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "初级",
  intermediate: "中级",
  advanced: "高级",
};

const CATEGORY_LABELS: Record<string, string> = {
  backend: "后端",
  frontend: "前端",
  algorithm: "算法",
  database: "数据库",
  fullstack: "全栈",
  "system-design": "系统设计",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const path = await prisma.learningPath.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: [{ dayNumber: "asc" }, { sortOrder: "asc" }],
          include: {
            question: {
              select: {
                id: true,
                title: true,
                difficulty: true,
                questionType: true,
                tags: {
                  select: { tag: true },
                },
                category: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!path) {
      return NextResponse.json(
        { error: "学习路线不存在" },
        { status: 404 }
      );
    }

    // 按天分组
    const dayMap = new Map<number, typeof path.items>();
    for (const item of path.items) {
      const existing = dayMap.get(item.dayNumber) ?? [];
      existing.push(item);
      dayMap.set(item.dayNumber, existing);
    }

    const days = Array.from(dayMap.entries())
      .map(([dayNumber, items]) => ({
        dayNumber,
        theme: items[0]?.title ?? "",
        description: items[0]?.description ?? "",
        questionCount: items.length,
        items: items.map((item) => ({
          id: item.id,
          questionId: item.question.id,
          title: item.question.title,
          difficulty: item.question.difficulty,
          questionType: item.question.questionType,
          isRequired: item.isRequired,
          sortOrder: item.sortOrder,
          tags: item.question.tags.map((t) => t.tag),
          categoryName: item.question.category?.name,
        })),
      }))
      .sort((a, b) => a.dayNumber - b.dayNumber);

    return NextResponse.json({
      id: path.id,
      title: path.title,
      description: path.description,
      icon: path.icon,
      durationDays: path.durationDays,
      difficultyLevel: path.difficultyLevel,
      difficultyLabel: DIFFICULTY_LABELS[path.difficultyLevel] ?? path.difficultyLevel,
      category: path.category,
      categoryLabel: CATEGORY_LABELS[path.category] ?? path.category,
      isPreset: path.isPreset,
      totalDays: days.length,
      totalQuestions: path.items.length,
      days,
      createdAt: path.createdAt,
      updatedAt: path.updatedAt,
    });
  } catch (error) {
    console.error("GET /api/learning-paths/[id] error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permError = await requirePermission("path:manage");
    if (permError) return permError;

    const { id } = await params;

    await prisma.learningPath.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/learning-paths/[id] error:", error);
    return NextResponse.json(
      { error: "删除学习路线失败" },
      { status: 500 }
    );
  }
}

/**
 * 编辑学习路径基础信息（供后台管理使用）。
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permError = await requirePermission("path:manage");
    if (permError) return permError;

    const { id } = await params;
    const body = await request.json();
    const { title, description, icon, durationDays, difficultyLevel, category } = body;

    const existing = await prisma.learningPath.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "学习路线不存在" }, { status: 404 });
    }

    const validDifficulties = ["beginner", "intermediate", "advanced"];
    const validCategories = ["backend", "frontend", "algorithm", "database", "fullstack", "system-design"];

    if (difficultyLevel !== undefined && !validDifficulties.includes(difficultyLevel)) {
      return NextResponse.json(
        { error: `difficultyLevel must be one of: ${validDifficulties.join(", ")}` },
        { status: 400 }
      );
    }
    if (category !== undefined && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: `category must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (icon !== undefined) data.icon = icon;
    if (durationDays !== undefined) data.durationDays = Number(durationDays);
    if (difficultyLevel !== undefined) data.difficultyLevel = difficultyLevel;
    if (category !== undefined) data.category = category;

    const path = await prisma.learningPath.update({ where: { id }, data });

    return NextResponse.json(path);
  } catch (error) {
    console.error("PATCH /api/learning-paths/[id] error:", error);
    return NextResponse.json(
      { error: "更新学习路线失败" },
      { status: 500 }
    );
  }
}
