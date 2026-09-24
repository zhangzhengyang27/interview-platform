"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

const LEVELS = [
  { level: 1, label: "提示 1 · 点拨", hint: "只点方向，不含步骤" },
  { level: 2, label: "提示 2 · 思路框架", hint: "解题步骤，不含代码与答案" },
  { level: 3, label: "提示 3 · 详细思路", hint: "接近完整解法，含易错点" },
] as const;

/**
 * AI 渐进式提示（AlgoExpert 式）：卡住时从点拨到详细思路逐级引导，
 * 而不是直接亮出答案。提示按题缓存——别人已经生成过的级别会直接复用。
 */
export function ProgressiveHints({ questionId }: { questionId: string }) {
  const { isAuthenticated } = useAuth();
  const [cached, setCached] = useState<Map<number, string>>(new Map());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [loadingLevel, setLoadingLevel] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // 预取已有提示（别人问过的直接可用）
  useEffect(() => {
    if (!questionId) return;
    let cancelled = false;
    fetch(`/api/questions/${questionId}/hints`)
      .then(async (r) => (r.ok ? r.json() : { hints: [] }))
      .then((data: { hints?: { level: number; content: string }[] }) => {
        if (cancelled || !data.hints) return;
        setCached(new Map(data.hints.map((h) => [h.level, h.content])));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [questionId]);

  const reveal = async (level: number) => {
    const existing = cached.get(level);
    if (existing) {
      setRevealed((prev) => new Set(prev).add(level));
      return;
    }
    setLoadingLevel(level);
    setError(false);
    try {
      const res = await fetch(`/api/questions/${questionId}/hints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      if (res.ok) {
        const data = (await res.json()) as { level: number; content: string };
        setCached((prev) => new Map(prev).set(data.level, data.content));
        setRevealed((prev) => new Set(prev).add(level));
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoadingLevel(null);
    }
  };

  if (!isAuthenticated) {
    return null; // 游客不打扰：仅在登录态展示提示入口
  }

  return (
    <div
      className="rounded-lg border"
      style={{ borderColor: "var(--outline-variant)", backgroundColor: "var(--surface-container-low)" }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left"
      >
        <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.6.5 1 1.4 1 2.5h6c0-1.1.4-2 1-2.5A6 6 0 0 0 12 3z" />
        </svg>
        <span className="font-medium text-on-surface">卡住了？逐步看提示</span>
        <span className="text-xs text-on-surface-variant hidden sm:inline">
          （由浅入深，尽量先自己想）
        </span>
        <svg
          className={`w-4 h-4 ml-auto text-on-surface-variant transition-transform ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {LEVELS.map(({ level, label, hint }) => {
            const isRevealed = revealed.has(level);
            const content = cached.get(level);
            return (
              <div key={level}>
                <button
                  type="button"
                  onClick={() => !isRevealed && reveal(level)}
                  disabled={isRevealed || loadingLevel !== null}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isRevealed
                      ? "opacity-70 cursor-default"
                      : "hover:opacity-90"
                  }`}
                  style={
                    isRevealed
                      ? { backgroundColor: "var(--surface-high)", color: "var(--on-surface-variant)" }
                      : { backgroundColor: "var(--primary)", color: "var(--on-primary)" }
                  }
                  title={hint}
                >
                  {loadingLevel === level
                    ? "生成中..."
                    : isRevealed
                    ? `${label} · 已揭示`
                    : label}
                </button>
                {isRevealed && content && (
                  <div
                    className="mt-2 rounded-lg p-3 text-sm"
                    style={{ backgroundColor: "var(--surface-bright)", border: "1px solid var(--outline-variant)" }}
                  >
                    <MarkdownRenderer content={content} />
                  </div>
                )}
              </div>
            );
          })}
          {error && (
            <p className="text-xs text-error">提示生成失败，请稍后重试</p>
          )}
          <p className="text-[11px] text-on-surface-variant">
            提示按题目缓存，全网共享：别人已经看过的级别会立即显示，不重复消耗 AI。
          </p>
        </div>
      )}
    </div>
  );
}
