import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { invalidateCategoryCache } from "@/lib/category-cache"
import { requirePermission } from "@/lib/permission"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get("includeStats") === "true"

    const categories = await prisma.category.findMany({
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }]
    })

    if (includeStats) {
      const stats = await prisma.question.groupBy({
        by: ["categoryId"],
        _count: { id: true }
      })

      const countMap: Record<string, number> = {}
      let uncategorizedCount = 0
      for (const s of stats) {
        if (s.categoryId) {
          countMap[s.categoryId] = s._count.id
        } else {
          uncategorizedCount = s._count.id
        }
      }

      // Build parent→children map so tech-level counts include subcategories
      const childrenMap: Record<string, string[]> = {}
      for (const c of categories) {
        if (c.parentId) {
          if (!childrenMap[c.parentId]) childrenMap[c.parentId] = []
          childrenMap[c.parentId].push(c.id)
        }
      }

      // Recursively sum child counts into parent
      function sumChildren(id: string): number {
        const children = childrenMap[id] ?? []
        let sum = countMap[id] ?? 0
        for (const childId of children) {
          sum += sumChildren(childId)
        }
        return sum
      }

      return NextResponse.json({
        categories: categories.map((c) => ({
          ...c,
          questionCount: sumChildren(c.id)
        })),
        uncategorizedCount,
        total: Object.values(countMap).reduce((a, b) => a + b, 0) + uncategorizedCount
      })
    }

    return NextResponse.json(categories)
  } catch (error) {
    console.error("GET /api/categories error:", error)
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const permError = await requirePermission("category:manage");
    if (permError) return permError;

    const body = await request.json()
    const { name, type, description, icon } = body

    if (!name || !type) {
      return NextResponse.json({ error: "name 和 type 不能为空" }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: { name, type, description: description ?? null, icon: icon ?? null }
    })

    // 清除分类缓存，使新分类立即生效
    invalidateCategoryCache()

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("POST /api/categories error:", error)
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 })
  }
}
