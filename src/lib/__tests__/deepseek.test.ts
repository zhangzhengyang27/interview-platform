// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { callDeepSeek, callDeepSeekStream, sseFormat } from "../deepseek";

const originalKey = process.env.DEEPSEEK_API_KEY;

function mockFetchOnce(payload: unknown, ok = true, status = 200) {
  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify(payload), { status, ok: status < 400 })
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  process.env.DEEPSEEK_API_KEY = "sk-test-key";
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalKey === undefined) delete process.env.DEEPSEEK_API_KEY;
  else process.env.DEEPSEEK_API_KEY = originalKey;
});

describe("callDeepSeek（非流式）", () => {
  it("返回首个 choice 的 message 内容", async () => {
    mockFetchOnce({ choices: [{ message: { content: "回答内容" } }] });
    const text = await callDeepSeek([{ role: "user", content: "hi" }]);
    expect(text).toBe("回答内容");
  });

  it("未配置 API Key（占位值）时抛错且不发起请求", async () => {
    process.env.DEEPSEEK_API_KEY = "sk-your-deepseek-api-key-here";
    const fetchMock = mockFetchOnce({});
    await expect(callDeepSeek([{ role: "user", content: "hi" }])).rejects.toThrow(
      "DEEPSEEK_API_KEY 未配置"
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("上游非 2xx 抛出状态码错误（不透传响应体）", async () => {
    mockFetchOnce({ detail: "internal" }, false, 502);
    await expect(callDeepSeek([{ role: "user", content: "hi" }])).rejects.toThrow(
      "DeepSeek API 错误: 502"
    );
  });
});

describe("callDeepSeekStream（流式）", () => {
  it("返回上游响应体流", async () => {
    const body = new ReadableStream();
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const stream = await callDeepSeekStream([{ role: "user", content: "hi" }]);
    expect(stream).toBe(body);
  });

  it("上游失败时抛错", async () => {
    mockFetchOnce({}, false, 500);
    await expect(callDeepSeekStream([{ role: "user", content: "hi" }])).rejects.toThrow();
  });
});

describe("sseFormat", () => {
  it("输出 SSE data: 前缀 + 双换行", () => {
    expect(sseFormat({ event: "done" })).toBe('data: {"event":"done"}\n\n');
  });
});
