/**
 * 豆包语音（ASR 语音识别 / TTS 语音合成）调用封装
 *
 * 新版豆包语音采用 API Key 鉴权（X-Api-Key 请求头），无需 AppId/Token：
 * - TTS：POST https://openspeech.bytedance.com/api/v3/tts/unidirectional（HTTP Chunked 流式）
 * - ASR：WSS wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_nostream（单向流式，整句返回）
 */

import { getVolcVoiceCredentials, isVoiceConfigured } from "./volcengine";

export const VOLC_TTS_HOST = "openspeech.bytedance.com";
export const VOLC_TTS_HTTP_URL = `https://${VOLC_TTS_HOST}/api/v3/tts/unidirectional`;
export const VOLC_ASR_WS_URL = `wss://${VOLC_TTS_HOST}/api/v3/sauc/bigmodel_nostream`;

export interface TtsRequest {
  text: string;
  speaker?: string;
  format?: "mp3" | "pcm" | "wav" | "ogg_opus";
  sampleRate?: number;
  speechRate?: number;
}

export interface VolcVoiceConfig {
  apiKey: string;
  ttsResourceId: string;
  asrResourceId: string;
  voiceType: string;
}

/**
 * 读取豆包语音配置
 */
export function getVolcVoiceConfig(): VolcVoiceConfig {
  return getVolcVoiceCredentials();
}

export { isVoiceConfigured };

/**
 * 生成 TTS 鉴权请求头（新版 API Key 方式）
 */
export function buildTtsHeaders() {
  const { apiKey, ttsResourceId } = getVolcVoiceCredentials();
  return {
    "X-Api-Key": apiKey,
    "X-Api-Resource-Id": ttsResourceId,
    "X-Api-Request-Id": crypto.randomUUID(),
    "Content-Type": "application/json",
    Connection: "keep-alive",
  };
}

/**
 * 生成 ASR 鉴权请求头（新版 API Key 方式）
 */
export function buildAsrHeaders(requestId: string) {
  const { apiKey, asrResourceId } = getVolcVoiceCredentials();
  return {
    "X-Api-Key": apiKey,
    "X-Api-Resource-Id": asrResourceId,
    "X-Api-Request-Id": requestId,
    "X-Api-Sequence": "-1",
  };
}

/**
 * 生成 TTS 请求体
 */
export function buildTtsRequestBody(req: TtsRequest) {
  const { voiceType } = getVolcVoiceCredentials();
  return {
    req_params: {
      text: req.text,
      speaker: req.speaker ?? voiceType,
    },
    audio_params: {
      format: req.format ?? "mp3",
      sample_rate: req.sampleRate ?? 24000,
      ...(req.speechRate !== undefined ? { speech_rate: req.speechRate } : {}),
    },
  };
}
