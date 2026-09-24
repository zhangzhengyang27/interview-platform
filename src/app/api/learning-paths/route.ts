import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permission";

export const dynamic = "force-dynamic";

// 难度级别中文映射
const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "初级",
  intermediate: "中级",
  advanced: "高级",
};

// 分类中文映射
const CATEGORY_LABELS: Record<string, string> = {
  backend: "后端",
  frontend: "前端",
  algorithm: "算法",
  database: "数据库",
  fullstack: "全栈",
  "system-design": "系统设计",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const presetOnly = searchParams.get("preset") === "true";

    const where: Record<string, unknown> = {};
    if (category && category !== "all") {
      where.category = category;
    }
    if (presetOnly) {
      where.isPreset = true;
    }

    const paths = await prisma.learningPath.findMany({
      where,
      orderBy: [{ isPreset: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    const result = paths.map((path) => ({
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
      totalItems: path._count.items,
      createdAt: path.createdAt,
      updatedAt: path.updatedAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/learning-paths error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const permError = await requirePermission("path:manage");
    if (permError) return permError;

    const body = await request.json();
    const { title, description, icon, durationDays, difficultyLevel, category } = body;

    if (!title || !durationDays || !difficultyLevel || !category) {
      return NextResponse.json(
        { error: "缺少必填字段: title, durationDays, difficultyLevel, category" },
        { status: 400 }
      );
    }

    const validDifficulties = ["beginner", "intermediate", "advanced"];
    const validCategories = ["backend", "frontend", "algorithm", "database", "fullstack", "system-design"];

    if (!validDifficulties.includes(difficultyLevel)) {
      return NextResponse.json(
        { error: `difficultyLevel must be one of: ${validDifficulties.join(", ")}` },
        { status: 400 }
      );
    }

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `category must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    const path = await prisma.learningPath.create({
      data: {
        title,
        description: description ?? null,
        icon: icon ?? null,
        durationDays: Number(durationDays),
        difficultyLevel,
        category,
        isPreset: false,
      },
    });

    return NextResponse.json(path, { status: 201 });
  } catch (error) {
    console.error("POST /api/learning-paths error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
