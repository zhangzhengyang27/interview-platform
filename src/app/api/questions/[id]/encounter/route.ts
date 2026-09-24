import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { id } = await params
  const { tags, note } = await request.json()

  if (!Array.isArray(tags) || tags.length === 0) {
    return NextResponse.json({ error: "至少选择一个标签" }, { status: 400 })
  }

  const question = await prisma.question.findUnique({ where: { id } })
  if (!question) {
    return NextResponse.json({ error: "题目不存在" }, { status: 404 })
  }

  // 使用事务避免竞态条件
  const result = await prisma.$transaction(async (tx) => {
    await tx.questionEncounter.upsert({
      where: {
        userId_questionId: {
          userId: session.user.id,
          questionId: id,
        },
      },
      update: { tags, note: note ?? null },
      create: {
        userId: session.user.id,
        questionId: id,
        tags,
        note: note ?? null,
      },
    })

    // 原子递增 encounterCount
    const updated = await tx.question.update({
      where: { id },
      data: { encounterCount: { increment: 1 } },
      select: { encounterCount: true },
    })

    return updated.encounterCount
  })

  return NextResponse.json({ success: true, encounterCount: result })
}
