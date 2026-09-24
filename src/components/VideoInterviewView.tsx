"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface VideoInterviewViewProps {
  onExit: () => void;
  direction?: string;
  mode?: "video" | "voice";
}

interface RtcSession {
  appId: string;
  roomId: string;
  userId: string;
  token: string;
  direction: string;
}

interface RtcEngine {
  joinRoom: (
    token: string,
    roomId: string,
    userInfo: { userId: string }
  ) => Promise<void>;
  leaveRoom: () => Promise<void>;
  destroy: () => void;
  startAudioCapture: () => void;
  startVideoCapture: () => void;
  setLocalVideoPlayer: (el: HTMLElement | null) => void;
  setRemoteVideoPlayer: (userId: string, el: HTMLElement | null) => void;
  on: (event: string, handler: (data: unknown) => void) => void;
  off: (event: string, handler: (data: unknown) => void) => void;
}

type CallState = "idle" | "connecting" | "connected" | "ended" | "error";

interface TranscriptItem {
  speaker: "ai" | "candidate";
  text: string;
}

// 字幕二进制消息中的单条数据
interface SubtitleDataItem {
  definite?: boolean;
  paragraph?: boolean;
  language?: string;
  sequence?: number;
  text?: string;
  userId?: string;
  roundId?: number;
}

/**
 * 解析 RTC 二进制字幕消息（magic number "subv"）
 *
 * 消息格式：subv(4字节) + length(4字节大端) + JSON
 * JSON 结构：{ data: [{ userId, text, definite, sequence, ... }] }
 *
 * userId 用于区分说话人：等于候选人 userId 的是「候选人」，否则是「AI」。
 */
function parseSubtitleMessage(
  message: ArrayBuffer,
  candidateUserId: string
): TranscriptItem[] {
  const bytes = new Uint8Array(message);
  if (bytes.length < 8) return [];

  // 用 DataView 无符号读取 magic 与 length，避免位运算符号歧义
  const view = new DataView(message);

  // 校验 magic number "subv" = 0x73756276
  if (view.getUint32(0) !== 0x73756276) return [];

  const length = view.getUint32(4);
  if (bytes.length - 8 !== length || length <= 0) return [];

  let payload: string;
  try {
    payload = new TextDecoder().decode(bytes.slice(8, 8 + length));
  } catch {
    return [];
  }

  try {
    const parsed = JSON.parse(payload) as { data?: SubtitleDataItem[] };
    const items: TranscriptItem[] = [];
    for (const item of parsed.data ?? []) {
      if (!item.text) continue;
      items.push({
        speaker: item.userId === candidateUserId ? "candidate" : "ai",
        text: item.text,
      });
    }
    return items;
  } catch {
    return [];
  }
}

// 火山引擎 RTC Web SDK：通过 npm 包导入（@volcengine/rtc）
// SDK 加载去重：避免并发调用时重复初始化

declare global {
  interface Window {
    VERTC?: {
      createEngine: (appId: string) => RtcEngine;
    };
  }
}

let sdkLoadPromise: Promise<void> | null = null;

async function loadVertcSdk(): Promise<void> {
  if (typeof window !== "undefined" && window.VERTC) return;
  if (sdkLoadPromise) return sdkLoadPromise;
  sdkLoadPromise = (async () => {
    try {
      // 动态导入 SDK（仅客户端执行，避免 SSR 问题）
      const rtcModule = await import("@volcengine/rtc");
      window.VERTC = {
        createEngine: (appId: string) =>
          (rtcModule as unknown as { createEngine: (a: string) => RtcEngine })
            .createEngine(appId) as RtcEngine,
      };
    } catch (err) {
      sdkLoadPromise = null;
      throw new Error(
        `视频通话 SDK 加载失败: ${err instanceof Error ? err.message : "未知错误"}`
      );
    }
  })();
  return sdkLoadPromise;
}

/**
 * 视频面试视图：RTC 音视频通道 + 豆包端到端实时语音大模型（SeedRealtime）
 *
 * 流程：
 * 1. 申请摄像头/麦克风权限，本地预览
 * 2. 服务端签发 RTC Token（/api/video-interview/token）
 * 3. 前端用 RTC Web SDK 进房
 * 4. 服务端调用 StartVoiceChat 让 AI 面试官加入同一房间
 * 5. AI 通过豆包端到端实时语音大模型全双工对话
 * 6. 实时字幕（SubtitleMode=1）展示对话，结束时转写落库
 */
