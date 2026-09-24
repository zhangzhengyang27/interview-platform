"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface VoiceInputProps {
  onText: (text: string) => void;
  disabled?: boolean;
}

/**
 * 语音输入组件：点击开始/停止说话，识别结果追加到回答框
 */
export function VoiceInput({ onText, disabled = false }: VoiceInputProps) {
  const {
    isSupported,
    isListening,
    status,
    error,
    finalText,
    resultSeq,
    start,
    stop,
  } = useSpeechRecognition();

  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  });

  // 最终识别文本产出后回调（用 resultSeq 去重，避免相同文本被误判为重复）
  const lastSeqRef = useRef(0);
  useEffect(() => {
    if (resultSeq > 0 && resultSeq !== lastSeqRef.current) {
      lastSeqRef.current = resultSeq;
      if (finalText) {
        onTextRef.current(finalText);
      }
    }
  }, [resultSeq, finalText]);

  const isProcessing = status === "processing";

  const handleClick = useCallback(async () => {
    if (isProcessing) return;
    if (isListening) {
      await stop();
    } else {
      await start();
    }
  }, [isProcessing, isListening, start, stop]);

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        title="当前浏览器不支持语音识别，请使用 Chrome / Edge"
        className="flex items-center justify-center w-10 h-10 rounded-lg opacity-40 cursor-not-allowed"
        style={{
          backgroundColor: "var(--surface-container)",
          color: "var(--on-surface-variant)",
        }}
      >
        <MicrophoneIcon />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        title={isProcessing ? "识别中..." : isListening ? "点击停止" : "点击开始语音输入"}
        className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
          isListening ? "ring-2" : ""
        } ${isProcessing ? "opacity-60" : ""}`}
        style={{
          backgroundColor: isListening
            ? "var(--error-container)"
            : "var(--surface-container)",
          color: isListening ? "var(--error)" : "var(--on-surface-variant)",
          ...(isListening
            ? { boxShadow: "0 0 0 3px var(--error-container)" }
            : {}),
        }}
      >
        {isProcessing ? (
          <span
            className="w-4 h-4 border-2 rounded-full animate-spin"
            style={{
              borderColor: "var(--on-surface-variant)",
              borderTopColor: "transparent",
            }}
          />
        ) : isListening ? (
          <span className="relative flex h-3 w-3">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: "var(--error)" }}
            />
            <span
              className="relative inline-flex rounded-full h-3 w-3"
              style={{ backgroundColor: "var(--error)" }}
            />
          </span>
        ) : (
          <MicrophoneIcon />
        )}
      </button>

      {/* 识别状态浮层 */}
      {status !== "idle" && (
        <div
          className="absolute bottom-full left-0 mb-2 w-64 max-w-[min(100%,16rem)] rounded-lg p-3 text-xs shadow-lg z-20"
          style={{
            backgroundColor: "var(--surface-bright)",
            border: "1px solid var(--outline-variant)",
            color: "var(--on-surface)",
          }}
        >
          {isListening ? (
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--error)" }}
              />
              <span>正在聆听，请说话...</span>
            </div>
          ) : isProcessing ? (
            <div className="flex items-center gap-2">
              <span
                className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{
                  borderColor: "var(--on-surface-variant)",
                  borderTopColor: "transparent",
                }}
              />
              <span>识别中...</span>
            </div>
          ) : status === "error" ? (
            <span role="alert" style={{ color: "var(--error)" }}>{error}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

function MicrophoneIcon() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}
