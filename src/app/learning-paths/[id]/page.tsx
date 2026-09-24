"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DifficultyBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface DayItem {
  id: string;
  questionId: string;
  title: string;
  difficulty: string;
  questionType: string;
  isRequired: boolean;
  sortOrder: number;
  tags: string[];
  categoryName: string | null;
}

interface DayPlan {
  dayNumber: number;
  theme: string;
  description: string;
  questionCount: number;
  items: DayItem[];
}

interface LearningPathDetail {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  durationDays: number;
  difficultyLevel: string;
  difficultyLabel: string;
  category: string;
  categoryLabel: string;
  isPreset: boolean;
  totalDays: number;
  totalQuestions: number;
  days: DayPlan[];
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: "var(--info-container)", text: "var(--info-text)" },
  intermediate: { bg: "var(--warning-container)", text: "var(--warning-text)" },
  advanced: { bg: "var(--error-container)", text: "var(--error)" },
};

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl" style={{ backgroundColor: "var(--surface-high)" }} />
        <div className="flex-1 space-y-3">
          <div className="h-7 w-1/2 rounded" style={{ backgroundColor: "var(--surface-high)" }} />
          <div className="h-4 w-3/4 rounded" style={{ backgroundColor: "var(--surface-high)" }} />
          <div className="flex gap-2">
            <div className="h-5 w-16 rounded" style={{ backgroundColor: "var(--surface-high)" }} />
            <div className="h-5 w-14 rounded" style={{ backgroundColor: "var(--surface-high)" }} />
          </div>
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg p-5 space-y-3" style={{ backgroundColor: "var(--surface-low)", border: "1px solid var(--outline-variant)" }}>
          <div className="h-5 w-40 rounded" style={{ backgroundColor: "var(--surface-high)" }} />
          <div className="h-4 w-full rounded" style={{ backgroundColor: "var(--surface-high)" }} />
          <div className="space-y-2 pt-2">
            <div className="h-10 w-full rounded" style={{ backgroundColor: "var(--surface-high)" }} />
            <div className="h-10 w-full rounded" style={{ backgroundColor: "var(--surface-high)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LearningPathDetailPage() {
  const [detail, setDetail] = useState<LearningPathDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const params = useParams();
  const pathId = (params as Record<string, string>)?.id;

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/learning-paths/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("学习路线不存在");
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setDetail(data);
      setExpandedDays(new Set(data.days?.slice(0, 3).map((d: DayPlan) => d.dayNumber) ?? []));
    } catch (err) {
      console.error("Failed to fetch learning path detail:", err);
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pathId) {
      fetchDetail(pathId);
    }
  }, [pathId, fetchDetail]);

  const handleJoin = async () => {
    if (!detail) return;
    setJoining(true);
    setJoinError(null);
    try {
      const res = await fetch(`/api/learning-paths/${pathId}/join`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setJoinSuccess(true);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "加入失败");
    } finally {
      setJoining(false);
    }
  };

  const toggleDay = (dayNumber: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNumber)) {
        next.delete(dayNumber);
      } else {
        next.add(dayNumber);
      }
      return next;
    });
  };

  return (
    <div className="p-4 md:p-margin-desktop max-w-[1440px] mx-auto w-full">
      {/* 返回链接 */}
      <Link
        href="/learning-paths"
        className="inline-flex items-center gap-1 text-sm mb-4 hover:opacity-80"
        style={{ color: "var(--on-surface-variant)" }}
      >
        <ChevronLeft className="h-4 w-4" />
        返回学习路线
      </Link>

      {loading ? (
        <SkeletonDetail />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: "var(--error-container)" }}
          >
            <svg
              className="w-10 h-10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--error)"
              strokeWidth="1.5"
            >
              <path d="M12 9v2m0 4h.01" />
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--on-surface)" }}>
            加载失败
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--on-surface-variant)" }}>
            {error}
          </p>
          <Button
            variant="primary"
            onClick={() => {
              if (pathId) fetchDetail(pathId);
            }}
          >
            重新加载
          </Button>
        </div>
      ) : detail ? (
        <>
          {/* 路线头部信息 */}
          <div
            className="rounded-2xl border p-4 sm:p-6 mb-4 sm:mb-6"
            style={{
              backgroundColor: "var(--surface-bright)",
              borderColor: "var(--outline-variant)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              {/* Icon */}
              <span
                className="text-4xl leading-none flex items-center justify-center w-16 h-16 rounded-2xl shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary-container), color-mix(in srgb, var(--primary-container) 60%, var(--surface-bright)))",
                }}
                role="img"
                aria-label={detail.title}
              >
                {detail.icon || "\u{1F4DA}"}
              </span>

              {/* 信息区 */}
              <div className="flex-1 min-w-0">
                <h1
                  className="text-2xl md:text-3xl font-semibold tracking-tight mb-2"
                  style={{ color: "var(--on-surface)" }}
                >
                  {detail.title}
                </h1>
                <p
                  className="text-sm mb-4 leading-relaxed"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  {detail.description || "暂无描述"}
                </p>

                {/* 标签组 */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* 难度 */}
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold font-mono tracking-wide"
                    style={{
                      backgroundColor:
                        DIFFICULTY_COLORS[detail.difficultyLevel]?.bg ??
                        DIFFICULTY_COLORS.intermediate.bg,
                      color:
                        DIFFICULTY_COLORS[detail.difficultyLevel]?.text ??
                        DIFFICULTY_COLORS.intermediate.text,
                    }}
                  >
                    {detail.difficultyLabel}
                  </span>

                  {/* 天数 */}
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium"
                    style={{
                      backgroundColor: "var(--surface-high)",
                      color: "var(--on-surface-variant)",
                    }}
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    共 {detail.totalDays} 天 · {detail.totalQuestions} 题
                  </span>

                  {/* 分类 */}
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
                      color: "var(--primary)",
                    }}
                  >
                    {detail.categoryLabel}
                  </span>

                  {detail.isPreset && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{
                        backgroundColor: "var(--primary-container)",
                        color: "var(--on-primary-container)",
                      }}
                    >
                      官方预设
                    </span>
                  )}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="shrink-0 sm:pt-2">
                {joinSuccess ? (
                  <div
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
                    style={{
                      backgroundColor: "var(--success-container)",
                      color: "var(--success)",
                    }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    已加入学习计划
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleJoin}
                    disabled={joining}
                  >
                    {joining ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" opacity="0.25" />
                          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                        </svg>
                        加入中...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        一键加入学习计划
                      </>
                    )}
                  </Button>
                )}
                {joinError && (
                  <p className="text-xs mt-2 text-center" style={{ color: "var(--error)" }}>
                    {joinError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 按天展示的学习计划 */}
          <div className="space-y-4">
            <h2
              className="text-lg font-semibold mb-4"
              style={{ color: "var(--on-surface)" }}
            >
              📅 每日学习计划（共 {detail.totalDays} 天）
            </h2>

            {detail.days.map((day) => {
              const isExpanded = expandedDays.has(day.dayNumber);

              return (
                <Card key={day.dayNumber} className="overflow-hidden">
                  {/* 天标题栏 - 可折叠 */}
                  <button
                    onClick={() => toggleDay(day.dayNumber)}
                    className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-surface-high"
                    style={{ borderRadius: "inherit" }}
                  >
                    {/* 天编号 */}
                    <span
                      className="flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold font-mono shrink-0"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--primary) 15%, transparent)",
                        color: "var(--primary)",
                      }}
                    >
                      D{day.dayNumber}
                    </span>

                    {/* 当天主题信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3
                          className="font-semibold truncate"
                          style={{ color: "var(--on-surface)" }}
                        >
                          {day.theme || `第 ${day.dayNumber} 天`}
                        </h3>
                        <span
                          className="shrink-0 text-[11px] font-mono px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: "var(--surface-high)",
                            color: "var(--on-surface-variant)",
                          }}
                        >
                          {day.questionCount} 题
                        </span>
                      </div>
                      {day.description && (
                        <p
                          className="text-xs mt-0.5 line-clamp-1"
                          style={{ color: "var(--on-surface-variant)" }}
                        >
                          {day.description}
                        </p>
                      )}
                    </div>

                    {/* 展开/收起图标 */}
                    <svg
                      className={cn(
                        "w-5 h-5 shrink-0 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--on-surface-variant)"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {/* 题目列表（可折叠） */}
                  {isExpanded && (
                    <div
                      className="border-t px-5 pb-5 space-y-2"
                      style={{ borderColor: "var(--outline-variant)" }}
                    >
                      {day.items.map((item) => (
                        <Link
                          key={item.id}
                          href={`/questions/${item.questionId}`}
                          className="flex items-center gap-3 p-3 rounded-lg transition-all group"
                          style={{
                            backgroundColor: "transparent",
                            border: "none",
                            textDecoration: "none",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "var(--surface-high)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                        >
                          {/* 排序号 */}
                          <span
                            className="w-6 h-6 flex items-center justify-center rounded text-[11px] font-mono font-medium shrink-0"
                            style={{
                              backgroundColor: "var(--surface-highest)",
                              color: "var(--on-surface-variant)",
                            }}
                          >
                            {item.sortOrder + 1}
                          </span>

                          {/* 必做标记 */}
                          {!item.isRequired && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
                              style={{
                                backgroundColor: "var(--surface-high)",
                                color: "var(--on-surface-variant)",
                              }}
                            >
                              选做
                            </span>
                          )}

                          {/* 题目标题 */}
                          <span
                            className="flex-1 text-sm truncate group-hover:text-primary transition-colors"
                            style={{ color: "var(--on-surface)" }}
                          >
                            {item.title}
                          </span>

                          {/* 难度 Badge */}
                          <DifficultyBadge difficulty={item.difficulty as "easy" | "medium" | "hard"} />

                          {/* 类型标签（移动端隐藏，给标题留空间） */}
                          <span
                            className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0"
                            style={{
                              backgroundColor:
                                item.questionType === "code"
                                  ? "var(--info-container)"
                                  : "var(--warning-container)",
                              color:
                                item.questionType === "code"
                                  ? "var(--info-text)"
                                  : "var(--warning-text)",
                            }}
                          >
                            {item.questionType === "code" ? "代码题" : "问答题"}
                          </span>

                          {/* 跳转箭头 */}
                          <svg
                            className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: "var(--primary)" }}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
