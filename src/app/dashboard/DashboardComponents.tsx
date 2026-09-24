"use client";

import React, { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import {
  DifficultyBadge,
  TagBadge,
  ErrorCountBadge,
} from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { CalendarHeatmap, getHeatmapColor } from "./CalendarHeatmap";
import { AbilityRadar } from "@/components/charts/RadarChart";
import { ProgressLineChart } from "@/components/charts/ProgressLineChart";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExtendedStats {
  dailyCount: number;
  weeklyCount: number;
  monthlyCount: number;
  categoryDistribution: { name: string; count: number }[];
  difficultyDistribution: { difficulty: string; count: number }[];
  heatmap: { date: string; count: number }[];
  overallStats: {
    totalSeen: number;
    mastered: number;
    learning: number;
    unsolved: number;
  };
}

interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  todayPracticed: boolean;
  todayCount: number;
  dailyGoal: number;
  goalMet: boolean;
}

interface DailyQuestion {
  id: string;
  title: string;
  contentPreview: string;
  difficulty: string;
  categoryName: string | null;
  tags: { tag: string }[];
}

interface StatsData {
  total: number;
  mastered: number;
  unsolved: number;
  recentHistory: {
    id: string;
    questionId: string;
    status: string;
    attemptedAt: string;
    question: {
      title: string;
      difficulty: string;
      tags: { tag: string }[];
    };
  }[];
  topErrors: {
    questionId: string;
    count: number;
    title: string;
  }[];
}

interface AbilityDataItem {
  subject: string;
  score: number;
  fullMark: number;
}

interface ProgressDataItem {
  date: string;
  count: number;
}

interface DueReviewItem {
  questionId: string;
  title: string;
  difficulty: string;
  categoryName: string | null;
  lastPracticedAt: string;
  nextReviewAt: string;
  daysOverdue: number;
  stage: number;
}

// ─── Dashboard Header ────────────────────────────────────────────────────────

