"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecognitionStatus =
  | "idle"
  | "listening"
  | "processing"
  | "error"
  | "unsupported";

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  status: RecognitionStatus;
  error: string | null;
  interimText: string;
  finalText: string;
  /** 每次识别成功自增的序号，用于调用方去重（避免相同文本被误判为重复） */
  resultSeq: number;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * 豆包语音识别 Hook
 *
 * 流程：
 * 1. 申请麦克风权限，用 AudioContext 采集 16kHz 单声道 PCM
 * 2. 停止录音后，将 PCM 封装成 WAV，POST 到 /api/voice/asr
 * 3. 后端直连豆包 ASR（bigmodel_nostream），返回整句识别文本
 *
 * 说明：采用「录音完成后整段识别」模式，准确率高于逐字流式。
 */
export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [status, setStatus] = useState<RecognitionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [resultSeq, setResultSeq] = useState(0);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);

  const isSupported =
    typeof window !== "undefined" &&
    Boolean(
      typeof navigator.mediaDevices?.getUserMedia === "function" &&
        (typeof window.AudioContext !== "undefined" ||
          typeof (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext !== "undefined")
    );

  const cleanup = useCallback(() => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    audioContextRef.current?.close().catch(() => {});
    processorRef.current = null;
    sourceRef.current = null;
    audioContextRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    pcmChunksRef.current = [];
  }, []);

  // 组件卸载时清理麦克风/AudioContext 资源，避免泄漏
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const start = useCallback(async () => {
    if (!isSupported) {
      setStatus("unsupported");
      setError("当前浏览器不支持语音识别，请使用最新版 Chrome / Edge");
      return;
    }
    // 防止重复调用导致旧资源未清理
    if (status === "listening" || status === "processing") return;

    setError(null);
    setInterimText("");
    setFinalText("");
    pcmChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 16kHz 采样（Safari 使用 webkitAudioContext）
      const AudioContextClass =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        // 拷贝一份，避免缓冲区复用
        pcmChunksRef.current.push(new Float32Array(input));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      setStatus("listening");
    } catch (err) {
      const message = describeMediaError(err);
      setStatus("error");
      setError(message);
      cleanup();
    }
  }, [isSupported, status, cleanup]);

  const stop = useCallback(async () => {
    // 先拷贝已采集的 PCM 数据，再清理资源（cleanup 会清空 pcmChunksRef）
    const pcm = concatFloat32(pcmChunksRef.current);
    cleanup();
    setStatus("processing");

    try {
      if (pcm.length === 0) {
        throw new Error("未采集到音频，请重新说话");
      }

      const wavBase64 = encodeWav(pcm, 16000);
      const text = await submitForRecognition(wavBase64);
      setFinalText(text);
      setResultSeq((seq) => seq + 1);
      setInterimText("");
      setStatus("idle");
    } catch (err) {
      const message = err instanceof Error ? err.message : "语音识别失败";
      setStatus("error");
      setError(message);
    }
  }, [cleanup]);

  return {
    isSupported,
    isListening: status === "listening",
    status,
    error,
    interimText,
    finalText,
    resultSeq,
    start,
    stop,
  };
}

async function submitForRecognition(wavBase64: string): Promise<string> {
  const res = await fetch("/api/voice/asr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio: wavBase64 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "语音识别服务不可用");
  }
  const data = await res.json();
  return data.text ?? "";
}

/**
 * 将 getUserMedia 的错误转换为友好的中文提示
 */
function describeMediaError(err: unknown): string {
  if (!(err instanceof Error)) return "语音识别初始化失败";
  const name = (err as Error & { name?: string }).name;
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "麦克风权限被拒绝，请在浏览器地址栏允许访问麦克风后重试";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "未检测到麦克风设备，请连接麦克风后重试";
    case "NotReadableError":
    case "TrackStartError":
      return "麦克风被其他应用占用，请关闭占用程序后重试";
    default:
      return "语音识别初始化失败，请重试";
  }
}

function concatFloat32(chunks: Float32Array[]): Float32Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Float32Array(total);
  let offset = 0;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }
  return result;
}

/**
 * 将 Float32 PCM 编码为 16-bit WAV（base64）
 */
function encodeWav(pcm: Float32Array, sampleRate: number): string {
  const buffer = new ArrayBuffer(44 + pcm.length * 2);
  const view = new DataView(buffer);

  // WAV 头
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + pcm.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, pcm.length * 2, true);

  let offset = 44;
  for (let i = 0; i < pcm.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return arrayBufferToBase64(buffer);
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
