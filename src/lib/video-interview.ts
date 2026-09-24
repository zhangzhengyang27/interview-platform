/**
 * 视频面试会话管理（RTC + 豆包端到端实时语音大模型 SeedRealtime）
 *
 * 架构：
 * 1. 前端用 RTC Web SDK 进房（AppId + AppKey 生成 Token）
 * 2. 服务端调用 StartVoiceChat OpenAPI 让 AI 加入同一房间
 * 3. AI 通过豆包端到端实时语音大模型（S2S）与用户全双工对话
 * 4. 字幕（SubtitleConfig.SubtitleMode=1）实时返回对话记录
 */

import { createHmac } from "crypto";
import {
  getVolcAkSkCredentials,
  getVolcRtcAppCredentials,
  getVolcS2SCredentials,
  signVolcV4,
} from "./volcengine";

const RTC_API_HOST = "rtc.volcengineapi.com";
const RTC_API_SERVICE = "rtc";
const RTC_API_VERSION = "2025-06-01";

export interface StartVoiceChatParams {
  appId: string;
  roomId: string;
  taskId: string;
  userId: string; // 真人用户的 userId（AI 对话对象）
  systemPrompt: string; // AI 面试官人设
  firstQuestion: string; // 首个问题（AI 主动开口）
}

export interface StartVoiceChatResult {
  success: boolean;
  taskId: string;
  error?: string;
}

/**
 * 调用火山引擎 OpenAPI（RTC），返回 JSON
 */
