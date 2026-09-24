import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000)

  const rows = await prisma.searchHistory.findMany({
    where: { createdAt: { gte: since } },
    select: { content: true },
  })

  const counts: Record<string, number> = {}
  rows.forEach((r) => {
    const key = r.content.trim()
    counts[key] = (counts[key] ?? 0) + 1
  })

  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([content]) => content)

  return NextResponse.json({ hot: top })
}
