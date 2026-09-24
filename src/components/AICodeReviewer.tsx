"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { parseSSEStream } from "@/lib/sse";

interface AICodeReviewerProps {
  code: string;
  language: string;
  questionId?: string;
  questionTitle?: string;
}

type ReviewStatus = "idle" | "reviewing" | "done" | "error";

export function AICodeReviewer({
  code,
  language,
  questionId,
  questionTitle,
}: AICodeReviewerProps) {
  const [status, setStatus] = useState<ReviewStatus>("idle");
  const [reviewContent, setReviewContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const handleReview = useCallback(async () => {
    if (!code.trim()) return;

    setStatus("reviewing");
    setReviewContent("");
    setError(null);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch("/api/ai/review-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          questionId,
          questionTitle,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `请求失败 (${response.status})`);
      }

      // 使用 SSE 流解析
      let fullContent = "";
      await parseSSEStream(response, (event) => {
        if (event.event === "review" && typeof event.content === "string") {
          fullContent += event.content;
          setReviewContent(fullContent);
        }
      });

      setStatus("done");
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setStatus("idle");
        return;
      }
      setError(err instanceof Error ? err.message : "审查失败");
      setStatus("error");
    } finally {
      setAbortController(null);
    }
  }, [code, language, questionId, questionTitle]);

  const handleStop = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
  }, [abortController]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dimensionColors: Record<string, string> = {
    正确性: "var(--success)",
    "Time Complexity": "var(--info)",
    "Space Complexity": "var(--info)",
    代码质量: "var(--warning-text)",
    改进建议: "var(--ai-accent)",
  };

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
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            style={{ color: "var(--ai-accent)" }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--ai-accent)" }}
          >
            AI 代码审查
          </span>
          {status === "done" && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                backgroundColor: "var(--ai-accent-bg)",
                color: "var(--ai-accent)",
              }}
            >
              完成审查
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status === "reviewing" && (
            <Button variant="ghost" size="sm" onClick={handleStop}>
              <svg
                className="w-3.5 h-3.5 animate-pulse"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              中止
            </Button>
          )}

          {(status === "idle" || status === "error" || status === "done") && (
            <Button
              variant="secondary"
              size="sm"
              disabled={!code.trim()}
              onClick={handleReview}
              style={{
                background: "var(--ai-accent-gradient)",
                boxShadow: "0 0 12px var(--ai-accent-glow)",
              }}
            >
              {status === "done" ? (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 4v6h6M23 20v-6h-6" />
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                  </svg>
                  重新审查
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
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI 审查
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* 结果区域 */}
      <div
        className="flex-1 overflow-auto min-h-[120px] max-h-[500px]"
        style={{ backgroundColor: "var(--surface-lowest)" }}
      >
        {status === "reviewing" && !reviewContent && (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div
              className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
              style={{
                borderColor: "var(--ai-accent)",
                borderTopColor: "transparent",
                borderWidth: "3px",
              }}
            />
            <div
              className="text-sm space-y-1"
              style={{ color: "var(--on-surface-variant)" }}
            >
              <p>AI 正在分析你的代码...</p>
              <p className="text-xs opacity-60">请稍候，可能需要几秒钟</p>
            </div>
          </div>
        )}

        {error && (
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

        {reviewContent && (
          <div className="p-4">
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: "var(--surface-low)",
                border: "1px solid var(--outline-variant)",
              }}
            >
              <MarkdownRenderer content={reviewContent} />
            </div>

            {/* 流式加载动画指示器 */}
            {status === "reviewing" && (
              <div className="flex items-center gap-2 mt-3 px-2">
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: "var(--ai-accent)",
                    animationDelay: "0ms",
                  }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: "var(--ai-accent)",
                    animationDelay: "150ms",
                  }}
                />
                <div
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    backgroundColor: "var(--ai-accent)",
                    animationDelay: "300ms",
                  }}
                />
                <span
                  className="text-xs ml-1"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  正在生成...
                </span>
              </div>
            )}
          </div>
        )}

        {status === "idle" && !error && (
          <div
            className="flex flex-col items-center justify-center gap-2 py-6"
            style={{
              backgroundColor: "var(--surface-lowest)",
              color: "var(--on-surface-variant)",
            }}
          >
            <svg
              className="w-8 h-8 opacity-40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-xs">点击「AI 审查」获取智能代码审查报告</span>
          </div>
        )}
      </div>
    </div>
  );
}
