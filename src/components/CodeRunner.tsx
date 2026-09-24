"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface CodeRunnerProps {
  code: string;
  language: string;
}

interface RunResult {
  stdout: string;
  stderr: string;
  code: number;
  output: string;
  duration: number;
}

export function CodeRunner({ code, language }: CodeRunnerProps) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stdin, setStdin] = useState("");

  const handleRun = async () => {
    if (running) return;

    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, stdin }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `请求失败 (${res.status})`);
      }

      const data: RunResult = await res.json();
      setResult(data);
      if (data.stderr && data.code !== 0) {
        setError(data.stderr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "执行失败");
    } finally {
      setRunning(false);
    }
  };

  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      javascript: "JavaScript",
      typescript: "TypeScript",
      python: "Python 3",
      java: "Java",
      cpp: "C++",
    };
    return labels[lang] || lang;
  };

  return (
    <div
      className="flex flex-col overflow-hidden rounded-b"
      style={{ border: "1px solid var(--outline-variant)", borderTop: "none" }}
    >
      {/* 工具栏 */}
      <div
        className="h-10 flex items-center justify-between px-4 shrink-0"
        style={{
          backgroundColor: "var(--surface-container)",
          borderTop: "1px solid var(--outline-variant)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium" style={{ color: "var(--on-surface-variant)" }}>
            {getLanguageLabel(language)}
          </span>
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
          disabled={running || !code.trim()}
          onClick={handleRun}
        >
          {running ? (
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
              运行中...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              运行
            </>
          )}
        </Button>
      </div>

      {/* Stdin 输入区（可折叠） */}
      <details className="group" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
        <summary
          className="px-4 py-2 text-xs cursor-pointer select-none hover:bg-surface-high/50 transition-colors flex items-center gap-2"
          style={{ color: "var(--on-surface-variant)" }}
        >
          <svg
            className="w-3 h-3 transition-transform group-open:rotate-90"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          标准输入 (Stdin)
        </summary>
        <div className="px-4 pb-3">
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="输入程序的标准输入内容..."
            rows={3}
            className="w-full bg-transparent border rounded p-2 text-xs font-mono resize-none outline-none focus:border-primary transition-colors"
            style={{
              borderColor: "var(--outline-variant)",
              color: "var(--on-surface)",
              backgroundColor: "var(--surface-lowest)",
            }}
            disabled={running}
          />
        </div>
      </details>

      {/* 输出区域 */}
      <div
        className="flex-1 overflow-auto min-h-[80px] max-h-[300px] p-4"
        style={{ backgroundColor: "var(--surface-lowest)" }}
      >
        {running && (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--on-surface-variant)" }}>
            <div
              className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
            />
            正在执行代码...
          </div>
        )}

        {!running && error && (
          <pre
            className="text-sm whitespace-pre-wrap break-all font-mono leading-relaxed"
            style={{ color: "var(--error)" }}
          >
            {error}
          </pre>
        )}

        {!running && !error && result && (
          <pre
            className="text-sm whitespace-pre-wrap break-all font-mono leading-relaxed"
            style={{ color: "var(--on-surface)" }}
          >
            {result.output || "(无输出)"}
          </pre>
        )}

        {!running && !error && !result && (
          <div
            className="flex flex-col items-center justify-center h-full gap-2 py-4"
            style={{ color: "var(--on-surface-variant)" }}
          >
            <svg
              className="w-8 h-8 opacity-40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span className="text-xs">点击「运行」按钮执行代码</span>
          </div>
        )}
      </div>
    </div>
  );
}
