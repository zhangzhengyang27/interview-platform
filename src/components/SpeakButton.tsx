"use client";

import { useEffect, useRef, useState } from "react";

interface SpeakButtonProps {
  text: string;
}

/**
 * AI 朗读按钮：优先使用火山豆包 TTS（自然音色，HTTP 代理接口），
 * 未配置或失败时降级为浏览器原生 speechSynthesis。
 */
export function SpeakButton({ text }: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  };

  // 组件卸载时释放音频资源
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakWithNative = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const speakWithDoubao = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      const { audioBase64, format } = data;
      if (!audioBase64) return false;

      // 将 base64 音频转为 Blob 播放
      const binary = atob(audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const mimeType = format === "wav" ? "audio/wav" : "audio/mpeg";
      const blob = new Blob([bytes.buffer], { type: mimeType });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audioUrlRef.current = audioUrl;
      const releaseUrl = () => {
        URL.revokeObjectURL(audioUrl);
        audioUrlRef.current = null;
        setSpeaking(false);
      };
      audio.onended = releaseUrl;
      audio.onerror = releaseUrl;
      await audio.play();
      setSpeaking(true);
      return true;
    } catch {
      // play() 被拒绝（自动播放策略）时释放资源
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
        audioRef.current = null;
      }
      return false;
    }
  };

  const toggle = async () => {
    if (speaking) {
      stop();
      return;
    }
    if (loading) return;

    setLoading(true);
    const ok = await speakWithDoubao();
    setLoading(false);
    if (!ok) {
      speakWithNative();
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1 text-sm transition-colors disabled:opacity-50 ${
        speaking
          ? "text-primary"
          : "text-on-surface-variant hover:text-primary"
      }`}
      title={speaking ? "停止朗读" : "朗读题目"}
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        {speaking || loading ? (
          <rect x="15" y="8" width="2" height="8" rx="1" />
        ) : (
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
        )}
      </svg>
    </button>
  );
}