async function callRtcOpenApi<T>(
  action: string,
  body: Record<string, unknown>
): Promise<T> {
  const { accessKey, secretKey } = getVolcAkSkCredentials();
  const timestamp =
    new Date().toISOString().slice(0, 19).replace(/[-:]/g, "") + "Z";
  const bodyStr = JSON.stringify(body);

  const query: Record<string, string> = {
    Action: action,
    Version: RTC_API_VERSION,
  };

  const sig = signVolcV4(
    accessKey,
    secretKey,
    "POST",
    "/",
    query,
    bodyStr,
    timestamp,
    RTC_API_HOST,
    RTC_API_SERVICE
  );

  const url = `https://${RTC_API_HOST}/?${new URLSearchParams(query).toString()}`;

  // 10 秒超时保护
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Date": sig.xDate,
        "X-Content-Sha256": sig.xContentSha256,
        Authorization: sig.authorization,
      },
      body: bodyStr,
      signal: controller.signal,
    });

    const text = await res.text();
    let data: T;
    try {
      data = JSON.parse(text) as T;
    } catch {
      throw new Error(`RTC OpenAPI 返回非 JSON: ${text.slice(0, 200)}`);
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 开启 AI 语音对话（让 AI 面试官加入 RTC 房间）
 * 使用「纯端到端」模式：豆包端到端实时语音大模型直接处理所有对话
 */
export async function startVoiceChat(
  params: StartVoiceChatParams
): Promise<StartVoiceChatResult> {
  const s2s = getVolcS2SCredentials();

  const body = {
    AppId: params.appId,
    RoomId: params.roomId,
    TaskId: params.taskId,
    AgentConfig: {
      TargetUserId: [params.userId],
    },
    Config: {
      S2SConfig: {
        Provider: "volcano",
        OutputMode: 0, // 纯端到端
        ProviderParams: {
          app: {
            appid: s2s.appId,
            token: s2s.accessToken,
          },
          dialog: {
            bot_name: "AI 面试官",
            system_role: params.systemPrompt,
            speaking_style: "请使用专业、友好、清晰的口吻。",
            extra: {
              model: "1.2.1.1", // O2.0 版本，精品音色
            },
          },
        },
      },
      SubtitleConfig: {
        // 快速字幕：返回处理后的 LLM 回复文本，整句回调，实时展示对话记录
        SubtitleMode: 1,
        // 开启客户端字幕回调（通过 RTC SDK 的二进制消息下发）
        DisableRTSSubtitle: false,
      },
    },
  };

  try {
    const result = await callRtcOpenApi<{
      ResponseMetadata?: { Error?: { Code: string; Message: string } };
      Result?: Record<string, unknown>;
    }>("StartVoiceChat", body);

    if (result.ResponseMetadata?.Error) {
      return {
        success: false,
        taskId: params.taskId,
        error: result.ResponseMetadata.Error.Message,
      };
    }
    return { success: true, taskId: params.taskId };
  } catch (error) {
    return {
      success: false,
      taskId: params.taskId,
      error: error instanceof Error ? error.message : "StartVoiceChat 调用失败",
    };
  }
}

/**
 * 结束 AI 语音对话
 */
export async function stopVoiceChat(
  appId: string,
  roomId: string,
  taskId: string
): Promise<StartVoiceChatResult> {
  const body = {
    AppId: appId,
    RoomId: roomId,
    TaskId: taskId,
  };

  try {
    const result = await callRtcOpenApi<{
      ResponseMetadata?: { Error?: { Code: string; Message: string } };
    }>("StopVoiceChat", body);

    if (result.ResponseMetadata?.Error) {
      return {
        success: false,
        taskId,
        error: result.ResponseMetadata.Error.Message,
      };
    }
    return { success: true, taskId };
  } catch (error) {
    return {
      success: false,
      taskId,
      error: error instanceof Error ? error.message : "StopVoiceChat 调用失败",
    };
  }
}

/**
 * 生成 RTC 鉴权 Token（用于前端 Web SDK 进房）
 *
 * 火山引擎 RTC Token 官方算法（严格遵循文档顺序）：
 * - Token = "001" + AppId(明文) + Base64(BinaryPayload + HMAC签名)
 * - BinaryPayload（大端序）：Nonce(UInt32) + IssuedAt(UInt32) + ExpireAt(UInt32)
 *   + RoomId(4字节长度前缀+UTF8) + UserId(4字节长度前缀+UTF8)
 *   + Privileges(TreeMap，key 升序)
 * - 签名 = HMAC-SHA256(AppKey, BinaryPayload)，AppId 不参与签名
 * - Privileges：key 0 = 发布流权限，key 4 = 订阅流权限，value = ExpireAt
 */
export function generateRtcToken(
  appId: string,
  appKey: string,
  roomId: string,
  userId: string,
  expireSeconds = 3600
): string {
  const nonce = Math.floor(Math.random() * 0xffffffff);
  const issuedAt = Math.floor(Date.now() / 1000);
  const expireAt = issuedAt + expireSeconds;

  // 1. 构造 BinaryPayload（大端序）
  const payload = buildRtcTokenPayload(nonce, issuedAt, expireAt, roomId, userId);

  // 2. HMAC-SHA256 签名（AppKey 为密钥）
  const signature = createHmac("sha256", appKey).update(payload).digest();

  // 3. 拼接最终 Token：001 + AppId + Base64(payload + signature)
  return `001${appId}${Buffer.concat([payload, signature]).toString("base64")}`;
}

/**
 * 构造 RTC Token 的二进制 Payload（大端序，字段顺序固定）
 */
function buildRtcTokenPayload(
  nonce: number,
  issuedAt: number,
  expireAt: number,
  roomId: string,
  userId: string
): Buffer {
  const roomIdBytes = Buffer.from(roomId, "utf8");
  const userIdBytes = Buffer.from(userId, "utf8");

  // 固定部分：Nonce(4) + IssuedAt(4) + ExpireAt(4) = 12 字节
  // 字符串：各 4 字节长度前缀 + 内容
  // Privileges：2 个条目，每个 4(key)+4(value) = 16 字节
  const total =
    12 +
    (4 + roomIdBytes.length) +
    (4 + userIdBytes.length) +
    16;

  const buf = Buffer.alloc(total);
  let offset = 0;

  buf.writeUInt32BE(nonce, offset);
  offset += 4;
  buf.writeUInt32BE(issuedAt, offset);
  offset += 4;
  buf.writeUInt32BE(expireAt, offset);
  offset += 4;

  // RoomId：4 字节长度前缀 + UTF-8 内容
  buf.writeUInt32BE(roomIdBytes.length, offset);
  offset += 4;
  roomIdBytes.copy(buf, offset);
  offset += roomIdBytes.length;

  // UserId：4 字节长度前缀 + UTF-8 内容
  buf.writeUInt32BE(userIdBytes.length, offset);
  offset += 4;
  userIdBytes.copy(buf, offset);
  offset += userIdBytes.length;

  // Privileges（TreeMap，key 升序）：key=0 发布流，key=4 订阅流
  buf.writeUInt32BE(0, offset);
  offset += 4;
  buf.writeUInt32BE(expireAt, offset);
  offset += 4;
  buf.writeUInt32BE(4, offset);
  offset += 4;
  buf.writeUInt32BE(expireAt, offset);

  return buf;
}

export { getVolcRtcAppCredentials, getVolcS2SCredentials };
