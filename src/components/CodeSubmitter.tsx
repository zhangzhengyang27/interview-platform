"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";

interface SubmitResult {
  testCaseId: string;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  duration: number;
}

interface SubmitResponse {
  status: "accepted" | "wrong_answer" | "runtime_error" | "time_limit_exceeded";
  passedCount: number;
  totalCount: number;
  duration: number;
  results: SubmitResult[];
}

interface CodeSubmitterProps {
  code: string;
  language: string;
  questionId: string;
}

type SubmitStatus = "idle" | "submitting" | "success" | "error";

const STATUS_CONFIG = {
  accepted: {
    label: "Accepted",
    color: "var(--success)",
    bgColor: "color-mix(in srgb, var(--success) 12%, transparent)",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="M22 4 12 14.01l-3-3" />
      </svg>
    ),
  },
  wrong_answer: {
    label: "Wrong Answer",
    color: "var(--error)",
    bgColor: "color-mix(in srgb, var(--error) 12%, transparent)",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  runtime_error: {
    label: "Runtime Error",
    color: "var(--warning-text)",
    bgColor: "color-mix(in srgb, var(--warning) 12%, transparent)",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  time_limit_exceeded: {
    label: "Time Limit Exceeded",
    color: "var(--ai-accent)",
    bgColor: "var(--ai-accent-bg)",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
};

export function CodeSubmitter({ code, language, questionId }: CodeSubmitterProps) {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [history, setHistory] = useState<SubmitResponse[]>([]);

  // 加载历史记录
  useEffect(() => {
    const saved = localStorage.getItem(`submit-history-${questionId}`);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, [questionId]);

  const handleSubmit = useCallback(async () => {
    if (status === "submitting") return;

    setStatus("submitting");
    setError(null);
    setResult(null);
    setShowConfetti(false);

    try {
      const res = await fetch(`/api/questions/${questionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `请求失败 (${res.status})`);
      }

      const data: SubmitResponse = await res.json();
      setResult(data);

      if (data.status === "accepted") {
        setStatus("success");
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        setStatus("error");
      }

      // 保存到历史记录
      setHistory((prev) => {
        const newHistory = [data, ...prev].slice(0, 10);
        localStorage.setItem(
          `submit-history-${questionId}`,
          JSON.stringify(newHistory)
        );
        return newHistory;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
      setStatus("error");
    }
  }, [code, language, questionId, status]);

  const config = result ? STATUS_CONFIG[result.status] : null;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-b"
      style={{ border: "1px solid var(--outline-variant)", borderTop: "none" }}
    >
      {/* 工具栏 */}
      <div
        className="h-11 flex items-center justify-between px-4 shrink-0"
        style={{
          backgroundColor: "var(--surface-container)",
          borderTop: "1px solid var(--outline-variant)",
        }}
      >
        <div className="flex items-center gap-3">
          {config && (
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold"
              style={{ backgroundColor: config.bgColor, color: config.color }}
            >
              {config.icon}
              <span>{config.label}</span>
            </div>
          )}
          {result && (
            <span
              className="text-[11px] px-1.5 py-0.5 rounded font-mono font-medium"
              style={{
                backgroundColor:
                  result.status === "accepted"
                    ? "color-mix(in srgb, var(--success) 15%, transparent)"
                    : "color-mix(in srgb, var(--error) 15%, transparent)",
                color:
                  result.status === "accepted" ? "var(--success)" : "var(--error)",
              }}
            >
              {result.passedCount === result.totalCount ? (
                <>✅ {result.passedCount}/{result.totalCount}</>
              ) : (
                <>❌ {result.passedCount}/{result.totalCount}</>
              )}
            </span>
          )}
          {result && (
            <span
              className="text-[11px] px-1.5 py-0.5 rounded font-mono"
              style={{
                backgroundColor: "var(--surface-high)",
                color: "var(--on-surface-variant)",
              }}
            >
              ⏱ {result.duration}ms
            </span>
          )}
        </div>

        <Button
          variant="primary"
          size="sm"
          disabled={status === "submitting" || !code.trim()}
          onClick={handleSubmit}
          style={
            status !== "submitting"
              ? {
                  background:
                    "linear-gradient(135deg, var(--primary), #ff6b35)",
                  boxShadow:
                    "0 0 12px color-mix(in srgb, var(--primary) 25%, transparent)",
                }
              : undefined
          }
        >
          {status === "submitting" ? (
            <>
              <svg
                className="w-3.5 h-3.5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 2v4m0 12v4m-8-10H0m24 0h-4M5.636 5.636L2.929 2.93M21.071 21.07l-2.707-2.707M5.636 18.364l-2.707 2.707M21.071 2.93l-2.707 2.707" />
              </svg>
              判题中...
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              提交代码
            </>
          )}
        </Button>
      </div>

      {/* 结果区域 */}
      <div className="flex-1 overflow-auto min-h-[120px] max-h-[400px]">
        {status === "submitting" && (
          <div
            className="flex flex-col items-center justify-center gap-3 py-8"
            style={{ backgroundColor: "var(--surface-lowest)" }}
          >
            <div
              className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
              style={{
                borderColor: "var(--primary)",
                borderTopColor: "transparent",
                borderWidth: "3px",
              }}
            />
            <div className="text-sm space-y-1" style={{ color: "var(--on-surface-variant)" }}>
              <p>正在执行测试用例...</p>
              <p className="text-xs opacity-60">请稍候，可能需要几秒钟</p>
            </div>
          </div>
        )}

        {!status.includes("submitting") && error && (
          <div
            className="p-4 m-3 rounded-lg"
            style={{
              backgroundColor: "color-mix(in srgb, var(--error) 8%, transparent)",
              border: "1px solid color-mix(in srgb, var(--error) 20%, transparent)",
            }}
          >
            <pre
              className="text-sm whitespace-pre-wrap break-all font-mono leading-relaxed"
              style={{ color: "var(--error)" }}
            >
              {error}
            </pre>
          </div>
        )}

        {result && status !== "submitting" && !error && (
          <div style={{ backgroundColor: "var(--surface-lowest)" }}>
            {/* 庆祝动画 */}
            {showConfetti && (
              <div className="relative overflow-hidden py-4">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="animate-bounce text-4xl"
                    style={{ animationDuration: "0.6s" }}
                  >
                    🎉
                  </div>
                </div>
                <div
                  className="text-center py-3 rounded-lg mx-3"
                  style={{
                    backgroundColor: config?.bgColor,
                    border: `1px solid ${config?.color}30`,
                  }}
                >
                  <div
                    className="flex items-center justify-center gap-2 mb-1"
                    style={{ color: config?.color }}
                  >
                    <span className="text-2xl">{config?.icon}</span>
                    <span className="text-lg font-bold">恭喜！所有测试用例通过</span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    总耗时 {result.duration}ms · 通过 {result.totalCount}/{result.totalCount} 个用例
                  </p>
                </div>
              </div>
            )}

            {/* 测试用例列表 */}
            <div className="p-3 space-y-2">
              <div
                className="text-xs font-medium px-1 mb-2"
                style={{ color: "var(--on-surface-variant)" }}
              >
                测试用例详情 ({result.results.length})
              </div>

              {result.results.map((r, index) => (
                <details
                  key={r.testCaseId}
                  open={expandedCase === r.testCaseId}
                  onToggle={(e) =>
                    setExpandedCase(
                      (e.currentTarget as HTMLDetailsElement).open
                        ? r.testCaseId
                        : null
                    )
                  }
                  className="group rounded-lg overflow-hidden"
                  style={{
                    border: "1px solid var(--outline-variant)",
                    backgroundColor: "var(--surface-low)",
                  }}
                >
                  <summary
                    className="flex items-center justify-between px-3 py-2 cursor-pointer select-none hover:bg-surface-high/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm"
                        style={{ color: r.passed ? "var(--success)" : "var(--error)" }}
                      >
                        {r.passed ? "✅" : "❌"}
                      </span>
                      <span
                        className="text-xs font-mono"
                        style={{ color: "var(--on-surface-variant)" }}
                      >
                        用例 #{index + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[11px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: "var(--surface-highest)",
                          color: "var(--on-surface-variant)",
                        }}
                      >
                        {r.duration}ms
                      </span>
                      <svg
                        className="w-3 h-3 transition-transform group-open:rotate-90"
                        style={{ color: "var(--on-surface-variant)" }}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </summary>

                  <div
                    className="px-3 pb-3 space-y-2 border-t"
                    style={{
                      borderColor: "var(--outline-variant)",
                      backgroundColor: "var(--surface-lowest)",
                    }}
                  >
                    <div>
                      <div
                        className="text-[11px] font-medium mb-1"
                        style={{ color: "var(--on-surface-variant)" }}
                      >
                        输入
                      </div>
                      <pre
                        className="p-2 rounded text-xs font-mono whitespace-pre-wrap break-all"
                        style={{
                          backgroundColor: "var(--surface-variant)",
                          color: "var(--on-surface)",
                        }}
                      >
                        {r.input || "(空)"}
                      </pre>
                    </div>

                    <div>
                      <div
                        className="text-[11px] font-medium mb-1"
                        style={{ color: "var(--on-surface-variant)" }}
                      >
                        期望输出
                      </div>
                      <pre
                        className="p-2 rounded text-xs font-mono whitespace-pre-wrap break-all"
                        style={{
                          backgroundColor: "var(--surface-variant)",
                          color: "var(--on-surface)",
                        }}
                      >
                        {r.expected || "(空)"}
                      </pre>
                    </div>

                    <div>
                      <div
                        className={`text-[11px] font-medium mb-1`}
                        style={{
                          color: r.passed ? "var(--success)" : "var(--error)",
                        }}
                      >
                        实际输出{!r.passed && " ⚠️ 不匹配"}
                      </div>
                      <pre
                        className={`p-2 rounded text-xs font-mono whitespace-pre-wrap break-all ${
                          !r.passed ? "border border-error/30" : ""
                        }`}
                        style={{
                          backgroundColor: r.passed
                            ? "var(--surface-variant)"
                            : "color-mix(in srgb, var(--error) 6%, transparent)",
                          color: r.passed
                            ? "var(--on-surface)"
                            : "var(--error)",
                        }}
                      >
                        {r.actual || "(空)"}
                      </pre>
                    </div>
                  </div>
                </details>
              ))}
            </div>

            {/* 历史记录 */}
            {history.length > 0 && (
              <div
                className="mx-3 mt-3 mb-3 p-3 rounded-lg"
                style={{
                  border: "1px solid var(--outline-variant)",
                  backgroundColor: "var(--surface-low)",
                }}
              >
                <div
                  className="text-xs font-medium px-1 mb-2 flex items-center justify-between"
                >
                  <span style={{ color: "var(--on-surface-variant)" }}>
                    提交历史 (最近 {history.length} 次)
                  </span>
                  <button
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem(
                        `submit-history-${questionId}`
                      );
                    }}
                    className="text-[11px] hover:text-error transition-colors"
                    style={{ color: "var(--on-surface-variant)" }}
                    aria-label="清除提交历史"
                  >
                    清除
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {history.map((h, i) => {
                    const hConfig = STATUS_CONFIG[h.status];
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between px-2 py-1.5 rounded text-xs"
                        style={{
                          backgroundColor: "var(--surface-lowest)",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span style={{ color: hConfig.color }}>
                            {h.passedCount === h.totalCount ? "✅" : "❌"}
                          </span>
                          <span
                            className="font-medium"
                            style={{ color: hConfig.color }}
                          >
                            {hConfig.label}
                          </span>
                        </div>
                        <div
                          className="font-mono"
                          style={{ color: "var(--on-surface-variant)" }}
                        >
                          {h.passedCount}/{h.totalCount} · {h.duration}ms
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {status === "idle" && (
          <div
            className="flex flex-col items-center justify-center gap-2 py-6"
            style={{ backgroundColor: "var(--surface-lowest)", color: "var(--on-surface-variant)" }}
          >
            <svg
              className="w-8 h-8 opacity-40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="text-xs">点击「提交代码」进行自动判题</span>
          </div>
        )}
      </div>
    </div>
  );
}
