import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    question: { findUnique: vi.fn() },
    questionEdit: { create: vi.fn(), findMany: vi.fn() },
  },
}))

vi.mock("next-auth", () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { POST, GET } from "./route"

beforeEach(() => vi.clearAllMocks())

function mockRequest(id: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/questions/${id}/edits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/questions/[id]/edits", () => {
  it("未登录返回 401", async () => {
    ;(getServerSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await POST(mockRequest("q1", { description: "fix", reference: "ref" }), {
      params: Promise.resolve({ id: "q1" }),
    })
    expect(res.status).toBe(401)
  })

  it("创建编辑建议", async () => {
    ;(getServerSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u1" },
    })
    ;(prisma.question.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "q1" })
    ;(prisma.questionEdit.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "e1" })

    const res = await POST(mockRequest("q1", { description: "fix typo", reference: "new ref" }), {
      params: Promise.resolve({ id: "q1" }),
    })
    expect(res.status).toBe(201)
  })
})

describe("GET /api/questions/[id]/edits", () => {
  it("返回编辑列表", async () => {
    ;(prisma.questionEdit.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
    const res = await GET(new NextRequest("http://localhost/api/questions/q1/edits"), {
      params: Promise.resolve({ id: "q1" }),
    })
    expect(res.status).toBe(200)
  })
})
