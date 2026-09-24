// @vitest-environment node
// jose 依赖 Node 原生 Uint8Array（jsdom 环境的 realm 不一致会报
// "payload must be an instance of Uint8Array"），本文件使用 node 环境。
import { describe, it, expect } from "vitest";
import { signJWT, verifyJWT } from "../jwt";

// 注意：jwt.ts 在模块加载时即固化密钥（AUTH_SECRET 或开发默认值），
// 测试环境未设置 AUTH_SECRET，模块会使用固定的开发默认密钥——
// 签发与验证使用同一密钥实例，往返用例仍然成立。
describe("jwt sign/verify", () => {
  it("签名后可验证并还原 payload", async () => {
    const token = await signJWT({
      userId: "u-123",
      email: "a@b.com",
      role: "admin",
    });
    const payload = await verifyJWT(token);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe("u-123");
    expect(payload!.email).toBe("a@b.com");
    expect(payload!.role).toBe("admin");
  });

  it("篡改的 token 返回 null 而不是抛错", async () => {
    const token = await signJWT({ userId: "u-1", email: "a@b.com", role: "user" });
    const tampered = token.slice(0, -4) + "aaaa";
    expect(await verifyJWT(tampered)).toBeNull();
  });

  it("任意非法字符串返回 null", async () => {
    expect(await verifyJWT("not-a-token")).toBeNull();
    expect(await verifyJWT("")).toBeNull();
  });
});
