import { NextRequest } from "next/server";
import {
  buildTtsHeaders,
  buildTtsRequestBody,
  VOLC_TTS_HTTP_URL,
} from "@/lib/volcengine-voice";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * 豆包语音合成代理接口
 *
 * 服务端调用豆包 TTS HTTP 接口，将 base64 音频透传给前端。
 * API Key 仅存服务端，不下发前端。
 */
const MAX_TEXT_LENGTH = 2000;

export async function POST(request: NextRequest) {
  // TTS 消耗付费语音时长。保留游客朗读能力（题目页降级体验），
  // 但按 IP 限流防止匿名刷量
  const rl = rateLimit(`voice-tts:${getClientIp(request)}`, 10, 60 * 1000);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rateLimitHeaders(rl) },
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      return new Response(JSON.stringify({ error: "请提供朗读文本 (text)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `朗读文本过长，最多 ${MAX_TEXT_LENGTH} 字符` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const headers = buildTtsHeaders();
    const payload = buildTtsRequestBody({ text });

    const res = await fetch(VOLC_TTS_HTTP_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("豆包 TTS 调用失败:", res.status, errText.slice(0, 300));
      // 不向上游透传内部错误细节
      return new Response(
        JSON.stringify({ error: "语音合成失败，请稍后重试" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await res.text();
    // 流式响应可能包含多个 JSON 分片，解析出音频 data 拼接
    let audioBase64 = "";
    try {
      const parsed = JSON.parse(result);
      audioBase64 = parsed.data ?? "";
    } catch {
      // 多个 JSON 分片拼接（HTTP Chunked），逐个解析
      const chunks = result.split("\n").filter(Boolean);
      for (const chunk of chunks) {
        try {
          const parsed = JSON.parse(chunk);
          if (parsed.data) audioBase64 += parsed.data;
        } catch {
          // 忽略无法解析的分片
        }
      }
    }

    if (!audioBase64) {
      return new Response(JSON.stringify({ error: "语音合成返回空音频" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        audioBase64,
        format: payload.audio_params.format,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Failed to synthesize speech:", error);
    const message = error instanceof Error ? error.message : "语音合成失败";
    return new Response(JSON.stringify({ error: message }), {
      status: message.includes("未配置") ? 503 : 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
