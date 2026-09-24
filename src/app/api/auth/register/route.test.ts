// 注册 API (POST /api/auth/register) 的测试
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock prisma 客户端：使用 vi.mock 替换整个 @/lib/prisma 模块
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock bcryptjs：替换其 hash 方法
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("mocked-hashed-password"),
  },
}));

// Mock rate-limit：总是允许通过，避免测试间速率限制互相影响
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({
    success: true,
    remaining: 10,
    limit: 10,
    resetTime: Date.now() + 60000,
  }),
  getClientIp: vi.fn().mockReturnValue("test-ip"),
  rateLimitHeaders: vi.fn().mockReturnValue({}),
}));

// Mock verify-code：验证码验证总是通过
vi.mock("@/lib/verify-code", () => ({
  verifyCode: vi.fn().mockResolvedValue(true),
  saveCode: vi.fn(),
  isRateLimited: vi.fn().mockResolvedValue(false),
}));

// 在每个测试用例之前重置 mock 的调用记录
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

// 辅助函数：模拟 NextRequest，用于发送带有指定 JSON body 的请求
function createMockRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  it("当邮箱已存在时，返回 409 冲突状态", async () => {
    // 模拟 findUnique 返回一个已存在的用户
    (prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "1",
      email: "test@example.com",
      name: "test",
      password: "hashed",
    });

    const request = createMockRequest({
      email: "test@example.com",
      password: "password123",
    });
    const response = await POST(request);

    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json.error).toBe("该邮箱已被注册");
    // 不应调用 bcrypt.hash 和 prisma.user.create
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("当输入有效时，应当创建用户并返回 201 状态", async () => {
    // findUnique 返回 null（邮箱不存在）
    (prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    // create 返回新创建的用户对象
    (prisma.user.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "new-user-id",
      email: "new@example.com",
      name: "newuser",
    });

    const request = createMockRequest({
      email: "new@example.com",
      password: "password123",
      name: "newuser",
      code: "123456",
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toEqual({
      id: "new-user-id",
      email: "new@example.com",
      name: "newuser",
    });
    // 验证 bcrypt.hash 被调用
    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
    // 验证 prisma.user.create 被调用，并传入正确的参数
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "new@example.com",
        name: "newuser",
        password: "mocked-hashed-password",
      }),
    });
  });

  it("当密码不足 6 位时，返回 400 错误", async () => {
    const request = createMockRequest({
      email: "test@example.com",
      password: "123",
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("密码至少6位");
    // 不应调用 prisma 或 bcrypt
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it("当缺少密码时，返回 400 错误", async () => {
    const request = createMockRequest({
      email: "test@example.com",
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("密码至少6位");
  });

  it("当缺少邮箱时，返回 400 错误", async () => {
    const request = createMockRequest({
      password: "password123",
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("密码至少6位");
  });

  it("当未提供 name 时，应当使用邮箱前缀作为默认名称", async () => {
    (prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.user.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-id",
      email: "alice@example.com",
      name: "alice",
    });

    const request = createMockRequest({
      email: "alice@example.com",
      password: "password123",
      code: "123456",
      // 注意：不提供 name
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "alice@example.com",
        name: "alice",
        password: "mocked-hashed-password",
      }),
    });
  });

  it("当 prisma 抛出异常时，返回 500 错误", async () => {
    (prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.user.create as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB connection error")
    );

    const request = createMockRequest({
      email: "test@example.com",
      password: "password123",
      code: "123456",
    });
    const response = await POST(request);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("注册失败");
  });
});
