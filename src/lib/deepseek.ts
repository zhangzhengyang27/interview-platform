/**
 * DeepSeek API 调用工具函数
 */

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekOptions {
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

/**
 * 验证 DeepSeek API Key 是否已配置
 */
export function validateDeepSeekApiKey(): { valid: true } | { valid: false; error: string } {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === "sk-your-deepseek-api-key-here" || apiKey === "fake") {
    return {
      valid: false,
      error: "DEEPSEEK_API_KEY 未配置，请在 .env.local 中设置",
    };
  }
  return { valid: true };
}

/**
 * 调用 DeepSeek API（非流式）
 */
export async function callDeepSeek(
  messages: DeepSeekMessage[],
  options: DeepSeekOptions = {}
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === "sk-your-deepseek-api-key-here" || apiKey === "fake") {
    throw new Error("DEEPSEEK_API_KEY 未配置");
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2048,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("DeepSeek API error:", response.status, errorText);
    throw new Error(`DeepSeek API 错误: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * 调用 DeepSeek API（流式）
 * 返回 ReadableStream，用于 SSE 响应
 */
export async function callDeepSeekStream(
  messages: DeepSeekMessage[],
  options: DeepSeekOptions = {}
): Promise<ReadableStream> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === "sk-your-deepseek-api-key-here" || apiKey === "fake") {
    throw new Error("DEEPSEEK_API_KEY 未配置");
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2048,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("DeepSeek API error:", response.status, errorText);
    throw new Error(`DeepSeek API 错误: ${response.status}`);
  }

  if (!response.body) {
    throw new Error('DeepSeek API 响应体为空');
  }

  return response.body;
}

/**
 * 创建 SSE 格式字符串
 */
export function sseFormat(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}
