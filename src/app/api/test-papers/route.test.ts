import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    question: { findMany: vi.fn() },
    testPaper: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn()
    }
  }
}))

vi.mock("next-auth", () => ({
  default: vi.fn(),
  getServerSession: vi.fn()
}))

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { POST, GET } from "./route"

beforeEach(() => vi.clearAllMocks())

function mockRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/test-papers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
}

describe("POST /api/test-papers", () => {
  it("未登录返回 401", async () => {
    ;(getServerSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await POST(mockRequest({ title: "试卷", questionIds: ["q1"] }))
    expect(res.status).toBe(401)
  })

  it("有效数据创建试卷", async () => {
    ;(getServerSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u1" }
    })
    ;(prisma.question.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "q1", questionType: "qa" },
      { id: "q2", questionType: "code" }
    ])
    ;(prisma.testPaper.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "p1",
      name: "试卷"
    })

    const res = await POST(mockRequest({ title: "试卷", questionIds: ["q1", "q2"] }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe("p1")
  })
})

describe("GET /api/test-papers", () => {
  it("返回列表", async () => {
    ;(prisma.testPaper.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([])
    ;(prisma.testPaper.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(0)
    const res = await GET(new NextRequest("http://localhost/api/test-papers"))
    expect(res.status).toBe(200)
  })
})
