"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { SpeakButton } from "@/components/SpeakButton";
import { VoiceInput } from "@/components/VoiceInput";
import { VideoInterviewView } from "@/components/VideoInterviewView";
import { parseSSEStream } from "@/lib/sse";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Direction =
  | "java"
  | "frontend"
  | "backend"
  | "system-design"
  | "python"
  | "general";
type ViewType = "select" | "chat" | "history" | "video";
type InterviewMode = "text" | "voice" | "video";

interface InterviewTurn {
  id: string;
  question: string;
  answer?: string | null;
  feedback?: string | null;
  score?: number | null;
  createdAt: string;
}

interface Interview {
  id: string;
  direction: Direction;
  status: "in-progress" | "completed";
  turns: InterviewTurn[];
  overallScore?: number | null;
  overallFeedback?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Direction Data ─────────────────────────────────────────────────────────────

const DIRECTIONS: {
  key: Direction;
  name: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
}[] = [
  {
    key: "java",
    name: "Java",
    description: "Spring、JVM、并发编程、集合框架、微服务架构等 Java 后端核心知识",
    accent: "#f54e00",
    icon: (
      <svg
        className="w-7 h-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    key: "backend",
    name: "后端",
    description: "数据库、MySQL/Redis、索引优化、事务隔离、消息队列、服务端开发",
    accent: "#1f8a65",
    icon: (
      <svg
        className="w-7 h-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  {
    key: "frontend",
    name: "前端",
    description: "React、Vue、TypeScript、JavaScript、浏览器原理、性能优化等前端面试重点",
    accent: "#2a7ae0",
    icon: (
      <svg
        className="w-7 h-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <polyline points="7 8 4 11 7 14" />
        <polyline points="17 8 20 11 17 14" />
        <line x1="13" y1="6" x2="11" y2="16" />
      </svg>
    ),
  },
  {
    key: "system-design",
    name: "系统设计",
    description: "高并发、高可用、分布式架构设计、缓存/消息/存储与经典系统案例",
    accent: "#9333ea",
    icon: (
      <svg
        className="w-7 h-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="2" width="16" height="6" rx="1" />
        <rect x="4" y="16" width="16" height="6" rx="1" />
        <rect x="8" y="9" width="8" height="6" rx="1" />
        <line x1="12" y1="8" x2="12" y2="9" />
        <line x1="12" y1="15" x2="12" y2="16" />
      </svg>
    ),
  },
  {
    key: "python",
    name: "Python",
    description: "Python 高级特性、异步编程(asyncio)、Django/FastAPI、数据分析、机器学习",
    accent: "#c77800",
    icon: (
      <svg
        className="w-7 h-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
        <path d="M8 12v6a4 4 0 0 0 8 0v-6" />
        <line x1="8" y1="18" x2="16" y2="18" />
      </svg>
    ),
  },
  {
    key: "general",
    name: "通用",
    description: "计算机基础、操作系统、网络、数据库原理等通用技术面试",
    accent: "#3491ff",
    icon: (
      <svg
        className="w-7 h-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
];

const DIRECTION_LABELS: Record<Direction, string> = {
  java: "Java",
  frontend: "前端",
  backend: "后端",
  "system-design": "系统设计",
  python: "Python",
  general: "通用",
};

const MODES: {
  key: InterviewMode;
  name: string;
  desc: string;
  icon: React.ReactNode;
  disabled?: boolean;
}[] = [
  {
    key: "text",
    name: "文本面试",
    desc: "键盘输入回答，经典面试体验",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v12H8l-4 4V4Z" />
        <path d="M8 9h8M8 13h5" />
      </svg>
    ),
  },
  {
    key: "voice",
    name: "语音面试",
    desc: "语音输入 + AI 自然朗读",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    ),
  },
  {
    key: "video",
    name: "视频面试",
    desc: "AI 面试官视频面对面",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="14" height="12" rx="2" />
        <path d="m22 8-6 4 6 4V8Z" />
      </svg>
    ),
    disabled: false,
  },
];

// ─── Score Helpers ──────────────────────────────────────────────────────────────

function getScoreColor(score: number): { bg: string; text: string; border: string } {
  if (score >= 7) return { bg: "var(--success-container)", text: "var(--success-text)", border: "var(--success-container)" };
  if (score >= 4) return { bg: "var(--warning-container)", text: "var(--warning-text)", border: "var(--warning-container)" };
  return { bg: "var(--error-container)", text: "var(--error)", border: "var(--error-container)" };
}

function getScoreLabel(score: number): string {
  if (score >= 9) return "优秀";
  if (score >= 7) return "良好";
  if (score >= 4) return "一般";
  return "需加强";
}

// ─── Skeleton Loader ────────────────────────────────────────────────────────────

function SkeletonBox({ className }: { className: string }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ backgroundColor: "var(--surface-high)" }}
    />
  );
}

