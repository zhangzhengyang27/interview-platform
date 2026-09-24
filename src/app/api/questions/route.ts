import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/permission"
import { optionalAuth } from "@/lib/session"
import { handleApiError } from "@/lib/api-response"
import { getAllCategories } from "@/lib/category-cache"
import type { Session } from "next-auth"

// Get all category IDs including subcategories - fetch all once, build tree in memory
async function getAllCategoryIds(categoryId: string): Promise<string[]> {
  const allCategories = await getAllCategories()

  const result: string[] = [categoryId]
  const childrenMap = new Map<string, string[]>()

  for (const cat of allCategories) {
    if (cat.parentId) {
      if (!childrenMap.has(cat.parentId)) {
        childrenMap.set(cat.parentId, [])
      }
      childrenMap.get(cat.parentId)!.push(cat.id)
    }
  }

  const queue = [categoryId]
  while (queue.length > 0) {
    const current = queue.shift()!
    const children = childrenMap.get(current) ?? []
    for (const childId of children) {
      result.push(childId)
      queue.push(childId)
    }
  }

  return result
}

export async function GET(request: NextRequest) {
  try {
    // 登录用户返回其个人掌握/收藏状态；游客返回全局默认值
    const session: Session | null = await optionalAuth()
    const userId = session?.user?.id as string | undefined

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") ?? ""
    const difficulty = searchParams.get("difficulty") ?? ""
    const mastery = searchParams.get("mastery") ?? ""
    const categoryId = searchParams.get("categoryId") ?? ""
    const tags = searchParams.getAll("tags")

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } }
      ]
    }

    if (difficulty) {
      where.difficulty = difficulty
    }

    // mastery 筛选基于当前用户的 UserQuestionState（游客无个人状态，忽略该筛选）
    if (mastery && userId) {
      const stateQuestionIds = await prisma.userQuestionState.findMany({
        where: { userId, mastery },
        select: { questionId: true },
      })
      where.id = { in: stateQuestionIds.map((s) => s.questionId) }
    }

    if (tags.length > 0) {
      where.tags = {
        some: {
          tag: { in: tags }
        }
      }
    }

    const questionType = searchParams.get("questionType") ?? ""

    if (questionType) {
      where.questionType = questionType
    }

    if (categoryId) {
      // Get all subcategory IDs recursively
      const allCategoryIds = await getAllCategoryIds(categoryId)
      where.categoryId = { in: allCategoryIds }
    }

    const categoryIds = searchParams.get("categoryIds")
    if (categoryIds) {
      const ids = categoryIds.split(",").filter(Boolean)
      if (ids.length > 0) {
        where.categoryId = { in: ids }
      }
    }

    const company = searchParams.get("company") ?? ""
    if (company) {
      where.company = { contains: company, mode: "insensitive" }
    }

    const jobRole = searchParams.get("jobRole") ?? ""
    if (jobRole) {
      where.jobRole = jobRole
    }

    const take = Math.min(parseInt(searchParams.get("take") ?? "100") || 100, 500)
    const skip = parseInt(searchParams.get("skip") ?? "0") || 0

    const orderByParam = searchParams.get("orderBy") ?? "createdAt"
    const orderDir = searchParams.get("orderDir") ?? "desc"
    const validOrderFields = ["createdAt", "viewCount", "encounterCount"]
    const orderField = validOrderFields.includes(orderByParam) ? orderByParam : "createdAt"

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: { tags: true, category: true },
        orderBy: { [orderField]: orderDir === "asc" ? "asc" : "desc" },
        take,
        skip
      }),
      prisma.question.count({ where })
    ])

    // 合并当前用户的个人状态（覆盖题目上的遗留全局字段值）
    let stateMap = new Map<string, { mastery: string; isBookmarked: boolean }>()
    if (userId && questions.length > 0) {
      const states = await prisma.userQuestionState.findMany({
        where: { userId, questionId: { in: questions.map((q) => q.id) } },
      })
      stateMap = new Map(states.map((s) => [s.questionId, { mastery: s.mastery, isBookmarked: s.isBookmarked }]))
    }

    return NextResponse.json({
      questions: questions.map((q) => ({
        ...q,
        mastery: stateMap.get(q.id)?.mastery ?? "unsolved",
        isBookmarked: stateMap.get(q.id)?.isBookmarked ?? false,
      })),
      total,
      take,
      skip
    })
  } catch (error) {
    return handleApiError(error, "GET /api/questions")
  }
}

export async function POST(request: NextRequest) {
  // 创建题目需要 question:add 权限（RBAC，普通用户与 admin 均已配置）
  const authError = await requirePermission("question:add");
  if (authError) return authError;

  try {
    const body = await request.json()
    const { title, content, solution, codeTemplate, difficulty, company, tags, questionType } = body

    if (!title || !content || !difficulty) {
      return NextResponse.json(
        { error: "缺少必填字段: title, content, difficulty" },
        { status: 400 }
      )
    }

    const question = await prisma.question.create({
      data: {
        title,
        content,
        solution: solution ?? null,
        codeTemplate: questionType === "code" ? (codeTemplate ?? {}) : undefined,
        questionType: questionType ?? "qa",
        difficulty,
        company: company ?? null,
        tags: tags ? { create: tags.map((tag: string) => ({ tag })) } : undefined
      },
      include: { tags: true, category: true }
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/questions")
  }
}
