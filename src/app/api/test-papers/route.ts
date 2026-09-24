import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"
import { parseBody } from "@/lib/validate"
import { createTestPaperSchema } from "@/lib/schemas"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const parsed = await parseBody(request, createTestPaperSchema)
  if (!parsed.success) return parsed.response
  const { title, detail, isPublic, questionIds } = parsed.data

  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, questionType: true }
  })
  const questionMap = new Map(questions.map((q) => [q.id, q.questionType]))

  const paper = await prisma.testPaper.create({
    data: {
      name: title.trim(),
      detail: detail?.trim() || null,
      isPublic: Boolean(isPublic),
      userId: session.user.id,
      items: {
        create: questionIds.map((questionId: string, index: number) => ({
          questionId,
          questionType: questionMap.get(questionId) ?? "qa",
          sortOrder: index + 1
        }))
      }
    }
  })

  return NextResponse.json({ id: paper.id, name: paper.name }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const take = Math.min(parseInt(searchParams.get("take") ?? "50") || 50, 100)
  const skip = parseInt(searchParams.get("skip") ?? "0") || 0
  const isPublic = searchParams.get("isPublic")
  const mine = searchParams.get("mine") === "true"

  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const isAdmin = session?.user?.role === "admin"

  // 默认只暴露公开试卷 + 本人试卷；未登录只能看公开的。
  // 显式传 isPublic=true 可查公开池，传 false 仅管理员可用（否则忽略，防止越权枚举私有卷）
  const where: Prisma.TestPaperWhereInput = {}
  if (isPublic !== null && (isPublic !== "false" || isAdmin)) {
    where.isPublic = isPublic === "true"
  }
  if (mine) {
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }
    where.userId = userId
  } else if (isPublic === null && !isAdmin) {
    where.OR = [{ isPublic: true }, ...(userId ? [{ userId }] : [])]
  }

  const [papers, total] = await Promise.all([
    prisma.testPaper.findMany({
      where,
      include: {
        items: { include: { question: { select: { id: true, title: true, difficulty: true } } } },
        user: { select: { name: true } }
      },
      orderBy: { createdAt: "desc" },
      take,
      skip
    }),
    prisma.testPaper.count({ where })
  ])

  return NextResponse.json({ papers, total, take, skip })
}
