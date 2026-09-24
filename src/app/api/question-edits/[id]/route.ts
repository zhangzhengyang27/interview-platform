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

  // 检查管理员权限
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "无权审核，仅管理员可操作" }, { status: 403 })
  }

  const { id } = await params
  const { status, reviewMessage } = await request.json()

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "状态无效" }, { status: 400 })
  }

  const edit = await prisma.questionEdit.findUnique({ where: { id }, include: { question: true } })
  if (!edit) {
    return NextResponse.json({ error: "建议不存在" }, { status: 404 })
  }

  await prisma.questionEdit.update({
    where: { id },
    data: {
      status,
      reviewMessage: reviewMessage ?? null,
      reviewerId: session.user.id,
    },
  })

  if (status === "approved") {
    await prisma.question.update({
      where: { id: edit.questionId },
      data: { solution: edit.reference },
    })
  }

  return NextResponse.json({ success: true })
}
