export interface SSEEvent {
  event: string;
  [key: string]: unknown;
}

/**
 * DeepSeek / OpenAI 兼容的流式响应事件结构：
 * { choices: [{ delta: { content: "..." } }] }
 */
export interface DeepSeekStreamEvent {
  choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
}

/**
 * 解析 Server-Sent Events (SSE) 流
 * 将 fetch Response 的流式数据逐事件回调
 */
export async function parseSSEStream(
  response: Response,
  onEvent: (event: SSEEvent) => void
): Promise<void> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        if (!part.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(part.slice(6));
          onEvent(data);
        } catch {
          /* skip malformed chunks */
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
