"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { DifficultyBadge } from "@/components/ui/Badge";
import type { Difficulty, Mastery } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface QuestionItem {
  questionId: string;
  title: string;
  difficulty: Difficulty;
  mastery: Mastery;
  completed: boolean;
}

interface DayData {
  dayNumber: number;
  items: QuestionItem[];
}

interface StudyPlanDetail {
  id: string;
  title: string;
  description: string;
  icon: string;
  totalDays: number;
  totalQuestions: number;
  completedCount: number;
  days: DayData[];
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonBox({ className }: { className: string }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ backgroundColor: "var(--surface-high)" }}
    />
  );
}

// ─── Mastery Badge ───────────────────────────────────────────────────────────

const MASTERY_CONFIG: Record<
  Mastery,
  { label: string; bg: string; text: string; border: string }
> = {
  unsolved: {
    label: "未开始",
    bg: "var(--surface-high)",
    text: "var(--on-surface-variant)",
    border: "var(--outline-variant)",
  },
  learning: {
    label: "学习中",
    bg: "var(--warning-container)",
    text: "var(--warning-text)",
    border: "var(--warning-container)",
  },
  mastered: {
    label: "已掌握",
    bg: "var(--success-container)",
    text: "var(--success-text)",
    border: "var(--success-container)",
  },
};

function MasteryBadge({ mastery }: { mastery: Mastery }) {
  const config = MASTERY_CONFIG[mastery];
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold font-mono tracking-wide"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      {config.label}
    </span>
  );
}

// ─── Day Sidebar Item ────────────────────────────────────────────────────────

