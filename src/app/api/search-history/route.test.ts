import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    searchHistory: { create: vi.fn() },
  },
}))

vi.mock("next-auth", () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
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
  it("空内容返回 400", async () => {
    const res = await POST(mockRequest({ content: "  " }))
    expect(res.status).toBe(400)
  })

  it("保存搜索历史", async () => {
    ;(getServerSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u1" },
    })
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
