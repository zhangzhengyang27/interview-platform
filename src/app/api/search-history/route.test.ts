import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    searchHistory: { create: vi.fn() },
  },
}))

vi.mock("@/lib/session", () => ({
  requireAuth: vi.fn(),
  getCurrentUser: vi.fn(),
}))

import { prisma } from "@/lib/prisma"
import { requireAuth, getCurrentUser } from "@/lib/session"
import { POST } from "./route"

function mockRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/search-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => vi.clearAllMocks())

describe("POST /api/search-history", () => {
  it("未登录返回 401", async () => {
    ;(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "未登录" }), { status: 401 })
    )
    const res = await POST(mockRequest({ content: "Redis" }))
    expect(res.status).toBe(401)
  })

  it("空内容返回 400", async () => {
    ;(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u1" })
    const res = await POST(mockRequest({ content: "  " }))
    expect(res.status).toBe(400)
  })

  it("保存搜索历史", async () => {
    ;(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u1" })
    ;(prisma.searchHistory.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "s1",
    })
    const res = await POST(mockRequest({ content: "Redis" }))
    expect(res.status).toBe(201)
    expect(prisma.searchHistory.create).toHaveBeenCalledWith({
      data: { content: "Redis", userId: "u1" },
    })
  })
})
