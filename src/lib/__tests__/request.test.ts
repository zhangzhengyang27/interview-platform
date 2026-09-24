// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(async () => undefined),
}));

import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from "../request";
import { signOut } from "next-auth/react";

const mockSignOut = signOut as unknown as ReturnType<typeof vi.fn>;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe("request 统一封装", () => {
  it("apiGet 解析 JSON 并返回", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ ok: 1 })));
    expect(await apiGet("/api/x")).toEqual({ ok: 1 });
  });

  it("apiPost 自动序列化 json 请求体并设置 Content-Type", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      jsonResponse({ created: true }, 201)
    );
    vi.stubGlobal("fetch", fetchMock);
    await apiPost("/api/x", { a: 1 });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"a":1}');
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
  });

  it("apiPatch / apiDelete 方法正确", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    await apiPatch("/api/x", { b: 2 });
    await apiDelete("/api/x");
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe("PATCH");
    expect((fetchMock.mock.calls[1][1] as RequestInit).method).toBe("DELETE");
  });

  it("非 2xx 抛 ApiError，message 优先取后端 error 字段", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "题目不存在" }, 404)));
    await expect(apiGet("/api/x")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      message: "题目不存在",
    });
  });

  it("401 触发 signOut 跳登录", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "未登录" }, 401)));
    await expect(apiGet("/api/x")).rejects.toBeInstanceOf(ApiError);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("redirectOnAuth=false 时 401 不触发 signOut，直接抛 ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 401)));
    await expect(apiGet("/api/x", { redirectOnAuth: false })).rejects.toMatchObject({ status: 401 });
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("网络异常抛 status=0 的 ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("fetch failed");
    }));
    await expect(apiGet("/api/x")).rejects.toMatchObject({ status: 0 });
  });

  it("204 无内容返回 undefined", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    expect(await apiDelete("/api/x")).toBeUndefined();
  });

  it("raw=true 返回原始 Response 以便读取 headers", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ big: true })));
    const res = await apiGet("/api/x", { raw: true }) as Response;
    expect(res).toBeInstanceOf(Response);
  });
});
