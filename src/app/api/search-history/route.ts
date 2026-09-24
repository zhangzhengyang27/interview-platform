import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, getCurrentUser } from "@/lib/session"

export async function POST(request: NextRequest) {
  // 搜索历史仅登录用户写入（此前匿名可无限灌库）
  const authError = await requireAuth()
  if (authError) return authError
  const user = await getCurrentUser()

  const { content } = await request.json()

  const trimmed = content?.trim()
  if (!trimmed) {
    return NextResponse.json({ error: "搜索内容不能为空" }, { status: 400 })
  }
  if (trimmed.length > 200) {
    return NextResponse.json({ error: "搜索内容过长" }, { status: 400 })
  }

  await prisma.searchHistory.create({
    data: {
      content: trimmed,
      userId: user!.id,
    },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
