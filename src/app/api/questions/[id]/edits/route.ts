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
  const { description, reference } = await request.json()

  if (!description?.trim() || !reference?.trim()) {
    return NextResponse.json({ error: "说明和参考解析不能为空" }, { status: 400 })
  }

  const question = await prisma.question.findUnique({ where: { id } })
  if (!question) {
    return NextResponse.json({ error: "题目不存在" }, { status: 404 })
  }

  const edit = await prisma.questionEdit.create({
    data: {
      questionId: id,
      userId: session.user.id,
      description: description.trim(),
      reference: reference.trim(),
    },
  })

  return NextResponse.json({ id: edit.id }, { status: 201 })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const edits = await prisma.questionEdit.findMany({
    where: { questionId: id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  })
  return NextResponse.json({ edits })
}