function DayItem({
  day,
  isActive,
  onClick,
}: {
  day: DayData;
  isActive: boolean;
  onClick: () => void;
}) {
  const allCompleted =
    day.items.length > 0 && day.items.every((item) => item.completed);
  const someCompleted = day.items.some((item) => item.completed);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-150 min-h-[52px]"
      style={{
        backgroundColor: isActive ? "var(--surface-high)" : "transparent",
        border: isActive
          ? "1px solid var(--outline-variant)"
          : "1px solid transparent",
      }}
    >
      {/* Day Number */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-mono font-semibold transition-colors"
        style={{
          backgroundColor: allCompleted
            ? "var(--success)"
            : someCompleted
              ? "var(--primary-container)"
              : "var(--surface-highest)",
          color: allCompleted
            ? "var(--on-primary)"
            : someCompleted
              ? "var(--on-primary-container)"
              : "var(--on-surface-variant)",
        }}
      >
        {allCompleted ? (
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          day.dayNumber
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-medium truncate"
          style={{
            color: isActive ? "var(--on-surface)" : "var(--on-surface-variant)",
          }}
        >
          Day {day.dayNumber}
        </div>
        <div
          className="text-[11px] font-mono"
          style={{ color: "var(--on-surface-variant)" }}
        >
          {day.items.filter((i) => i.completed).length}/{day.items.length}
        </div>
      </div>
    </button>
  );
}

// ─── Question Row ────────────────────────────────────────────────────────────

function QuestionRow({
  item,
  onToggle,
}: {
  item: QuestionItem;
  onToggle: (questionId: string, currentCompleted: boolean) => void;
}) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg transition-colors group min-h-[52px]"
      style={{
        border: "1px solid var(--outline-variant)",
        backgroundColor: item.completed
          ? "var(--success-container)"
          : "transparent",
      }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.questionId, item.completed)}
        className="shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer"
        style={{
          border: item.completed
            ? "2px solid var(--success)"
            : "2px solid var(--outline-variant)",
          backgroundColor: item.completed ? "var(--success)" : "transparent",
        }}
        aria-label={item.completed ? "Mark as incomplete" : "Mark as completed"}
      >
        {item.completed && (
          <svg
            className="w-3 h-3 text-on-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </button>

      {/* Question Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/questions/${item.questionId}`}
          className="text-sm font-medium hover:underline transition-colors line-clamp-1"
          style={{
            color: item.completed ? "var(--on-surface-variant)" : "var(--on-surface)",
            textDecoration: item.completed ? "line-through" : "none",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--primary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = item.completed
              ? "var(--on-surface-variant)"
              : "var(--on-surface)")
          }
        >
          {item.title}
        </Link>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 shrink-0">
        <DifficultyBadge difficulty={item.difficulty} />
        <span className="hidden sm:inline-flex"><MasteryBadge mastery={item.mastery} /></span>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function StudyPlanDetailPage() {
  const params = useParams();
  const [planId, setPlanId] = useState<string | null>(null);
  const [plan, setPlan] = useState<StudyPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  // Extract planId from params (useParams returns a Promise in Next.js App Router)
  useEffect(() => {
    if (params?.id) {
      setPlanId(typeof params.id === "string" ? params.id : params.id[0]);
    }
  }, [params]);

  const fetchPlan = useCallback(async () => {
    if (!planId) return;
    try {
      const res = await fetch(`/api/study-plans/${planId}`);
      if (!res.ok) throw new Error("Failed to fetch plan");
      const data = await res.json();
      setPlan(data);
      // Default to first incomplete day or day 1
      if (data.days && data.days.length > 0) {
        const firstIncomplete = data.days.find(
          (d: DayData) => !d.items.every((i: QuestionItem) => i.completed)
        );
        setActiveDay(firstIncomplete?.dayNumber ?? 1);
      }
    } catch (err) {
      console.error("Failed to fetch study plan:", err);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Toggle question completion with optimistic update
  async function handleToggle(questionId: string, currentCompleted: boolean) {
    if (!plan || !planId || togglingIds.has(questionId)) return;

    // Optimistic update
    setPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        completedCount: currentCompleted
          ? prev.completedCount - 1
          : prev.completedCount + 1,
        days: prev.days.map((day) => ({
          ...day,
          items: day.items.map((item) =>
            item.questionId === questionId
              ? { ...item, completed: !currentCompleted }
              : item
          ),
        })),
      };
    });

    setTogglingIds((prev) => new Set(prev).add(questionId));

    try {
      const method = currentCompleted ? "DELETE" : "POST";
      const res = await fetch(`/api/study-plans/${planId}/progress`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });

      if (!res.ok) {
        // Revert on failure
        setPlan((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            completedCount: currentCompleted
              ? prev.completedCount + 1
              : prev.completedCount - 1,
            days: prev.days.map((day) => ({
              ...day,
              items: day.items.map((item) =>
                item.questionId === questionId
                  ? { ...item, completed: currentCompleted }
                  : item
              ),
            })),
          };
        });
      }
    } catch {
      // Revert on error
      setPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          completedCount: currentCompleted
            ? prev.completedCount + 1
            : prev.completedCount - 1,
          days: prev.days.map((day) => ({
            ...day,
            items: day.items.map((item) =>
              item.questionId === questionId
                ? { ...item, completed: currentCompleted }
                : item
            ),
          })),
        };
      });
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }
  }

  // ── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-4 md:p-margin-desktop max-w-[1440px] mx-auto w-full">
        <SkeletonBox className="h-4 w-24 mb-6" />
        <div className="mb-8">
          <SkeletonBox className="h-8 w-64 mb-2" />
          <SkeletonBox className="h-4 w-96 mb-4" />
          <SkeletonBox className="h-2 w-full max-w-md rounded-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <SkeletonBox className="h-64 md:h-[400px]" />
          </div>
          <div className="lg:col-span-9">
            <SkeletonBox className="h-64 md:h-[400px]" />
          </div>
        </div>
      </div>
    );
  }

  // ── Plan Not Found ─────────────────────────────────────────────────────────

  if (!plan) {
    return (
      <div className="p-4 md:p-margin-desktop max-w-[1440px] mx-auto w-full">
        <Link
          href="/study-plans"
          className="inline-flex items-center gap-1.5 text-sm mb-6 hover:underline transition-colors"
          style={{ color: "var(--on-surface-variant)" }}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回计划列表
        </Link>
        <div className="flex flex-col items-center justify-center py-24">
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--on-surface)" }}
          >
            计划未找到
          </h2>
          <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            该学习计划可能已被删除或不存在
          </p>
        </div>
      </div>
    );
  }

  // ── Derived Data ───────────────────────────────────────────────────────────

  const progress =
    plan.totalQuestions > 0
      ? Math.round((plan.completedCount / plan.totalQuestions) * 100)
      : 0;

  const currentDay = plan.days.find((d) => d.dayNumber === activeDay);

  return (
    <div className="p-4 md:p-margin-desktop max-w-[1440px] mx-auto w-full">
      {/* ── Back Link ───────────────────────────────────────────────── */}
      <Link
        href="/study-plans"
        className="inline-flex items-center gap-1.5 text-sm mb-6 hover:underline transition-colors"
        style={{ color: "var(--on-surface-variant)" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--primary)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--on-surface-variant)")
        }
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        返回计划列表
      </Link>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-4">
          <span className="text-4xl leading-none" role="img" aria-label="plan">
            {plan.icon || "\u{1F4DA}"}
          </span>
          <div className="flex-1 min-w-0">
            <h1
              className="text-2xl md:text-3xl font-semibold mb-1"
              style={{ color: "var(--on-surface)" }}
            >
              {plan.title}
            </h1>
            <p
              className="text-sm"
              style={{ color: "var(--on-surface-variant)" }}
            >
              {plan.description || "暂无描述"}
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-sm font-medium"
              style={{ color: "var(--on-surface)" }}
            >
              总体进度
            </span>
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-mono"
                style={{ color: "var(--on-surface-variant)" }}
              >
                {plan.completedCount}/{plan.totalQuestions} 题
              </span>
              <span
                className="text-sm font-mono font-semibold"
                style={{
                  color: progress >= 100 ? "var(--success)" : "var(--primary)",
                }}
              >
                {progress}%
              </span>
            </div>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--surface-highest)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(progress, 100)}%`,
                backgroundColor:
                  progress >= 100 ? "var(--success)" : "var(--primary)",
              }}
            />
          </div>
        </Card>
      </div>

      {/* ── Main Layout: Sidebar + Content ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Day List */}
        <div className="lg:col-span-3">
          <Card className="p-3">
            <h2
              className="text-sm font-semibold px-3 py-2 mb-1"
              style={{ color: "var(--on-surface-variant)" }}
            >
              学习日程
            </h2>
            <div
              className="space-y-1 max-h-[500px] overflow-y-auto"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor:
                  "var(--surface-variant) transparent",
              }}
            >
              {plan.days.map((day) => (
                <DayItem
                  key={day.dayNumber}
                  day={day}
                  isActive={day.dayNumber === activeDay}
                  onClick={() => setActiveDay(day.dayNumber)}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Right Main: Selected Day's Questions */}
        <div className="lg:col-span-9">
          <Card className="p-4 md:p-6">
            {/* Day Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2
                  className="text-lg md:text-xl font-semibold"
                  style={{ color: "var(--on-surface)" }}
                >
                  Day {activeDay}
                </h2>
                {currentDay && (
                  <p
                    className="text-xs font-mono mt-1"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    {currentDay.items.filter((i) => i.completed).length}/
                    {currentDay.items.length} 已完成
                  </p>
                )}
              </div>

              {currentDay &&
                currentDay.items.length > 0 &&
                currentDay.items.every((i) => i.completed) && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: "var(--success-container)",
                      color: "var(--success)",
                    }}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    全部完成
                  </span>
                )}
            </div>

            {/* Questions List */}
            {currentDay && currentDay.items.length > 0 ? (
              <div className="space-y-2">
                {currentDay.items.map((item) => (
                  <QuestionRow
                    key={item.questionId}
                    item={item}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "var(--surface-high)" }}
                >
                  <svg
                    className="w-8 h-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--on-surface-variant)"
                    strokeWidth="1.5"
                  >
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                  </svg>
                </div>
                <p
                  className="text-sm"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  当天暂无题目安排
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