export function DashboardHeader({ streakData }: { streakData?: StreakStats }) {
  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h1
          className="text-4xl sm:text-5xl font-extrabold text-on-surface mb-1"
          style={{ letterSpacing: "-0.03em" }}
        >
          控制台
        </h1>
        <p className="text-base text-on-surface-variant mt-1">
          欢迎回来，准备好今天的面试准备了吗？
        </p>
      </div>
      <div className="flex items-center gap-3">
        {streakData && (
          <>
            {streakData.currentStreak > 0 ? (
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm"
                style={{
                  background: "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, var(--tertiary)))",
                  color: "var(--on-primary)",
                }}
              >
                <span role="img" aria-label="fire">
                  &#x1F525;
                </span>{" "}
                连续打卡 {streakData.currentStreak} 天
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                style={{
                  backgroundColor: "var(--surface-high)",
                  color: "var(--on-surface-variant)",
                }}
              >
                今天还没有刷题哦
              </span>
            )}
            {streakData.longestStreak > 0 && (
              <span
                className="text-xs font-mono"
                style={{ color: "var(--on-surface-variant)" }}
              >
                最长 {streakData.longestStreak} 天
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Daily Goal Card ─────────────────────────────────────────────────────────

export function DailyGoalCard({
  todayCount,
  dailyGoal,
  weeklyCount,
  monthlyCount,
  goalMet,
}: {
  todayCount: number;
  dailyGoal: number;
  weeklyCount: number;
  monthlyCount: number;
  goalMet: boolean;
}) {
  return (
    <div className="md:col-span-4">
      <Card
        className="p-6 flex flex-col items-center gap-4 h-full"
        hoverable
        style={{
          outline: "2px solid transparent",
          outlineOffset: "-2px",
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
          backgroundImage:
            "linear-gradient(var(--surface-bright), var(--surface-bright)), linear-gradient(135deg, var(--primary), var(--tertiary))",
        }}
      >
        <div className="w-full flex justify-between items-center">
          <h2 className="text-lg font-semibold text-on-surface">今日目标</h2>
          {goalMet && (
            <span
              className="text-xs font-semibold px-2 py-1 rounded"
              style={{
                backgroundColor: "var(--success-container)",
                color: "var(--success-text)",
              }}
            >
              已达标
            </span>
          )}
        </div>
        <ProgressRing current={todayCount} total={dailyGoal} size={120} />
        <div className="flex gap-3 flex-wrap justify-center">
          <span
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-medium"
            style={{
              backgroundColor: "var(--surface-highest)",
              color: "var(--on-surface-variant)",
            }}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            本周 {weeklyCount} 题
          </span>
          <span
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-medium"
            style={{
              backgroundColor: "var(--surface-highest)",
              color: "var(--on-surface-variant)",
            }}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 2v4M16 2v4M3 10h18" />
              <rect x="3" y="4" width="18" height="18" rx="2" />
            </svg>
            本月 {monthlyCount} 题
          </span>
        </div>
      </Card>
    </div>
  );
}

// ─── Animated Number Helper ──────────────────────────────────────────────────

function AnimatedNumber({ value, className, style }: { value: number; className?: string; style?: React.CSSProperties }) {
  const [display, setDisplay] = React.useState(0);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const target = value;
    const duration = 800;
    const startTime = performance.now();
    const startVal = 0;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span ref={ref} className={className} style={style}>
      {display}
    </span>
  );
}

// ─── Stats Cards ─────────────────────────────────────────────────────────────

export function StatsCards({ extendedStats, statsData }: { extendedStats?: ExtendedStats; statsData?: StatsData }) {
  const totalSeen = extendedStats?.overallStats.totalSeen ?? statsData?.total ?? 0;
  const mastered = extendedStats?.overallStats.mastered ?? statsData?.mastered ?? 0;
  const learning = extendedStats?.overallStats.learning ?? 0;

  return (
    <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 md:flex md:flex-col md:gap-4">
      <Card className="p-3 md:p-4 flex items-center justify-between" hoverable>
        <div className="flex flex-col">
          <span className="text-sm text-on-surface-variant">总题目数</span>
          <AnimatedNumber
            value={totalSeen}
            className="text-3xl font-semibold text-on-surface mt-1"
            style={{ letterSpacing: "-0.02em" }}
          />
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 20%, transparent), color-mix(in srgb, var(--tertiary) 20%, transparent))" }}
        >
          <svg
            className="w-6 h-6"
            style={{ color: "var(--primary)" }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
      </Card>

      <Card className="p-3 md:p-4 flex items-center justify-between" hoverable>
        <div className="flex flex-col">
          <span className="text-sm text-on-surface-variant">已掌握</span>
          <AnimatedNumber
            value={mastered}
            className="text-3xl font-semibold mt-1"
            style={{
              letterSpacing: "-0.02em",
              color: "var(--primary)",
            }}
          />
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--success) 20%, transparent), color-mix(in srgb, var(--primary) 15%, transparent))" }}
        >
          <svg
            className="w-6 h-6"
            style={{ color: "var(--success)" }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4 12 14.01l-3-3" />
          </svg>
        </div>
      </Card>

      <Card className="p-3 md:p-4 flex items-center justify-between" hoverable>
        <div className="flex flex-col">
          <span className="text-sm text-on-surface-variant">待复习</span>
          <AnimatedNumber
            value={learning}
            className="text-3xl font-semibold mt-1"
            style={{
              letterSpacing: "-0.02em",
              color: "var(--error)",
            }}
          />
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--error) 20%, transparent), color-mix(in srgb, var(--warning) 15%, transparent))" }}
        >
          <svg
            className="w-6 h-6"
            style={{ color: "var(--error)" }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </div>
      </Card>
    </div>
  );
}

// ─── Daily Question Card ─────────────────────────────────────────────────────

