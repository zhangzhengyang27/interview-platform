import { NextRequest } from "next/server";
import WebSocket from "ws";
import { buildAsrHeaders, VOLC_ASR_WS_URL } from "@/lib/volcengine-voice";
import { requireAuth, getCurrentUser } from "@/lib/session";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 豆包流式语音识别代理接口
 *
 * 前端录音完成后，将 WAV 音频（base64）POST 到此接口，
 * 服务端直连豆包 ASR WebSocket（bigmodel_nostream 单向流式），
 * 返回识别出的完整文本。API Key 仅存服务端，不下发前端。
 */
// 音频大小上限：10MB base64（约对应 3 分钟 16kHz WAV）
const MAX_AUDIO_BASE64_LENGTH = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  // ASR 消耗付费语音时长，必须登录且按用户限流
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  const rl = rateLimit(`voice-asr:${user!.id}`, 10, 60 * 1000);
  if (!rl.success) {
    return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...rateLimitHeaders(rl) },
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const audioBase64 = typeof body.audio === "string" ? body.audio : "";

    if (!audioBase64) {
      return new Response(JSON.stringify({ error: "请提供音频数据 (audio)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (audioBase64.length > MAX_AUDIO_BASE64_LENGTH) {
      return new Response(
        JSON.stringify({ error: "音频过大，请缩短录音时长" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const requestId = crypto.randomUUID();
    const headers = buildAsrHeaders(requestId);
    const audioBytes = Buffer.from(audioBase64, "base64");

    const text = await recognize(audioBytes, headers);

    return new Response(
      JSON.stringify({ text, requestId }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ASR 识别失败:", error);
    const message = error instanceof Error ? error.message : "语音识别失败";
    return new Response(JSON.stringify({ error: "语音识别失败，请稍后重试" }), {
      status: message.includes("未配置") ? 503 : 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * 直连豆包 ASR WebSocket（bigmodel_nostream），发送音频并等待识别结果
 */
function recognize(
  audioBytes: Buffer,
  headers: Record<string, string>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(VOLC_ASR_WS_URL, { headers });

    let finalText = "";
    let finished = false;

    const done = (err?: Error) => {
      if (finished) return;
      finished = true;
      try {
        ws.close();
      } catch {
        // ignore
      }
      if (err) reject(err);
      else resolve(finalText.trim());
    };

    const timeout = setTimeout(() => {
      done(new Error("语音识别超时"));
    }, 30000);

    ws.on("open", () => {
      // 1. 发送 full client request（音频元数据）
      ws.send(buildFullClientRequest());
      // 2. 音频分片发送（每片约 200ms 的 16kHz 16bit 单声道 = 6400 字节）
      const chunkSize = 6400;
      for (let i = 0; i < audioBytes.length; i += chunkSize) {
        const chunk = audioBytes.slice(i, i + chunkSize);
        ws.send(buildAudioOnlyRequest(chunk));
      }
      // 3. 发送最后一包（负包）表示结束
      ws.send(buildFinishRequest());
    });

    ws.on("message", (data: WebSocket.RawData) => {
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
      const parsed = parseServerResponse(buf);
      if (parsed === null) return;
      // 服务端返回累积式结果（每条消息都是截至当前的完整文本），
      // 取最后一条（isFinal）的 text 即为最终识别结果。
      if (parsed.text) {
        finalText = parsed.text;
      }
      if (parsed.isFinal) {
        clearTimeout(timeout);
        done();
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      done(new Error(`语音识别连接失败: ${err.message}`));
    });

    ws.on("close", () => {
      clearTimeout(timeout);
      done();
    });
  });
}

// ─── 豆包 ASR 二进制协议 ────────────────────────────────────────────────────

// Message type
const MSG_FULL_CLIENT_REQUEST = 0b0001;
const MSG_AUDIO_ONLY_REQUEST = 0b0010;

function buildHeader(messageType: number, flags: number): Buffer {
  // Byte 0: protocol version(4bit) + header size(4bit) => 0b0001_0001 = 0x11
  // Byte 1: message type(4bit) + flags(4bit)
  // Byte 2: serialization(4bit) + compression(4bit) => JSON(0b0001) + no compression(0b0000) = 0x10
  // Byte 3: reserved
  const header = Buffer.alloc(4);
  header[0] = 0x11;
  header[1] = (messageType << 4) | flags;
  header[2] = 0x10;
  header[3] = 0x00;
  return header;
}

function buildFullClientRequest(): Buffer {
  const payload = JSON.stringify({
    user: { uid: "interview-platform-user" },
    audio: {
      format: "wav",
      rate: 16000,
      bits: 16,
      channel: 1,
      language: "zh-CN",
    },
    request: {
      model_name: "bigmodel",
      enable_itn: true,
      enable_punc: true,
      enable_ddc: true,
      show_utterances: true,
    },
  });
  const payloadBuf = Buffer.from(payload, "utf8");
  const header = buildHeader(MSG_FULL_CLIENT_REQUEST, 0b0000);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(payloadBuf.length, 0);
  return Buffer.concat([header, size, payloadBuf]);
}

function buildAudioOnlyRequest(pcm: Uint8Array): Buffer {
  const header = buildHeader(MSG_AUDIO_ONLY_REQUEST, 0b0000);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(pcm.length, 0);
  return Buffer.concat([header, size, Buffer.from(pcm)]);
}

function buildFinishRequest(): Buffer {
  // 最后一包：audio only request + flags=0b0010（负包）
  const header = buildHeader(MSG_AUDIO_ONLY_REQUEST, 0b0010);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(0, 0);
  return Buffer.concat([header, size]);
}

function parseServerResponse(
  buf: Buffer
): { text: string; isFinal: boolean } | null {
  try {
    if (buf.length < 8) return null;

    // header(4) + [sequence(4) 若 flags 有 seq] + size(4) + payload
    const messageType = (buf[1] >> 4) & 0x0f;
    const flags = buf[1] & 0x0f;
    let offset = 4;
    const hasSeq = (flags & 0b0001) !== 0;
    if (hasSeq) offset += 4;
    // 需保证能读到 4 字节 payloadSize
    if (offset + 4 > buf.length) return null;
    const payloadSize = buf.readUInt32BE(offset);
    offset += 4;
    // 校验 payloadSize 越界
    if (offset + payloadSize > buf.length) return null;

    const payload = buf.slice(offset, offset + payloadSize).toString("utf8");

    if (messageType === 0b1001 || messageType === 0b1111) {
      const parsed = JSON.parse(payload);
      return extractText(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

function extractText(parsed: unknown): { text: string; isFinal: boolean } | null {
  const obj = parsed as {
    result?: {
      text?: string;
      utterances?: Array<{ text: string; definite?: boolean }>;
    };
    code?: number;
    message?: string;
  };

  if (obj.code && obj.code !== 0) {
    return { text: "", isFinal: true };
  }

  if (!obj.result) return null;

  const text = obj.result.text ?? "";
  const utterances = obj.result.utterances ?? [];
  const isFinal =
    utterances.length > 0 && utterances.every((u) => u.definite !== false);

  return { text, isFinal };
}
