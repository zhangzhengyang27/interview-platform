import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    question: { findUnique: vi.fn(), update: vi.fn() },
    questionEncounter: { upsert: vi.fn(), count: vi.fn() }
  }
}))

vi.mock("next-auth", () => ({
  default: vi.fn(),
  getServerSession: vi.fn()
}))

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { POST } from "./route"

function mockRequest(id: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/questions/${id}/encounter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
}

beforeEach(() => vi.clearAllMocks())

describe("POST /api/questions/[id]/encounter", () => {
  it("未登录返回 401", async () => {
    ;(getServerSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await POST(mockRequest("q1", { tags: ["字节跳动"] }), {
      params: Promise.resolve({ id: "q1" })
    })
    expect(res.status).toBe(401)
  })

  it("题目不存在返回 404", async () => {
    ;(getServerSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u1" }
    })
    ;(prisma.question.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await POST(mockRequest("q1", { tags: ["字节跳动"] }), {
      params: Promise.resolve({ id: "q1" })
    })
    expect(res.status).toBe(404)
  })

  it("有效提交 upsert encounter 并更新计数", async () => {
    ;(getServerSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u1" }
    })
    ;(prisma.question.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "q1"
    })
    ;(prisma.questionEncounter.upsert as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "e1"
    })
    ;(prisma.questionEncounter.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(3)

    const res = await POST(mockRequest("q1", { tags: ["字节跳动", "后端"], note: "一面" }), {
      params: Promise.resolve({ id: "q1" })
    })
    expect(res.status).toBe(200)
    expect(prisma.question.update).toHaveBeenCalledWith({
      where: { id: "q1" },
      data: { encounterCount: 3 }
    })
  })
})