export function DailyQuestionCard({ dailyQuestion }: { dailyQuestion?: DailyQuestion }) {
  return (
    <div className="md:col-span-4">
      <Card className="p-6 flex flex-col h-full gap-4">
        <div
          className="flex items-center gap-2 -mx-6 -mt-6 px-6 py-3 rounded-t-xl"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, transparent), color-mix(in srgb, var(--tertiary) 6%, transparent))",
          }}
        >
          <span className="text-xl" role="img" aria-label="fire">
            &#x1F525;
          </span>
          <h2 className="text-lg font-semibold text-on-surface">每日一题</h2>
        </div>

        {dailyQuestion ? (
          <>
            <Link href={`/questions/${dailyQuestion.id}`} className="group">
              <h3 className="text-base font-medium text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                {dailyQuestion.title}
              </h3>
            </Link>

            {dailyQuestion.contentPreview && (
              <p
                className="text-sm line-clamp-3"
                style={{ color: "var(--on-surface-variant)" }}
              >
                {dailyQuestion.contentPreview}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <DifficultyBadge
                difficulty={dailyQuestion.difficulty as "easy" | "medium" | "hard"}
              />
              {dailyQuestion.categoryName && (
                <TagBadge tag={dailyQuestion.categoryName} />
              )}
              {(dailyQuestion.tags ?? []).slice(0, 2).map((t) => (
                <TagBadge key={t.tag} tag={t.tag} />
              ))}
            </div>

            <div className="mt-auto pt-2">
              <Link
                href={`/questions/${dailyQuestion.id}`}
                data-skip-touch-min-height
                className="w-full block"
              >
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  style={{
                    background: "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, var(--tertiary)))",
                  }}
                >
                  开始今日练习
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-on-surface-variant">暂无每日一题</p>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Due Review Section ──────────────────────────────────────────────────────

export function DueReviewSection({
  dueReviews,
  dueCount,
}: {
  dueReviews: DueReviewItem[];
  dueCount: number;
}) {
  return (
    <div className="mb-4">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label="review">
              &#x1F4DD;
            </span>
            <h2 className="text-lg font-semibold text-on-surface">
              待复习
              {dueCount > 0 && (
                <span
                  className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: "var(--error-container)",
                    color: "var(--error)",
                  }}
                >
                  {dueCount}
                </span>
              )}
            </h2>
          </div>
          {dueCount > 6 && (
            <Link
              href="/questions?filter=review"
              className="text-sm hover:underline"
              style={{ color: "var(--primary)" }}
            >
              查看全部 →
            </Link>
          )}
        </div>

        {dueReviews.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
            {dueReviews.map((item) => (
              <Link
                key={item.questionId}
                href={`/questions/${item.questionId}`}
                className="min-w-[220px] sm:min-w-[260px] h-36 bg-surface-low border border-outline-variant rounded-lg p-4 hover:border-primary cursor-pointer transition-colors duration-200 flex flex-col justify-between flex-shrink-0 group snap-start relative overflow-hidden"
                style={{
                  borderLeft: `3px solid ${
                    item.daysOverdue > 7
                      ? "var(--error)"
                      : item.daysOverdue > 3
                        ? "var(--warning)"
                        : "var(--info)"
                  }`,
                }}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <DifficultyBadge
                      difficulty={item.difficulty as "easy" | "medium" | "hard"}
                    />
                    {item.daysOverdue > 0 ? (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded"
                        style={{
                          backgroundColor:
                            "color-mix(in srgb, var(--error) 15%, transparent)",
                          color: "var(--error)",
                        }}
                      >
                        逾期 {item.daysOverdue} 天
                      </span>
                    ) : (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: "var(--surface-highest)",
                          color: "var(--on-surface-variant)",
                        }}
                      >
                        今日复习
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-medium text-on-surface group-hover:text-primary transition-colors truncate mt-1">
                    {item.title}
                  </h3>
                  {item.categoryName && <TagBadge tag={item.categoryName} />}
                </div>
                <div className="flex items-center gap-1.5 pt-2">
                  <span
                    className="text-[10px] mr-1"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    Stage
                  </span>
                  {[1, 2, 3, 4, 5, 6].map((s) => (
                    <div
                      key={s}
                      className="w-2 h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor:
                          s <= item.stage
                            ? s === item.stage
                              ? "var(--primary)"
                              : "color-mix(in srgb, var(--primary) 40%, transparent)"
                            : "var(--surface-highest)",
                        transform: s === item.stage ? "scale(1.3)" : "scale(1)",
                        boxShadow:
                          s === item.stage
                            ? "0 0 6px color-mix(in srgb, var(--primary) 40%, transparent)"
                            : "none",
                      }}
                      title={`阶段 ${s}`}
                    />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div
            className="flex items-center justify-center gap-3 py-8"
            style={{ color: "var(--success)" }}
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="M22 4 12 14.01l-3-3" />
            </svg>
            <span className="text-sm font-medium">暂无待复习题目 ✅</span>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Charts Section ──────────────────────────────────────────────────────────

export function ChartsSection({
  abilityData,
  progressData,
  loading,
}: {
  abilityData: AbilityDataItem[] | null;
  progressData: ProgressDataItem[] | null;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
      <div className="md:col-span-6">
        <Card className="p-6 h-full">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 15%, transparent), color-mix(in srgb, var(--tertiary) 10%, transparent))" }}
            >
              <svg className="w-4 h-4" style={{ color: "var(--primary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-on-surface">能力雷达图</h2>
          </div>
          <AbilityRadar data={abilityData ?? []} loading={loading} />
        </Card>
      </div>

      <div className="md:col-span-6">
        <Card className="p-6 h-full">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--success) 15%, transparent), color-mix(in srgb, var(--info) 10%, transparent))" }}
            >
              <svg className="w-4 h-4" style={{ color: "var(--success)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-on-surface">进步曲线</h2>
          </div>
          <ProgressLineChart data={progressData ?? []} loading={loading} />
        </Card>
      </div>
    </div>
  );
}

// ─── Category Error Section ──────────────────────────────────────────────────

export function CategoryErrorSection({
  topCategories,
  maxCategoryCount,
  topErrors,
  extendedStats,
}: {
  topCategories: { name: string; count: number }[];
  maxCategoryCount: number;
  topErrors: { questionId: string; count: number; title: string }[];
  extendedStats?: ExtendedStats;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
      <div className="md:col-span-6">
        <Card className="p-6 h-full">
          <h2 className="text-lg font-semibold text-on-surface mb-5">分类分布</h2>
          {topCategories.length > 0 ? (
            <div className="space-y-4">
              {topCategories.map((cat, index) => (
                <div key={cat.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
                      {cat.name}
                    </span>
                    <span className="text-xs font-mono" style={{ color: "var(--on-surface-variant)" }}>
                      {cat.count}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: "var(--surface-highest)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${(cat.count / maxCategoryCount) * 100}%`,
                        background: `linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--tertiary) ${100 - index * 15}%, var(--primary)))`,
                        animation: "bar-grow 1s ease-out",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant py-8">暂无分类数据</p>
          )}

          {extendedStats?.difficultyDistribution &&
            extendedStats.difficultyDistribution.length > 0 && (
              <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--outline-variant)" }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--on-surface-variant)" }}>
                  难度分布
                </h3>
                <div className="flex gap-4 flex-wrap">
                  {extendedStats.difficultyDistribution.map((d) => (
                    <div key={d.difficulty} className="flex items-center gap-2">
                      <DifficultyBadge difficulty={d.difficulty as "easy" | "medium" | "hard"} />
                      <span className="text-sm font-mono font-medium" style={{ color: "var(--on-surface)" }}>
                        {d.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </Card>
      </div>

      <div className="md:col-span-6">
        <Card className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-on-surface">错题提醒</h2>
            <Link href="/questions" className="text-sm hover:underline" style={{ color: "var(--primary)" }}>
              查看全部
            </Link>
          </div>
          <div className="flex-grow space-y-1">
            {topErrors.map(({ questionId, count, title }, index) => (
              <Link
                key={questionId}
                href={`/questions/${questionId}`}
                className="group flex items-center justify-between p-3 border border-transparent hover:border-outline-variant hover:bg-surface-high rounded transition-all"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{
                      background: index < 3
                        ? `linear-gradient(135deg, color-mix(in srgb, var(--error) 15%, transparent), color-mix(in srgb, var(--warning) 10%, transparent))`
                        : "var(--surface-highest)",
                      color: index < 3 ? "var(--error)" : "var(--on-surface-variant)",
                    }}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm text-on-surface truncate flex-1 min-w-0">{title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <ErrorCountBadge count={count} />
                  <svg
                    className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
            {topErrors.length === 0 && (
              <p className="text-sm text-on-surface-variant p-3">暂无错题记录，继续保持！</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Recent Practice Section ─────────────────────────────────────────────────

export function RecentPracticeSection({
  recentHistory,
}: {
  recentHistory: StatsData["recentHistory"];
}) {
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--info) 15%, transparent), color-mix(in srgb, var(--tertiary) 10%, transparent))" }}
          >
            <svg className="w-4 h-4" style={{ color: "var(--info)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-on-surface">最近练习</h2>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory relative">
        {/* 时间线装饰线 */}
        <div
          className="absolute top-0 bottom-4 left-0 right-0 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, var(--outline-variant) 1px, transparent 1px)",
            backgroundSize: "calc(260px + 16px) 100%",
            backgroundPosition: "130px 0",
            opacity: 0.3,
          }}
        />
        {recentHistory.slice(0, 8).map((record, index) => (
          <Link
            key={record.id}
            href={`/questions/${record.questionId}`}
            className="min-w-[220px] sm:min-w-[260px] h-32 bg-surface-low border border-outline-variant rounded-lg p-4 hover:border-primary cursor-pointer transition-colors duration-200 flex flex-col justify-between flex-shrink-0 group snap-start relative"
          >
            {/* 时间线节点 */}
            <div
              className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 z-10"
              style={{
                borderColor: "var(--outline-variant)",
                backgroundColor: index === 0 ? "var(--primary)" : "var(--surface-bright)",
              }}
            />
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-sm" style={{ color: "var(--on-surface-variant)" }}>
                  #{record.questionId.slice(-4)}
                </span>
                <TagBadge tag={(record.question.tags ?? [])[0]?.tag ?? "未分类"} />
              </div>
              <h3 className="text-base font-medium text-on-surface group-hover:text-primary transition-colors truncate">
                {record.question.title}
              </h3>
            </div>
            <div className="flex items-center gap-1 text-sm" style={{ color: "var(--on-surface-variant)" }}>
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>{formatRelativeTime(record.attemptedAt)}</span>
            </div>
          </Link>
        ))}
        {recentHistory.length === 0 && (
          <div className="text-sm py-8 px-4" style={{ color: "var(--on-surface-variant)" }}>
            暂无练习记录，开始你的第一次刷题吧！
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Heatmap Section ─────────────────────────────────────────────────────────

export function HeatmapSection({
  heatmap,
  streakData,
  extendedStats,
  statsData,
}: {
  heatmap?: { date: string; count: number }[];
  streakData?: StreakStats;
  extendedStats?: ExtendedStats;
  statsData?: StatsData;
}) {
  const currentStreak = streakData?.currentStreak ?? 0;
  const longestStreak = streakData?.longestStreak ?? 0;
  const todayCount = streakData?.todayCount ?? 0;
  const todayPracticed = streakData?.todayPracticed ?? false;
  const dailyGoal = streakData?.dailyGoal ?? 5;

  const totalSeen = extendedStats?.overallStats.totalSeen ?? statsData?.total ?? 0;
  const mastered = extendedStats?.overallStats.mastered ?? statsData?.mastered ?? 0;
  const learning = extendedStats?.overallStats.learning ?? 0;
  const unsolved = extendedStats?.overallStats.unsolved ?? statsData?.unsolved ?? 0;

  const diffDist = extendedStats?.difficultyDistribution ?? [];
  const diffMap: Record<string, number> = {};
  for (const d of diffDist) diffMap[d.difficulty] = d.count;

  const weeklyBars = useMemo(() => {
    if (!heatmap || heatmap.length === 0) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const days = ["一", "二", "三", "四", "五", "六", "日"];
    const bars: { label: string; count: number; isToday: boolean }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const entry = heatmap.find((h) => h.date === dateStr);
      const isToday = dateStr === today.toISOString().slice(0, 10);
      bars.push({ label: days[i], count: entry?.count ?? 0, isToday });
    }
    return bars;
  }, [heatmap]);

  const weeklyMax = Math.max(...weeklyBars.map((b) => b.count), 1);

  return (
    <div className="mb-4">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 15%, transparent), color-mix(in srgb, var(--warning) 10%, transparent))" }}
            >
              <svg className="w-4 h-4" style={{ color: "var(--primary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-on-surface">练习热力图</h2>
          </div>
          <span className="text-xs font-mono" style={{ color: "var(--on-surface-variant)" }}>
            最近 90 天
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div>
            {heatmap ? <CalendarHeatmap data={heatmap} /> : <div className="h-[140px] w-full" />}
            <div className="flex items-center justify-end gap-2 mt-3">
              <span className="text-[10px] font-mono" style={{ color: "var(--on-surface-variant)" }}>
                Less
              </span>
              {[0, 1, 3, 6].map((count) => (
                <div
                  key={count}
                  className="transition-transform duration-200 hover:scale-125"
                  style={{
                    width: "14px",
                    height: "14px",
                    backgroundColor: getHeatmapColor(count),
                    borderRadius: "2px",
                  }}
                  title={`${count} 题`}
                />
              ))}
              <span className="text-[10px] font-mono" style={{ color: "var(--on-surface-variant)" }}>
                More
              </span>
            </div>
          </div>

          <div
            className="flex flex-col gap-0 lg:border-l lg:pl-6"
            style={{ borderColor: "var(--outline-variant)" }}
          >
            <div className="pb-4 mb-4" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v10l4-2" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <h3 className="text-xs font-semibold text-on-surface">刷题统计</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div
                  className="rounded-lg py-2.5 px-3 flex flex-col items-center"
                  style={{
                    background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, transparent), color-mix(in srgb, var(--primary) 3%, transparent))",
                    border: "1px solid color-mix(in srgb, var(--primary) 12%, transparent)",
                  }}
                >
                  <span className="text-xl font-extrabold tabular-nums leading-tight" style={{ color: "var(--primary)" }}>
                    {currentStreak}
                  </span>
                  <span className="text-[9px] mt-1 font-medium" style={{ color: "var(--on-surface-variant)" }}>
                    连续打卡
                  </span>
                </div>
                <div
                  className="rounded-lg py-2.5 px-3 flex flex-col items-center"
                  style={{
                    background: "linear-gradient(135deg, color-mix(in srgb, var(--warning) 8%, transparent), color-mix(in srgb, var(--warning) 3%, transparent))",
                    border: "1px solid color-mix(in srgb, var(--warning) 12%, transparent)",
                  }}
                >
                  <span className="text-xl font-extrabold tabular-nums leading-tight" style={{ color: "var(--warning)" }}>
                    {longestStreak}
                  </span>
                  <span className="text-[9px] mt-1 font-medium" style={{ color: "var(--on-surface-variant)" }}>
                    最长连续
                  </span>
                </div>
                <div
                  className="rounded-lg py-2.5 px-3 flex flex-col items-center"
                  style={{
                    background: "linear-gradient(135deg, color-mix(in srgb, var(--info) 8%, transparent), color-mix(in srgb, var(--info) 3%, transparent))",
                    border: "1px solid color-mix(in srgb, var(--info) 12%, transparent)",
                  }}
                >
                  <span className="text-xl font-extrabold tabular-nums leading-tight" style={{ color: "var(--info)" }}>
                    {totalSeen}
                  </span>
                  <span className="text-[9px] mt-1 font-medium" style={{ color: "var(--on-surface-variant)" }}>
                    累计刷题
                  </span>
                </div>
                <div
                  className="rounded-lg py-2.5 px-3 flex flex-col items-center"
                  style={{
                    background: todayPracticed
                      ? "linear-gradient(135deg, color-mix(in srgb, var(--success) 10%, transparent), color-mix(in srgb, var(--success) 4%, transparent))"
                      : "linear-gradient(135deg, color-mix(in srgb, var(--on-surface-variant) 6%, transparent), color-mix(in srgb, var(--on-surface-variant) 2%, transparent))",
                    border: todayPracticed
                      ? "1px solid color-mix(in srgb, var(--success) 15%, transparent)"
                      : "1px solid color-mix(in srgb, var(--on-surface-variant) 10%, transparent)",
                  }}
                >
                  <span className="text-xl font-extrabold tabular-nums leading-tight" style={{ color: todayPracticed ? "var(--success)" : "var(--on-surface-variant)" }}>
                    {todayCount}<span className="text-sm font-semibold" style={{ color: "var(--on-surface-variant)" }}>/{dailyGoal}</span>
                  </span>
                  <span className="text-[9px] mt-1 font-medium" style={{ color: "var(--on-surface-variant)" }}>
                    今日目标
                  </span>
                </div>
              </div>
            </div>

            <div className="pb-4 mb-4" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-3.5 h-3.5" style={{ color: "var(--success)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4 12 14.01l-3-3" />
                </svg>
                <h3 className="text-xs font-semibold text-on-surface">掌握进度</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "已掌握", value: mastered, color: "var(--success)", bg: "color-mix(in srgb, var(--success) 10%, transparent)" },
                  { label: "学习中", value: learning, color: "var(--primary)", bg: "color-mix(in srgb, var(--primary) 10%, transparent)" },
                  { label: "未开始", value: unsolved, color: "var(--on-surface-variant)", bg: "color-mix(in srgb, var(--on-surface-variant) 8%, transparent)" },
                ].map((item) => {
                  const pct = totalSeen > 0 ? Math.round((item.value / totalSeen) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[11px] font-medium" style={{ color: "var(--on-surface)" }}>
                            {item.label}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono tabular-nums" style={{ color: "var(--on-surface-variant)" }}>
                          {item.value} ({pct}%)
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: "var(--surface-highest)" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`,
                            background: `linear-gradient(90deg, ${item.color}, ${item.bg})`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" style={{ color: "var(--info)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <h3 className="text-xs font-semibold text-on-surface">本周活跃</h3>
                </div>
                <span className="text-[9px] font-mono" style={{ color: "var(--on-surface-variant)" }}>
                  共 {weeklyBars.reduce((s, b) => s + b.count, 0)} 题
                </span>
              </div>
              <div className="flex items-end gap-1.5" style={{ height: "48px" }}>
                {weeklyBars.map((bar) => (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full relative" style={{ height: "34px" }}>
                      <div
                        className="absolute bottom-0 w-full transition-all duration-500 ease-out"
                        style={{
                          height: `${Math.max((bar.count / weeklyMax) * 100, bar.count > 0 ? 10 : 0)}%`,
                          background: bar.isToday
                            ? "linear-gradient(180deg, var(--primary), color-mix(in srgb, var(--primary) 60%, transparent))"
                            : bar.count > 0
                              ? "linear-gradient(180deg, color-mix(in srgb, var(--primary) 50%, transparent), color-mix(in srgb, var(--primary) 20%, transparent))"
                              : "var(--surface-highest)",
                          borderRadius: bar.count > 0 ? "3px 3px 1px 1px" : "2px",
                        }}
                      />
                    </div>
                    <span
                      className="text-[8px] font-mono leading-none"
                      style={{
                        color: bar.isToday ? "var(--primary)" : "var(--on-surface-variant)",
                        fontWeight: bar.isToday ? 700 : 400,
                      }}
                    >
                      {bar.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
