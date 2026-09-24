import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    questionHint: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn() },
    question: { findUnique: vi.fn() },
  },
}))

vi.mock("@/lib/session", () => ({
  requireAuth: vi.fn(),
  getCurrentUser: vi.fn(),
}))

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ success: true, remaining: 1, limit: 10, resetTime: 0 })),
  rateLimitHeaders: vi.fn(() => ({})),
}))

vi.mock("@/lib/deepseek", () => ({
  validateDeepSeekApiKey: vi.fn(() => ({ valid: true })),
  callDeepSeek: vi.fn(),
}))

import { prisma } from "@/lib/prisma"
import { requireAuth, getCurrentUser } from "@/lib/session"
import { callDeepSeek } from "@/lib/deepseek"
import { GET, POST } from "./route"

const mockFindUnique = prisma.questionHint.findUnique as unknown as ReturnType<typeof vi.fn>
const mockCreate = prisma.questionHint.create as unknown as ReturnType<typeof vi.fn>
const mockQuestion = prisma.question.findUnique as unknown as ReturnType<typeof vi.fn>

function postRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/questions/q1/hints", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => vi.clearAllMocks())

describe("GET /api/questions/[id]/hints", () => {
  it("返回已缓存的提示列表（无需登录）", async () => {
    ;(prisma.questionHint.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { level: 1, content: "想想哈希表", createdAt: new Date() },
    ])
    const res = await GET(new NextRequest("http://localhost/api/questions/q1/hints"), {
      params: Promise.resolve({ id: "q1" }),
    })
    expect(res.status).toBe(200)
  })
})

describe("POST /api/questions/[id]/hints", () => {
  it("未登录返回 401", async () => {
    ;(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      NextResponse.json({ error: "未登录" }, { status: 401 })
    )
    const res = await POST(postRequest({ level: 1 }), { params: Promise.resolve({ id: "q1" }) })
    expect(res.status).toBe(401)
  })

  it("非法 level 返回 400", async () => {
    ;(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u1" })
    const res = await POST(postRequest({ level: 4 }), { params: Promise.resolve({ id: "q1" }) })
    expect(res.status).toBe(400)
  })

  it("命中缓存时不调用 AI", async () => {
    ;(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u1" })
    mockFindUnique.mockResolvedValue({ level: 1, content: "想想哈希表" })
    const res = await POST(postRequest({ level: 1 }), { params: Promise.resolve({ id: "q1" }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.cached).toBe(true)
    expect(callDeepSeek).not.toHaveBeenCalled()
  })

  it("无缓存时生成提示并落库", async () => {
    ;(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u1" })
    mockFindUnique
      .mockResolvedValueOnce(null) // 查缓存：无
      .mockResolvedValueOnce(null) // 并发兜底回读：仍无
    mockQuestion.mockResolvedValue({ title: "T", content: "C", solution: null, questionType: "qa" })
    ;(callDeepSeek as unknown as ReturnType<typeof vi.fn>).mockResolvedValue("考虑哈希表以 O(1) 查找。")
    mockCreate.mockResolvedValue({ level: 1, content: "考虑哈希表以 O(1) 查找。" })

    const res = await POST(postRequest({ level: 1 }), { params: Promise.resolve({ id: "q1" }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.cached).toBe(false)
    expect(body.content).toContain("哈希表")
    expect(mockCreate).toHaveBeenCalledWith({
      data: { questionId: "q1", level: 1, content: "考虑哈希表以 O(1) 查找。" },
    })
  })

  it("题目不存在返回 404", async () => {
    ;(requireAuth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u1" })
    mockFindUnique.mockResolvedValue(null)
    mockQuestion.mockResolvedValue(null)
    const res = await POST(postRequest({ level: 2 }), { params: Promise.resolve({ id: "q1" }) })
    expect(res.status).toBe(404)
  })
})