export function VideoInterviewView({
  onExit,
  direction = "general",
  mode = "video",
}: VideoInterviewViewProps) {
  const isVoice = mode === "voice";
  const [callState, setCallState] = useState<CallState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [aiJoined, setAiJoined] = useState(false);
  const [localReady, setLocalReady] = useState(false);
  const [transcript, setTranscript] = useState<
    { speaker: "ai" | "candidate"; text: string }[]
  >([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<RtcSession | null>(null);
  const engineRef = useRef<RtcEngine | null>(null);
  const taskIdRef = useRef<string | null>(null);
  const interviewIdRef = useRef<string | null>(null);
  const transcriptRef = useRef<{ speaker: "ai" | "candidate"; text: string }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subtitleHandlerRef = useRef<((data: unknown) => void) | null>(null);

  // 计时
  useEffect(() => {
    if (callState === "connected") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [callState]);

  const cleanup = useCallback(async (): Promise<void> => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    // 解绑字幕事件
    if (engineRef.current && subtitleHandlerRef.current) {
      engineRef.current.off("roomBinaryMessageReceived", subtitleHandlerRef.current);
    }
    subtitleHandlerRef.current = null;
    // 销毁 RTC 引擎，释放房间连接（等待 leaveRoom 完成）
    if (engineRef.current) {
      const engine = engineRef.current;
      engineRef.current = null;
      try {
        await engine.leaveRoom();
      } catch {
        // 忽略离开房间异常
      } finally {
        try {
          engine.destroy();
        } catch {
          // 忽略销毁异常
        }
      }
    }
  }, []);

  const startCall = useCallback(async () => {
    setError(null);
    setCallState("connecting");
    setTranscript([]);
    setLocalReady(false);
    transcriptRef.current = [];
    if (!interviewIdRef.current) {
      interviewIdRef.current = crypto.randomUUID();
    }

    try {
      // 1. 申请音视频权限；语音模式只采集音频
      const stream = await navigator.mediaDevices.getUserMedia({
        video: !isVoice,
        audio: true,
      });
      mediaStreamRef.current = stream;
      if (!isVoice && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. 获取 RTC 会话（Token 签发）
      const res = await fetch("/api/video-interview/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "无法建立视频通话");
      }
      const session = (await res.json()) as RtcSession;
      sessionRef.current = session;

      // 3. 加载 RTC SDK 并进房
      await loadVertcSdk();
      if (!window.VERTC) {
        throw new Error("视频通话 SDK 不可用");
      }
      const engine = window.VERTC.createEngine(session.appId);
      engineRef.current = engine;

      // 本地/远端视频渲染（语音模式仅音频，不启用视频轨道）
      if (!isVoice) {
        engine.setLocalVideoPlayer(localVideoRef.current);
      }
      await engine.joinRoom(session.token, session.roomId, {
        userId: session.userId,
      });
      engine.startAudioCapture();
      if (!isVoice) {
        engine.startVideoCapture();
      }

      // 订阅实时字幕事件（AI 对话记录，SubtitleMode=1 快速字幕）
      // 事件名对应原生 SDK 的 onRoomBinaryMessageReceived；
      // 若实际接入时 Web SDK 事件名不同，以官方 SDK 类型定义为准调整此字符串。
      const candidateUserId = session.userId;
      const handleSubtitle = (data: unknown) => {
        let buffer: ArrayBuffer | null = null;
        if (data instanceof ArrayBuffer) {
          buffer = data;
        } else if (Array.isArray(data)) {
          buffer = new Uint8Array(data as number[]).buffer;
        } else if (data && typeof data === "object" && "data" in data) {
          // 部分 SDK 版本将二进制数据包裹在 { data: ArrayBuffer } 中
          const inner = (data as { data?: unknown }).data;
          if (inner instanceof ArrayBuffer) buffer = inner;
        }
        if (!buffer) return;

        const items = parseSubtitleMessage(buffer, candidateUserId);
        if (items.length > 0) {
          transcriptRef.current = [...transcriptRef.current, ...items];
          setTranscript(transcriptRef.current);
        }
      };
      subtitleHandlerRef.current = handleSubtitle;
      engine.on("roomBinaryMessageReceived", handleSubtitle);

      // 本机已入房，先进入 connected 展示本地画面
      setCallState("connected");

      // 4. 服务端让 AI 面试官加入房间
      const startRes = await fetch("/api/video-interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: session.roomId,
          userId: session.userId,
          direction: session.direction,
        }),
      });
      const startData = await startRes.json().catch(() => ({}));
      if (startData.taskId) {
        taskIdRef.current = startData.taskId;
      }
      if (startRes.ok) {
        setAiJoined(true);
      } else {
        console.warn("AI 面试官加入房间失败:", startData.error);
        // AI 未入房，但保留本地画面，UI 显示提示
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "视频通话初始化失败";
      setError(message);
      setCallState("error");
      cleanup();
    }
  // 故意省略 direction / isVoice：视频通话初始化不应每次方向或语音模式
  // 变化就重连（会中断通话），二者变化由独立逻辑处理
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanup]);

  const endCall = useCallback(async () => {
    setCallState("ended");

    // 结束 AI 对话任务
    const session = sessionRef.current;
    if (session && taskIdRef.current) {
      try {
        await fetch("/api/video-interview/start", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: session.roomId,
            taskId: taskIdRef.current,
          }),
        });
      } catch {
        // 忽略
      }
    }

    // 离开房间 + 销毁引擎（cleanup 内部处理）
    await cleanup();

    // 转写落库（用 ref 取最新转写，避免 state 闭包过期）
    if (transcriptRef.current.length > 0) {
      const turns: { question: string; answer: string }[] = [];
      let currentQuestion = "";
      for (const item of transcriptRef.current) {
        if (item.speaker === "ai") {
          currentQuestion = item.text;
        } else if (currentQuestion) {
          turns.push({ question: currentQuestion, answer: item.text });
          currentQuestion = "";
        }
      }

      try {
        await fetch("/api/video-interview/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewId: interviewIdRef.current ?? crypto.randomUUID(),
            direction,
            turns,
          }),
        });
      } catch {
        // 落库失败不阻断退出
      }
    }

    onExit();
  }, [cleanup, direction, onExit]);

  useEffect(() => {
    return () => {
      void cleanup();
    };
  }, [cleanup]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Header */}
      <div
        className="shrink-0 px-4 md:px-6 py-3 flex items-center justify-between gap-4"
        style={{
          backgroundColor: "var(--surface-low)",
          borderBottom: "1px solid var(--outline-variant)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={endCall}
            className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {isVoice ? "退出语音面试" : "退出视频面试"}
          </button>
          <div className="w-px h-5" style={{ backgroundColor: "var(--outline-variant)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>
            {isVoice ? "AI 语音面试" : "AI 视频面试"}
          </span>
        </div>
        <span className="text-xs font-mono" style={{ color: "var(--on-surface-variant)" }}>
          {formatTime(elapsed)}
        </span>
      </div>

      {/* Main area */}
      <div
        className="flex-1 relative overflow-hidden flex flex-col"
        style={{
          backgroundColor: "var(--surface-low)",
          backgroundImage: isVoice
            ? "radial-gradient(circle at 50% 30%, var(--surface-container) 0%, var(--surface-low) 60%)"
            : undefined,
        }}
      >
        {/* 视频模式：远端视频 */}
        {!isVoice && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: aiJoined ? 1 : 0 }}
          />
        )}
        {/* 视频模式：本地小窗（仅摄像头就绪后展示） */}
        {!isVoice && localReady && (
          <div
            className="absolute bottom-4 right-4 w-36 h-24 sm:w-52 sm:h-36 rounded-xl border overflow-hidden flex items-center justify-center"
            style={{
              borderColor: "var(--outline-variant)",
              backgroundColor: "var(--surface-container)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              onLoadedData={() => setLocalReady(true)}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: localReady ? 1 : 0 }}
            />
            <span
              className="absolute bottom-1.5 left-2 text-[10px] font-medium"
              style={{ color: "var(--on-surface-variant)" }}
            >
              你
            </span>
          </div>
        )}

        {/* 语音模式：微信风通话面板 */}
        {isVoice && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
            {/* 面试官头像 */}
            <div
              className="relative w-32 h-32 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "var(--surface-container)",
                border: "2px solid var(--outline-variant)",
              }}
            >
              <svg
                className="w-14 h-14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <path d="M12 19v4" />
              </svg>
              {aiJoined && (
                <span
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{ border: "2px solid var(--primary)" }}
                />
              )}
            </div>
            <div>
              <p
                className="text-lg font-semibold mb-1"
                style={{ color: "var(--on-surface)" }}
              >
                AI 面试官
              </p>
              <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                {callState === "connected"
                  ? aiJoined
                    ? "通话中 · 请清晰表达您的回答"
                    : "正在接通 AI 面试官..."
                  : "语音实时面试"}
              </p>
            </div>

            {/* 实时字幕（语音模式显示在头像下方） */}
            {transcript.length > 0 && (
              <div className="w-full max-w-xl space-y-2">
                {transcript.slice(-4).map((item, i) => (
                  <div
                    key={i}
                    className="text-sm px-4 py-2 rounded-2xl backdrop-blur-sm"
                    style={{
                      backgroundColor:
                        item.speaker === "ai"
                          ? "color-mix(in srgb, var(--primary) 80%, transparent)"
                          : "rgba(255,255,255,0.1)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.12)",
                      marginLeft: item.speaker === "ai" ? 0 : "auto",
                      marginRight: item.speaker === "ai" ? "auto" : 0,
                      maxWidth: "85%",
                    }}
                  >
                    {item.speaker === "ai" ? "AI 面试官：" : "你："}
                    {item.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI 面试官入房状态提示（视频模式） */}
        {!isVoice && callState === "connected" && !aiJoined && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-sm"
            style={{
              backgroundColor: "var(--surface-container)",
              color: "var(--on-surface)",
              border: "1px solid var(--outline-variant)",
            }}
          >
            <span
              className="w-3 h-3 border-2 rounded-full animate-spin"
              style={{
                borderColor: "var(--outline-variant)",
                borderTopColor: "var(--primary)",
              }}
            />
            AI 面试官加入中...
          </div>
        )}

        {/* Idle / connecting / error overlay（两者共用） */}
        {callState !== "connected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: "var(--surface-container)",
                border: "1px solid var(--outline-variant)",
              }}
            >
              {callState === "connecting" ? (
                <div
                  className="w-9 h-9 border-4 rounded-full animate-spin"
                  style={{
                    borderColor: "var(--outline-variant)",
                    borderTopColor: "var(--primary)",
                  }}
                />
              ) : callState === "error" ? (
                <svg
                  className="w-9 h-9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--error)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              ) : (
                <svg
                  className="w-9 h-9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="6" width="14" height="12" rx="2" />
                  <path d="m22 8-6 4 6 4V8Z" />
                </svg>
              )}
            </div>
            {callState === "idle" && (
              <>
                <div>
                  <p
                    className="text-base font-semibold mb-1"
                    style={{ color: "var(--on-surface)" }}
                  >
                    {isVoice ? "AI 语音面试" : "AI 视频面试"}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    {isVoice
                      ? "授权麦克风，与 AI 面试官实时语音对话"
                      : "开启摄像头与麦克风，与 AI 面试官实时对话"}
                  </p>
                </div>
                <button
                  onClick={startCall}
                  className="px-6 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
                >
                  {isVoice ? "开始语音面试" : "开始视频面试"}
                </button>
              </>
            )}
            {callState === "connecting" && (
              <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                正在连接 AI 面试官...
              </span>
            )}
            {callState === "error" && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm" style={{ color: "var(--error)" }}>
                  {error}
                </p>
                <button
                  onClick={startCall}
                  className="px-5 py-2 rounded-full text-sm font-medium transition-all hover:opacity-90"
                  style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
                >
                  重试
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {callState === "connected" && (
        <div
          className="shrink-0 px-4 py-5 flex items-center justify-center gap-4"
          style={{
            backgroundColor: "var(--surface-low)",
            borderTop: "1px solid var(--outline-variant)",
          }}
        >
          <button
            onClick={endCall}
            className="px-8 py-3.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--error)", color: "#fff" }}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
            </svg>
            结束面试
          </button>
        </div>
      )}
    </div>
  );
}
