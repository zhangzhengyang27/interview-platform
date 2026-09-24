import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit } from "../rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    // 每个测试前等待一小段时间，避免时间窗口重叠
    // 注意：rate-limit 使用内存 Map，测试间可能互相影响
    // 使用唯一的 identifier 避免测试间干扰
  });

  it("首次请求应成功并返回正确的 remaining", () => {
    const result = rateLimit("test-unique-1", 5, 60000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.limit).toBe(5);
    expect(result.resetTime).toBeGreaterThan(Date.now());
  });

  it("达到限制后应返回 success=false", () => {
    const id = "test-unique-2";
    // 消耗 3 次配额
    for (let i = 0; i < 3; i++) {
      const r = rateLimit(id, 3, 60000);
      expect(r.success).toBe(true);
    }
    // 第 4 次应被拒绝
    const result = rateLimit(id, 3, 60000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("不同 identifier 应独立计数", () => {
    const idA = "test-unique-3a";
    const idB = "test-unique-3b";

    // A 消耗 2 次
    rateLimit(idA, 5, 60000);
    rateLimit(idA, 5, 60000);

    // B 应该是全新的
    const resultB = rateLimit(idB, 5, 60000);
    expect(resultB.success).toBe(true);
    expect(resultB.remaining).toBe(4);
  });

  it("limit=1 时第二次请求应被拒绝", () => {
    const id = "test-unique-4";
    const first = rateLimit(id, 1, 60000);
    expect(first.success).toBe(true);
    expect(first.remaining).toBe(0);

    const second = rateLimit(id, 1, 60000);
    expect(second.success).toBe(false);
  });

  it("窗口过期后应允许新请求", async () => {
    const id = "test-unique-5";
    // 使用 50ms 的短窗口
    rateLimit(id, 1, 50);
    const blocked = rateLimit(id, 1, 50);
    expect(blocked.success).toBe(false);

    // 等待窗口过期
    await new Promise((resolve) => setTimeout(resolve, 60));

    const result = rateLimit(id, 1, 50);
    expect(result.success).toBe(true);
  });
});
