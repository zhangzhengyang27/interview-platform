import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { title, detail, isPublic, questionIds } = await request.json()
  if (!title?.trim() || !Array.isArray(questionIds) || questionIds.length === 0) {
    return NextResponse.json({ error: "标题和题目不能为空" }, { status: 400 })
  }

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

  const where: Prisma.TestPaperWhereInput = {}
  if (isPublic !== null) {
    where.isPublic = isPublic === "true"
  }
  if (mine) {
    const session = await getServerSession(authOptions)
    if (session?.user?.id) {
      where.userId = session.user.id
    }
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