function ScoreBadge({ score }: { score: number }) {
  const colors = getScoreColor(score);
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold font-mono"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {score}分
    </span>
  );
}

// ─── Direction Selection View ───────────────────────────────────────────────────

interface DirectionSelectViewProps {
  loading: boolean;
  onSelectDirection: (direction: Direction, mode: InterviewMode) => void;
  onViewHistory: () => void;
  videoEnabled: boolean;
}

function DirectionSelectView({
  loading,
  onSelectDirection,
  onViewHistory,
  videoEnabled,
}: DirectionSelectViewProps) {
  const [pendingDirection, setPendingDirection] = useState<Direction | null>(null);

  const selectedDir = DIRECTIONS.find((d) => d.key === pendingDirection) ?? null;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-semibold mb-1"
          style={{ letterSpacing: "-0.02em", color: "var(--on-surface)" }}
        >
          AI 模拟面试
        </h1>
        <p className="text-base" style={{ color: "var(--on-surface-variant)" }}>
          选择面试方向，开始你的模拟面试之旅
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-start gap-2 mb-8 text-xs font-mono">
        <span
          className="px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: "var(--primary-container)",
            color: "var(--on-primary-container)",
          }}
        >
          01 · 选择方向
        </span>
        <span style={{ color: "var(--outline)" }}>——</span>
        <span
          className="px-3 py-1.5 rounded-full"
          style={{
            backgroundColor: pendingDirection ? "var(--surface-container)" : "var(--surface-highest)",
            color: pendingDirection ? "var(--on-surface)" : "var(--on-surface-variant)",
          }}
        >
          02 · 选择模式
        </span>
      </div>

      {/* Direction Grid */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 transition-opacity`}
      >
        {DIRECTIONS.map((dir) => {
          const active = pendingDirection === dir.key;
          return (
            <button
              key={dir.key}
              onClick={() => setPendingDirection(active ? null : dir.key)}
              disabled={loading}
              data-skip-touch-min-height
              className="w-full group text-left focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: "12px" }}
            >
              <div
                className="p-5 h-full transition-all duration-200"
                style={{
                  backgroundColor: "var(--surface-container)",
                  border: active
                    ? `1.5px solid ${dir.accent}`
                    : "1px solid var(--outline-variant)",
                  borderRadius: "12px",
                  boxShadow: active
                    ? `0 0 0 3px color-mix(in srgb, ${dir.accent} 18%, transparent)`
                    : "none",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: "var(--surface-container-highest)",
                      color: dir.accent,
                    }}
                  >
                    {dir.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-base font-semibold mb-1 transition-colors"
                      style={{ color: active ? "var(--on-surface)" : "var(--on-surface)" }}
                    >
                      {dir.name}
                    </h3>
                    <p
                      className="text-xs leading-relaxed line-clamp-2"
                      style={{ color: "var(--on-surface-variant)" }}
                    >
                      {dir.description}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-6">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{
              borderColor: "var(--surface-highest)",
              borderTopColor: "var(--primary)",
            }}
          />
          <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            正在创建面试...
          </span>
        </div>
      )}

      {/* Mode Selection (inline, replaces modal) */}
      {pendingDirection && !loading && selectedDir && (
        <div
          className="mt-6 p-5 rounded-2xl animate-[fadeIn_0.2s_ease]"
          style={{
            backgroundColor: "var(--surface-container-low)",
            border: "1px solid var(--outline-variant)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-mono"
                style={{ color: "var(--on-surface-variant)" }}
              >
                已选方向
              </span>
              <span
                className="text-sm font-semibold px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: "var(--surface-container-highest)",
                  color: selectedDir.accent,
                }}
              >
                {selectedDir.name}
              </span>
            </div>
            <button
              onClick={() => setPendingDirection(null)}
              className="text-sm hover:opacity-70"
              style={{ color: "var(--on-surface-variant)" }}
            >
              重选
            </button>
          </div>

          <p className="text-xs font-mono mb-3" style={{ color: "var(--on-surface-variant)" }}>
            02 · 选择面试模式
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MODES.map((mode) => {
              const disabled = mode.disabled && !videoEnabled;
              return (
                <button
                  key={mode.key}
                  onClick={() => {
                    if (disabled) return;
                    onSelectDirection(pendingDirection, mode.key);
                  }}
                  disabled={disabled}
                  data-skip-touch-min-height
                  className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                    disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-surface-container-highest"
                  }`}
                  style={{
                    backgroundColor: "var(--surface-container)",
                    border: "1px solid var(--outline-variant)",
                  }}
                >
                  <div
                    className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{
                      backgroundColor: "var(--primary-container)",
                      color: "var(--on-primary-container)",
                    }}
                  >
                    {mode.icon}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--on-surface)" }}
                    >
                      {mode.name}
                    </span>
                    {disabled && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "var(--surface-highest)",
                          color: "var(--on-surface-variant)",
                        }}
                      >
                        未配置
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    {mode.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* History link */}
      <div className="flex justify-center mt-8">
        <button
          onClick={onViewHistory}
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full transition-all hover:opacity-90"
          style={{
            background: "var(--surface-container)",
            color: "var(--on-surface)",
            border: "1px solid var(--outline-variant)",
          }}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          查看历史面试记录
        </button>
      </div>
    </div>
  );
}

