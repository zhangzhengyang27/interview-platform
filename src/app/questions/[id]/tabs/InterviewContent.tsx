"use client";

import { memo, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { EvalResult } from "../types";

const ScoreBadge = memo(function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 7 ? "var(--success)" : score >= 4 ? "var(--warning-text)" : "var(--error)";
  const label = score >= 7 ? "优秀" : score >= 4 ? "一般" : "需加强";
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-bold"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {score}/10 {label}
    </span>
  );
});

const EvaluationPanel = memo(function EvaluationPanel({ result }: { result: EvalResult }) {
  const dims = [
    { key: "准确性", data: result.dimensions.accuracy },
    { key: "完整性", data: result.dimensions.completeness },
    { key: "表达", data: result.dimensions.clarity },
    { key: "深度", data: result.dimensions.depth },
  ];
  return (
    <div className="rounded-lg p-4 mt-3" style={{ backgroundColor: "var(--surface-low)", border: "1px solid var(--outline-variant)" }}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>AI 评估报告</span>
        <ScoreBadge score={result.overallScore} />
      </div>
      {/* Dimension bars */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {dims.map((d) => (
          <div key={d.key} className="flex items-center gap-2">
            <span className="text-xs w-10 shrink-0" style={{ color: "var(--on-surface-variant)" }}>{d.key}</span>
            <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--surface-highest)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${d.data.score * 10}%`, backgroundColor: d.data.score >= 7 ? "var(--success)" : d.data.score >= 4 ? "var(--warning-text)" : "var(--error)" }} />
            </div>
            <span className="text-xs font-mono w-5 text-right" style={{ color: "var(--on-surface-variant)" }}>{d.data.score}</span>
          </div>
        ))}
      </div>
      {/* Missed points */}
      {result.missedPoints.length > 0 && (
        <div className="mb-2">
          <span className="text-xs font-medium" style={{ color: "var(--error)" }}>遗漏要点：</span>
          <ul className="mt-1 space-y-0.5">
            {result.missedPoints.map((p, i) => (
              <li key={i} className="text-xs flex items-start gap-1" style={{ color: "var(--on-surface-variant)" }}>
                <span style={{ color: "var(--error)" }}>•</span> {p}
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Strengths */}
      {result.strengths.length > 0 && (
        <div className="mb-2">
          <span className="text-xs font-medium" style={{ color: "var(--success)" }}>亮点：</span>
          <ul className="mt-1 space-y-0.5">
            {result.strengths.map((s, i) => (
              <li key={i} className="text-xs flex items-start gap-1" style={{ color: "var(--on-surface-variant)" }}>
                <span style={{ color: "var(--success)" }}>✓</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div>
          <span className="text-xs font-medium" style={{ color: "var(--primary)" }}>改进建议：</span>
          <ul className="mt-1 space-y-0.5">
            {result.suggestions.map((s, i) => (
              <li key={i} className="text-xs flex items-start gap-1" style={{ color: "var(--on-surface-variant)" }}>
                <span style={{ color: "var(--primary)" }}>→</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.overallComment && (
        <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>{result.overallComment}</p>
      )}
    </div>
  );
});

const InterviewContent = memo(function InterviewContent({
  questionTitle,
  questionContent,
  recommendedAnswer,
  onSubmit,
  loading,
}: {
  questionTitle: string;
  questionContent: string;
  recommendedAnswer: string | null;
  onSubmit: (text: string) => void;
  loading: boolean;
}) {
  const [text, setText] = useState("");
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    onSubmit(text.trim());

    // Call AI evaluation
    setEvalLoading(true);
    try {
      const res = await fetch("/api/ai/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionTitle,
          questionContent,
          recommendedAnswer: recommendedAnswer ?? undefined,
          userAnswer: text.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvalResult(data);
      }
    } catch {
      // silently fail evaluation
    } finally {
      setEvalLoading(false);
      setText("");
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 p-4 border-b" style={{ borderColor: "var(--outline-variant)" }}>
        <p className="text-sm font-medium text-on-surface mb-1">模拟面试</p>
        <p className="text-xs text-on-surface-variant">
          假设面试官问到「{questionTitle}」，请组织语言作答
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <textarea
          className="w-full h-full min-h-[200px] bg-transparent border-none text-on-surface text-sm resize-none outline-none placeholder:text-on-surface-variant"
          placeholder="在此输入你的回答...&#10;&#10;例如：这道题我主要从三个方面来回答..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        {evalLoading && (
          <div className="flex items-center gap-2 mt-3 p-3 rounded-lg" style={{ backgroundColor: "var(--surface-low)", border: "1px solid var(--outline-variant)" }}>
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>AI 正在评估你的回答...</span>
          </div>
        )}
        {evalResult && <EvaluationPanel result={evalResult} />}
      </div>
      <div
        className="shrink-0 p-4 border-t flex items-center justify-between"
        style={{ borderColor: "var(--outline-variant)", backgroundColor: "var(--surface-container)" }}
      >
        <p className="text-[11px] text-on-surface-variant">按 Ctrl+Enter 提交回答</p>
        <Button
          variant="primary"
          size="sm"
          disabled={!text.trim() || loading}
          onClick={handleSubmit}
        >
          {loading ? "提交中..." : "提交回答"}
        </Button>
      </div>
    </div>
  );
});

export default InterviewContent;
