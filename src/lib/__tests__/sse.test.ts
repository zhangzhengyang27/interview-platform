// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseSSEStream, type SSEEvent } from "../sse";

function sseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return new Response(stream);
}

describe("parseSSEStream", () => {
  it("解析多事件流并逐事件回调", async () => {
    const events: SSEEvent[] = [];
    const res = sseResponse([
      'data: {"event":"feedback","content":"你"}\n\ndata: {"event":"feedback","content":"好"}\n\n',
      'data: {"event":"done","score":8}\n\n',
    ]);
    await parseSSEStream(res, (e) => events.push(e));
    expect(events).toHaveLength(3);
    expect(events[2]).toEqual({ event: "done", score: 8 });
  });

  it("跨 chunk 断裂的事件能正确拼装", async () => {
    const events: SSEEvent[] = [];
    const res = sseResponse([
      'data: {"event":"feed',
      'back","content":"x"}\n\n',
    ]);
    await parseSSEStream(res, (e) => events.push(e));
    expect(events).toHaveLength(1);
    expect(events[0].content).toBe("x");
  });

  it("跳过 [DONE] 与非法 JSON 行", async () => {
    const events: SSEEvent[] = [];
    const res = sseResponse([
      'data: [DONE]\n\ndata: {broken}\n\ndata: {"event":"ok"}\n\n',
    ]);
    await parseSSEStream(res, (e) => events.push(e));
    expect(events).toEqual([{ event: "ok" }]);
  });

  it("忽略非 data: 前缀的注释行", async () => {
    const events: SSEEvent[] = [];
    const res = sseResponse([': keep-alive\n\ndata: {"event":"ok"}\n\n']);
    await parseSSEStream(res, (e) => events.push(e));
    expect(events).toEqual([{ event: "ok" }]);
  });
});