// ─── Interview Conversation View ────────────────────────────────────────────────

interface InterviewChatViewProps {
  interview: Interview;
  readOnly?: boolean;
  onAnswerSubmit: (answer: string) => void;
  onExit: () => void;
  submittingAnswer: boolean;
  streamingQuestion: string | null;
  streamingFeedback: { turnId: string; text: string } | null;
}

function InterviewChatView({
  interview,
  readOnly = false,
  onAnswerSubmit,
  onExit,
  submittingAnswer,
  streamingQuestion,
  streamingFeedback,
}: InterviewChatViewProps) {
  const [answerText, setAnswerText] = useState("");
  const [expandedFeedback, setExpandedFeedback] = useState<Set<string>>(
    new Set()
  );
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new turns appear
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [interview.turns.length, submittingAnswer]);

  // Expand feedback by default when it arrives (or during streaming)
  useEffect(() => {
    const newExpanded = new Set(expandedFeedback);
    interview.turns.forEach((turn) => {
      if (turn.feedback) newExpanded.add(turn.id);
    });
    if (streamingFeedback) newExpanded.add(streamingFeedback.turnId);
    setExpandedFeedback(newExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interview.turns, streamingFeedback]);

  const toggleFeedback = (turnId: string) => {
    setExpandedFeedback((prev) => {
      const next = new Set(prev);
      if (next.has(turnId)) {
        next.delete(turnId);
      } else {
        next.add(turnId);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    const trimmed = answerText.trim();
    if (!trimmed || submittingAnswer) return;
    onAnswerSubmit(trimmed);
    setAnswerText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const currentTurnNumber = interview.turns.length;
  const isCompleted = interview.status === "completed";
  // The current (unanswered) question is the last turn without an answer
  const pendingTurn = interview.turns.find((t) => !t.answer);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Chat Header */}
      <div
        className="shrink-0 px-4 md:px-6 py-3 flex items-center justify-between gap-4"
        style={{
          backgroundColor: "var(--surface-low)",
          borderBottom: "1px solid var(--outline-variant)",
        }}
      >
        <div className="w-full flex items-center justify-between gap-4">
          <button
            onClick={onExit}
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
            {readOnly ? "返回历史" : "退出面试"}
          </button>
          <div
            className="w-px h-5"
            style={{ backgroundColor: "var(--outline-variant)" }}
          />
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--on-surface)" }}
            >
              {DIRECTION_LABELS[interview.direction]}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-mono"
              style={{
                backgroundColor: isCompleted
                  ? "var(--success-container)"
                  : "var(--surface-highest)",
                color: isCompleted ? "var(--success-text)" : "var(--on-surface-variant)",
              }}
            >
              {isCompleted ? "已完成" : "进行中"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono"
            style={{ color: "var(--on-surface-variant)" }}
          >
            第 {currentTurnNumber} 题
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-6 pb-6"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="space-y-6">
          {interview.turns.map((turn, index) => (
            <div key={turn.id} className="space-y-3">
              {/* AI Question (left side) */}
              <div className="flex items-start gap-3">
                <div
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: "var(--primary-container)",
                    color: "var(--on-primary-container)",
                  }}
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
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4" />
                    <line x1="8" y1="16" x2="8" y2="16" />
                    <line x1="16" y1="16" x2="16" y2="16" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--primary)" }}
                    >
                      面试官
                    </span>
                    <span
                      className="text-xs font-mono"
                      style={{ color: "var(--on-surface-variant)" }}
                    >
                      问题 {index + 1}
                    </span>
                    {turn.question && <SpeakButton text={turn.question} />}
                  </div>
                  <div
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: "var(--surface-container)",
                      border: "1px solid var(--outline-variant)",
                    }}
                  >
                    {streamingQuestion && index === interview.turns.length - 1 && !turn.question ? (
                      <MarkdownRenderer content={streamingQuestion} />
                    ) : (
                      <MarkdownRenderer content={turn.question} />
                    )}
                  </div>
                </div>
              </div>

              {/* User Answer (right side) */}
              {turn.answer && (
                <div className="flex items-start gap-3 flex-row-reverse">
                  <div
                    className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: "var(--surface-highest)",
                      color: "var(--on-surface-variant)",
                    }}
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
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "var(--on-surface-variant)" }}
                      >
                        我的回答
                      </span>
                    </div>
                    <div
                      className="rounded-xl p-4"
                      style={{
                        backgroundColor: "var(--surface-low)",
                        border: "1px solid var(--outline-variant)",
                      }}
                    >
                      <MarkdownRenderer content={turn.answer} />
                    </div>

                    {/* Feedback Section (collapsible) */}
                    {(turn.feedback || (streamingFeedback?.turnId === turn.id)) && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleFeedback(turn.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                          style={{ color: "var(--on-surface-variant)" }}
                        >
                          <svg
                            className="w-3.5 h-3.5 transition-transform"
                            style={{
                              transform: expandedFeedback.has(turn.id)
                                ? "rotate(90deg)"
                                : "rotate(0deg)",
                            }}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                          {expandedFeedback.has(turn.id) ? "收起" : "展开"}评分与反馈
                          {turn.score != null && (
                            <ScoreBadge score={turn.score} />
                          )}
                        </button>
                        {expandedFeedback.has(turn.id) && (
                          <div
                            className="mt-2 rounded-xl p-4"
                            style={{
                              backgroundColor: "var(--surface-container)",
                              borderLeft: "3px solid var(--primary)",
                            }}
                          >
                            <MarkdownRenderer
                              content={
                                streamingFeedback?.turnId === turn.id
                                  ? streamingFeedback.text
                                  : turn.feedback ?? ""
                              }
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Submitting indicator (only before streaming feedback starts) */}
          {submittingAnswer && !streamingFeedback && (
            <div className="flex items-start gap-3 flex-row-reverse">
              <div
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: "var(--surface-highest)",
                  color: "var(--on-surface-variant)",
                }}
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
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{
                    backgroundColor: "var(--surface-low)",
                    border: "1px solid var(--outline-variant)",
                  }}
                >
                  <div
                    className="w-5 h-5 border-2 rounded-full animate-spin"
                    style={{
                      borderColor: "var(--surface-highest)",
                      borderTopColor: "var(--primary)",
                    }}
                  />
                  <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    AI 正在评估你的回答...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Completion Summary */}
          {isCompleted && interview.overallScore != null && (
            <div className="pt-4">
              <Card className="p-6">
                <div className="text-center mb-6">
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ color: "var(--on-surface)" }}
                  >
                    面试结束
                  </h3>
                  <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    以下是你的面试总结
                  </p>
                </div>

                {/* Overall Score */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="text-center">
                    <div
                      className="text-5xl font-bold"
                      style={{
                        color: getScoreColor(interview.overallScore).text,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {interview.overallScore}
                    </div>
                    <div
                      className="text-xs font-mono mt-1"
                      style={{ color: "var(--on-surface-variant)" }}
                    >
                      / 10 分
                    </div>
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-full text-sm font-semibold"
                    style={{
                      ...(() => {
                        const c = getScoreColor(interview.overallScore);
                        return { backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` };
                      })(),
                    }}
                  >
                    {getScoreLabel(interview.overallScore)}
                  </div>
                </div>

                {/* Per-turn scores */}
                <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
                  {interview.turns.map((turn, i) => (
                    <div
                      key={turn.id}
                      className="flex items-center gap-1 text-xs font-mono"
                      style={{ color: "var(--on-surface-variant)" }}
                    >
                      <span>Q{i + 1}</span>
                      {turn.score != null && (
                        <ScoreBadge score={turn.score} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Overall Feedback */}
                {interview.overallFeedback && (
                  <div
                    className="rounded-xl p-4 mb-6"
                    style={{
                      backgroundColor: "var(--surface-container)",
                      borderLeft: "3px solid var(--primary)",
                    }}
                  >
                    <MarkdownRenderer content={interview.overallFeedback} />
                  </div>
                )}

                {/* Action */}
                {!readOnly && (
                  <div className="flex justify-center">
                    <Button variant="primary" size="lg" onClick={onExit}>
                      开始新面试
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      {!readOnly && !isCompleted && (
        <div
          className="shrink-0 px-4 md:px-6 py-4 relative z-10"
          style={{
            backgroundColor: "var(--surface-low)",
            borderTop: "1px solid var(--outline-variant)",
          }}
        >
          <div className="w-full">
            {pendingTurn ? (
              <div className="flex gap-3">
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入你的回答... (Ctrl+Enter 提交)"
                  disabled={submittingAnswer}
                  rows={3}
                  className="flex-1 resize-none rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "var(--surface-container)",
                    border: "1px solid var(--outline-variant)",
                    color: "var(--on-surface)",
                    outlineColor: "var(--primary)",
                  }}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    variant="primary"
                    size="md"
                    disabled={!answerText.trim() || submittingAnswer || !!streamingQuestion}
                    onClick={handleSubmit}
                    className="h-full"
                  >
                    {submittingAnswer ? (
                      <div
                        className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{
                          borderColor: "var(--on-primary-container)",
                          borderTopColor: "transparent",
                        }}
                      />
                    ) : (
                      "提交"
                    )}
                  </Button>
                  <VoiceInput
                    onText={(text) =>
                      setAnswerText((prev) => (prev ? prev + text : text))
                    }
                    disabled={submittingAnswer || !!streamingQuestion}
                  />
                </div>
              </div>
            ) : (
              <div
                className="text-center text-sm py-2"
                style={{ color: "var(--on-surface-variant)" }}
              >
                等待 AI 提出下一个问题...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Interview History View ─────────────────────────────────────────────────────

interface InterviewHistoryViewProps {
  interviews: Interview[];
  loading: boolean;
  onBack: () => void;
  onSelect: (interview: Interview) => void;
  onComplete: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function InterviewHistoryView({
  interviews,
  loading,
  onBack,
  onSelect,
  onComplete,
  onDelete,
}: InterviewHistoryViewProps) {
  if (loading) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <button
            className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
            style={{ color: "var(--on-surface-variant)" }}
            onClick={onBack}
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
            返回
          </button>
        </div>
        <div className="space-y-3">
          <SkeletonBox className="h-20 w-full" />
          <SkeletonBox className="h-20 w-full" />
          <SkeletonBox className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
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
            返回
          </button>
          <div
            className="w-px h-5"
            style={{ backgroundColor: "var(--outline-variant)" }}
          />
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--on-surface)" }}
          >
            面试历史
          </h2>
        </div>
        <span
          className="text-xs font-mono"
          style={{ color: "var(--on-surface-variant)" }}
        >
          共 {interviews.length} 次
        </span>
      </div>

      {/* List */}
      {interviews.length === 0 ? (
        <Card className="p-12 text-center">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: "var(--surface-high)" }}
          >
            <svg
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--on-surface-variant)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className="text-base mb-1" style={{ color: "var(--on-surface)" }}>
            暂无面试记录
          </p>
          <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            选择方向开始你的第一次模拟面试
          </p>
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={onBack}>
              开始面试
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => {
            const isCompleted = interview.status === "completed";
            const turnCount = interview.turns.length;
            const answeredCount = interview.turns.filter(
              (t) => t.answer
            ).length;
            const avgScore =
              isCompleted && interview.turns.length > 0
                ? (
                    interview.turns.reduce(
                      (sum, t) => sum + (t.score ?? 0),
                      0
                    ) / interview.turns.length
                  ).toFixed(1)
                : null;

            return (
              <Card
                key={interview.id}
                hoverable
                className="p-4 group"
              >
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() => onSelect(interview)}
                    className="flex-1 flex items-center gap-3 min-w-0 text-left focus:outline-none"
                  >
                    <div
                      className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: "var(--surface-container)",
                        color: "var(--primary)",
                      }}
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--on-surface)" }}
                        >
                          {DIRECTION_LABELS[interview.direction] ??
                            interview.direction}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-mono"
                          style={{
                            backgroundColor: isCompleted
                              ? "var(--success-container)"
                              : "var(--surface-highest)",
                            color: isCompleted
                              ? "var(--success-text)"
                              : "var(--on-surface-variant)",
                          }}
                        >
                          {isCompleted ? "已完成" : "进行中"}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-3 text-xs"
                        style={{ color: "var(--on-surface-variant)" }}
                      >
                        <span className="font-mono">
                          {formatDate(interview.createdAt)}
                        </span>
                        <span>
                          {answeredCount}/{turnCount} 题
                        </span>
                        {avgScore && (
                          <span className="flex items-center gap-1">
                            均分
                            <span
                              style={{
                                color: getScoreColor(Number(avgScore)).text,
                              }}
                              className="font-semibold"
                            >
                              {avgScore}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isCompleted && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onComplete(interview.id);
                        }}
                        className="text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors"
                        style={{
                          backgroundColor: "var(--primary-container)",
                          color: "var(--primary)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "var(--primary-fixed-dim)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "var(--primary-container)")
                        }
                      >
                        结束
                      </button>
                    )}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (
                          confirm("确定删除这条面试记录吗？此操作不可恢复。")
                        ) {
                          await onDelete(interview.id);
                        }
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors"
                      style={{
                        backgroundColor: "var(--error-container)",
                        color: "var(--error)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--error-fixed-dim)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--error-container)")
                      }
                    >
                      删除
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Date Formatter ─────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

// ─── API → Frontend Field Mapping ──────────────────────────────────────────────

interface RawTurn {
  id: string;
  aiQuestion: string;
  userAnswer?: string | null;
  aiFeedback?: string | null;
  score?: number | null;
  turnOrder: number;
  createdAt: string;
}

interface RawInterview {
  id: string;
  direction: Direction;
  status: "in-progress" | "completed";
  overallScore?: number | null;
  summary?: string | null;
  createdAt: string;
  updatedAt: string;
  turns: RawTurn[];
}

function mapTurn(raw: RawTurn): InterviewTurn {
  return {
    id: raw.id,
    question: raw.aiQuestion,
    answer: raw.userAnswer ?? null,
    feedback: raw.aiFeedback ?? null,
    score: raw.score ?? null,
    createdAt: raw.createdAt,
  };
}

function mapInterview(raw: RawInterview): Interview {
  return {
    id: raw.id,
    direction: raw.direction,
    status: raw.status,
    turns: (raw.turns ?? []).map(mapTurn),
    overallScore: raw.overallScore ?? null,
    overallFeedback: raw.summary ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// ─── Main Page Component ────────────────────────────────────────────────────────

export default function MockInterviewPage() {
  const [currentView, setCurrentView] = useState<ViewType>("select");
  const [currentInterview, setCurrentInterview] = useState<Interview | null>(
    null
  );
  const [historyInterviews, setHistoryInterviews] = useState<Interview[]>([]);
  const [creatingInterview, setCreatingInterview] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [streamingQuestion, setStreamingQuestion] = useState<string | null>(null);
  const [streamingFeedback, setStreamingFeedback] = useState<{
    turnId: string;
    text: string;
  } | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [videoDirection, setVideoDirection] = useState<Direction>("general");
  const [videoMode, setVideoMode] = useState<"video" | "voice">("video");

  // 检查视频面试是否可用（火山引擎 SeedRealtime 是否配置）
  useEffect(() => {
    fetch("/api/video-interview/token", { method: "HEAD" })
      .then((res) => setVideoEnabled(res.ok))
      .catch(() => setVideoEnabled(false));
  }, []);

  // Fetch interview history
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/mock-interviews");
      if (res.ok) {
        const data = await res.json();
        const raws: RawInterview[] = data.interviews ?? [];
        setHistoryInterviews(raws.map(mapInterview));
      }
    } catch {
      // Silently ignore history fetch errors
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Complete an interview manually
  const handleCompleteInterview = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/mock-interview/${id}/complete`, {
          method: "PATCH",
        });
        if (res.ok) {
          await fetchHistory();
        } else {
          console.error("Failed to complete interview:", await res.text());
        }
      } catch (err) {
        console.error("Failed to complete interview:", err);
      }
    },
    [fetchHistory]
  );

  // Delete an interview
  const handleDeleteInterview = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/mock-interview/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          await fetchHistory();
        } else {
          console.error("Failed to delete interview:", await res.text());
        }
      } catch (err) {
        console.error("Failed to delete interview:", err);
      }
    },
    [fetchHistory]
  );

  // Load history on mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Create a new interview (streaming first question)
  const handleSelectDirection = async (direction: Direction, mode: InterviewMode) => {
    // 视频 / 语音面试走实时对讲视图（SeedRealtime），不创建文本面试记录；
    // 仅文本模式走文本聊天 + 语音输入/朗读增强流程。
    if (mode === "video" || mode === "voice") {
      setVideoDirection(direction);
      setVideoMode(mode);
      setCurrentView("video");
      return;
    }
    setCreatingInterview(true);
    try {
      const res = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      if (!res.ok) throw new Error("Failed to create interview");

      let interviewId = "";
      let questionText = "";
      setStreamingQuestion("");

      await parseSSEStream(res, (event) => {
        switch (event.event) {
          case "interview":
            interviewId = event.id as string;
            setCurrentInterview({
              id: interviewId,
              direction,
              status: "in-progress",
              turns: [
                {
                  id: "streaming-turn",
                  question: "",
                  answer: null,
                  feedback: null,
                  score: null,
                  createdAt: new Date().toISOString(),
                },
              ],
              overallScore: null,
              overallFeedback: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            setCurrentView("chat");
            setReadOnly(false);
            break;
          case "chunk":
            questionText += event.content as string;
            setStreamingQuestion(questionText);
            // Also update the turn in real-time for visible streaming
            setCurrentInterview((prev) => {
              if (!prev) return prev;
              const updatedTurns = [...prev.turns];
              if (updatedTurns.length > 0) {
                updatedTurns[updatedTurns.length - 1] = {
                  ...updatedTurns[updatedTurns.length - 1],
                  question: questionText,
                };
              }
              return { ...prev, turns: updatedTurns };
            });
            break;
          case "done":
            // Re-fetch the complete interview from DB
            fetch(`/api/mock-interview/${interviewId}`)
              .then((r) => r.json())
              .then((raw: RawInterview) => {
                setCurrentInterview(mapInterview(raw));
                setStreamingQuestion(null);
              });
            break;
          case "error":
            console.error("Stream error:", event.message);
            setStreamingQuestion(null);
            break;
        }
      });
    } catch (err) {
      console.error("Failed to create interview:", err);
      setStreamingQuestion(null);
    } finally {
      setCreatingInterview(false);
    }
  };

  // Submit an answer (streaming evaluation feedback)
  const handleAnswerSubmit = async (answer: string) => {
    if (!currentInterview) return;
    setSubmittingAnswer(true);
    setStreamingFeedback(null);

    // Find the pending turn ID for streaming feedback display
    const pendingTurn = currentInterview.turns.find((t) => !t.answer);

    try {
      const res = await fetch(
        `/api/mock-interview/${currentInterview.id}/turn`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answer }),
        }
      );
      if (!res.ok) throw new Error("Failed to submit answer");

      let feedbackText = "";

      await parseSSEStream(res, (event) => {
        switch (event.event) {
          case "feedback":
            feedbackText += event.content as string;
            if (pendingTurn) {
              setStreamingFeedback({ turnId: pendingTurn.id, text: feedbackText });
            }
            break;
          case "done":
            // Re-fetch the full interview for a consistent state
            fetch(`/api/mock-interview/${currentInterview.id}`)
              .then((r) => r.json())
              .then((raw: RawInterview) => {
                setCurrentInterview(mapInterview(raw));
                setStreamingFeedback(null);
                setSubmittingAnswer(false);
              });
            break;
          case "error":
            console.error("Stream error:", event.message);
            setStreamingFeedback(null);
            setSubmittingAnswer(false);
            break;
        }
      });
    } catch (err) {
      console.error("Failed to submit answer:", err);
      setStreamingFeedback(null);
      setSubmittingAnswer(false);
    }
  };

  // Navigate to history view
  const handleViewHistory = () => {
    setCurrentView("history");
    fetchHistory();
  };

  // Exit back to direction selection
  const handleExit = () => {
    setCurrentView("select");
    setCurrentInterview(null);
    setReadOnly(false);
    fetchHistory();
  };

  // View a past interview in read-only mode
  const handleSelectHistoryInterview = async (interview: Interview) => {
    // Fetch the full interview details
    try {
      const res = await fetch(`/api/mock-interview/${interview.id}`);
      if (res.ok) {
        const fullRaw: RawInterview = await res.json();
        setCurrentInterview(mapInterview(fullRaw));
      } else {
        setCurrentInterview(interview);
      }
    } catch {
      setCurrentInterview(interview);
    }
    setCurrentView("chat");
    setReadOnly(true);
  };

  return (
    <div className="p-4 md:p-margin-desktop max-w-[1440px] mx-auto w-full">
      {/* View Rendering */}
      {currentView === "select" && (
        <div className="pb-8">
          <DirectionSelectView
            loading={creatingInterview}
            onSelectDirection={handleSelectDirection}
            onViewHistory={handleViewHistory}
            videoEnabled={videoEnabled}
          />
        </div>
      )}

      {currentView === "chat" && currentInterview && (
        <InterviewChatView
          interview={currentInterview}
          readOnly={readOnly}
          onAnswerSubmit={handleAnswerSubmit}
          onExit={readOnly ? handleViewHistory : handleExit}
          submittingAnswer={submittingAnswer}
          streamingQuestion={streamingQuestion}
          streamingFeedback={streamingFeedback}
        />
      )}

      {currentView === "video" && (
        <VideoInterviewView
          direction={videoDirection}
          mode={videoMode}
          onExit={handleExit}
        />
      )}

      {currentView === "history" && (
        <div className="pb-8">
          <InterviewHistoryView
            interviews={historyInterviews}
            loading={loadingHistory}
            onBack={handleExit}
            onSelect={handleSelectHistoryInterview}
            onComplete={handleCompleteInterview}
            onDelete={handleDeleteInterview}
          />
        </div>
      )}
    </div>
  );
}
