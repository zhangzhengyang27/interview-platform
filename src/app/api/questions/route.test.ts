import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: { findMany: vi.fn() },
    question: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    userQuestionState: { findMany: vi.fn() },
  },
}))

vi.mock("@/lib/session", () => ({
  optionalAuth: vi.fn(),
  requireAuth: vi.fn(),
  getCurrentUser: vi.fn(),
}))

import { prisma } from "@/lib/prisma"
import { optionalAuth } from "@/lib/session"
import { GET } from "./route"

beforeEach(() => vi.clearAllMocks())

function req(url: string): NextRequest {
  return new NextRequest(url)
}

describe("GET /api/questions", () => {
  it("默认按 createdAt desc 排序", async () => {
    ;(optionalAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(prisma.category.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
    ;(prisma.question.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
    ;(prisma.question.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(0)

    await GET(req("http://localhost/api/questions"))
    expect(prisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } })
    )
  })

  it("支持按 encounterCount desc 排序", async () => {
    ;(optionalAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(prisma.category.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
    ;(prisma.question.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
    ;(prisma.question.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(0)

    await GET(req("http://localhost/api/questions?orderBy=encounterCount&orderDir=desc"))
    expect(prisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { encounterCount: "desc" } })
    )
  })
})
