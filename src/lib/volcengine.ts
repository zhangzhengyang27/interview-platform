/**
 * 火山引擎通用配置与签名工具
 *
 * 三类凭证体系（互不相同，注意区分）：
 * 1. 豆包语音 ASR/TTS（新版 API Key，X-Api-Key 请求头）
 * 2. 豆包端到端实时语音大模型 S2S（旧版 AppId + AccessToken）
 * 3. RTC「AI 音视频互动方案」应用（AppId + AppKey，用于 RTC Token）
 * 4. 火山引擎账号级 AK/SK（调用 RTC OpenAPI 的 V4 签名）
 */

import { createHash, createHmac } from "crypto";

// ─── 1. 豆包语音 ASR/TTS（新版 API Key）────────────────────────────────────

export interface VolcVoiceCredentials {
  apiKey: string;
  ttsResourceId: string;
  asrResourceId: string;
  voiceType: string;
}

export function getVolcVoiceCredentials(): VolcVoiceCredentials {
  const apiKey = process.env.VOLC_API_KEY;
  if (!apiKey) {
    throw new Error("火山引擎语音未配置：请在 .env.local 设置 VOLC_API_KEY");
  }
  return {
    apiKey,
    ttsResourceId: process.env.VOLC_TTS_RESOURCE_ID ?? "seed-tts-2.0",
    asrResourceId: process.env.VOLC_ASR_RESOURCE_ID ?? "volc.bigasr.sauc.duration",
    voiceType: process.env.VOLC_TTS_VOICE_TYPE ?? "zh_female_shuangkuaisisi_uranus_bigtts",
  };
}

export function isVoiceConfigured(): boolean {
  return Boolean(process.env.VOLC_API_KEY);
}

// ─── 2. 豆包端到端实时语音大模型 S2S（旧版 AppId + AccessToken）──────────

export interface VolcS2SCredentials {
  appId: string;
  accessToken: string;
}

export function getVolcS2SCredentials(): VolcS2SCredentials {
  const appId = process.env.VOLC_S2S_APP_ID;
  const accessToken = process.env.VOLC_S2S_ACCESS_TOKEN;
  if (!appId || !accessToken) {
    throw new Error(
      "端到端实时语音大模型未配置：请在 .env.local 设置 VOLC_S2S_APP_ID/VOLC_S2S_ACCESS_TOKEN"
    );
  }
  return { appId, accessToken };
}

// ─── 3. RTC「AI 音视频互动方案」应用（AppId + AppKey）─────────────────────

export interface VolcRtcAppCredentials {
  appId: string;
  appKey: string;
}

export function getVolcRtcAppCredentials(): VolcRtcAppCredentials {
  const appId = process.env.VOLC_RTC_APP_ID;
  const appKey = process.env.VOLC_RTC_APP_KEY;
  if (!appId || !appKey) {
    throw new Error(
      "RTC 应用未配置：请在 .env.local 设置 VOLC_RTC_APP_ID/VOLC_RTC_APP_KEY"
    );
  }
  return { appId, appKey };
}

// ─── 4. 火山引擎账号级 AK/SK（RTC OpenAPI V4 签名）────────────────────────

export interface VolcAkSkCredentials {
  accessKey: string;
  secretKey: string;
}

export function getVolcAkSkCredentials(): VolcAkSkCredentials {
  const accessKey = process.env.VOLC_ACCESS_KEY;
  const secretKey = process.env.VOLC_SECRET_KEY;
  if (!accessKey || !secretKey) {
    throw new Error(
      "火山引擎 AK/SK 未配置：请在 .env.local 设置 VOLC_ACCESS_KEY/VOLC_SECRET_KEY"
    );
  }
  return { accessKey, secretKey };
}

/**
 * 检查视频面试（SeedRealtime）是否已配置
 * 需同时具备：S2S 凭证 + RTC 应用凭证 + AK/SK
 */
export function isSeedRealtimeConfigured(): boolean {
  return Boolean(
    process.env.VOLC_S2S_APP_ID &&
      process.env.VOLC_S2S_ACCESS_TOKEN &&
      process.env.VOLC_RTC_APP_ID &&
      process.env.VOLC_RTC_APP_KEY &&
      process.env.VOLC_ACCESS_KEY &&
      process.env.VOLC_SECRET_KEY
  );
}

// ─── 通用签名工具 ──────────────────────────────────────────────────────────

export function hmacSha256(key: Buffer | string, message: string): Buffer {
  return createHmac("sha256", key).update(message).digest();
}

/**
 * 火山引擎 OpenAPI V4 签名（HMAC-SHA256）
 * 用于调用 RTC OpenAPI（如 StartVoiceChat / StopVoiceChat）
 */
export function signVolcV4(
  accessKey: string,
  secretKey: string,
  method: string,
  path: string,
  query: Record<string, string>,
  body: string,
  timestamp: string,
  host: string,
  service: string
): { authorization: string; xDate: string; xContentSha256: string } {
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
    .join("&");

  const hashedPayload = createHash("sha256").update(body).digest("hex");

  const signedHeaders = "content-type;host;x-content-sha256;x-date";
  const canonicalRequest = [
    method.toUpperCase(),
    path,
    canonicalQuery,
    `content-type:application/json\nhost:${host}\nx-content-sha256:${hashedPayload}\nx-date:${timestamp}`,
    signedHeaders,
    hashedPayload,
  ].join("\n");

  const date = timestamp.slice(0, 8);
  const credentialScope = `${date}/${service}/request`;
  const stringToSign = [
    "HMAC-SHA256",
    timestamp,
    credentialScope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const kDate = createHmac("sha256", secretKey).update(date).digest();
  const kService = createHmac("sha256", kDate).update(service).digest();
  const kSigning = createHmac("sha256", kService).update("request").digest();
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  return {
    authorization: `HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    xDate: timestamp,
    xContentSha256: hashedPayload,
  };
}
