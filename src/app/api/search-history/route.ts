import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const { content } = await request.json()

  const trimmed = content?.trim()
  if (!trimmed) {
    return NextResponse.json({ error: "搜索内容不能为空" }, { status: 400 })
  }

  await prisma.searchHistory.create({
    data: {
      content: trimmed,
      userId: session?.user?.id ?? null,
    },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
