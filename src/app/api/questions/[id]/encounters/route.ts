import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const encounters = await prisma.questionEncounter.findMany({
    where: { questionId: id },
    select: { tags: true, note: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  const tagCounts: Record<string, number> = {}
  encounters.forEach((e) => {
    e.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    })
  })

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }))

  return NextResponse.json({ total: encounters.length, topTags })
}
