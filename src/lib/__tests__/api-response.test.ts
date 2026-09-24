// @vitest-environment node
import { describe, it, expect } from "vitest";
import { ok, fail, handleApiError } from "../api-response";

describe("api-response 统一包装", () => {
  it("ok 保持负载在顶层", async () => {
    const res = ok({ id: "1", name: "x" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ id: "1", name: "x" });
  });

  it("fail 返回 { success, code, error } 与指定状态码", async () => {
    const res = fail(1001, "参数不合法", 422);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe(1001);
    expect(body.error).toBe("参数不合法");
  });

  it("handleApiError 统一 500 且不泄露内部错误细节", async () => {
    const res = handleApiError(new Error("数据库密码: secret123"), "GET /api/test");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "服务器内部错误" });
  });
});
