"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { OnboardingWizard, useShouldShowOnboarding } from "@/components/OnboardingWizard";
import {
  DashboardHeader,
  DailyGoalCard,
  StatsCards,
  DailyQuestionCard,
  DueReviewSection,
  ChartsSection,
  CategoryErrorSection,
  RecentPracticeSection,
  HeatmapSection,
} from "./dashboard/DashboardComponents";

// ─── API Response Types ──────────────────────────────────────────────────────

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

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function DashboardPage() {
  // 使用 SWR 进行数据获取和缓存
  const { data: extendedStats, error: extendedError } = useSWR<ExtendedStats>("/api/stats/extended", fetcher);
  const { data: streakData, error: streakError } = useSWR<StreakStats>("/api/stats/streak", fetcher);
  const { data: dailyQuestion, error: dailyError } = useSWR<DailyQuestion>("/api/daily-question", fetcher);
  const { data: statsData, error: statsError } = useSWR<StatsData>("/api/stats", fetcher);
  const { data: abilityResponse, error: abilityError } = useSWR<{ abilityData: AbilityDataItem[]; progressData: ProgressDataItem[] }>("/api/stats/ability", fetcher);
  const { data: reviewData, error: reviewError } = useSWR<{ reviews: DueReviewItem[]; dueCount: number }>("/api/review/due?limit=6", fetcher);

  const loading = !extendedStats && !extendedError;
  // dailyError 不参与整页错误判定：每日一题为 404（无题目）时卡片自行显示“暂无每日一题”，不拖垮整个首页
  const fetchError = extendedError || streakError || statsError || abilityError || reviewError;
  const abilityData = abilityResponse?.abilityData ?? null;
  const progressData = abilityResponse?.progressData ?? null;
  const dueReviews = reviewData?.reviews ?? [];
  const dueCount = reviewData?.dueCount ?? 0;

  // Onboarding state
  const shouldShowOnboarding = useShouldShowOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (shouldShowOnboarding) {
      setShowOnboarding(true);
    }
  }, [shouldShowOnboarding]);

  // 使用 useMemo 缓存计算数据
  const { dailyGoal, todayCount, weeklyCount, monthlyCount } = useMemo(() => {
    return {
      dailyGoal: streakData?.dailyGoal ?? 5,
      todayCount: streakData?.todayCount ?? extendedStats?.dailyCount ?? 0,
      weeklyCount: extendedStats?.weeklyCount ?? 0,
      monthlyCount: extendedStats?.monthlyCount ?? 0,
    };
  }, [streakData, extendedStats]);

  const { topCategories, maxCategoryCount, topErrors, recentHistory } = useMemo(() => {
    const cats = (extendedStats?.categoryDistribution ?? []).slice(0, 5);
    const maxCount = cats.length > 0 ? cats[0].count : 1;
    return {
      topCategories: cats,
      maxCategoryCount: maxCount,
      topErrors: statsData?.topErrors ?? [],
      recentHistory: statsData?.recentHistory ?? [],
    };
  }, [extendedStats, statsData]);

  const chartLoading = !abilityResponse && !abilityError;

  // ── Loading State ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-4 md:p-margin-desktop max-w-[1440px] mx-auto w-full">
        <div className="mb-8">
          <div className="h-9 w-48 mb-2 rounded-lg animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
          <div className="h-5 w-72 rounded-lg animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 h-64 md:h-[340px] rounded-lg animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
          <div className="md:col-span-4 flex flex-col gap-4">
            <div className="h-[96px] rounded-lg animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
            <div className="h-[96px] rounded-lg animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
            <div className="h-[96px] rounded-lg animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
          </div>
          <div className="md:col-span-4 h-64 md:h-[340px] rounded-lg animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
        </div>
        <div className="mt-4">
          <div className="h-48 md:h-[200px] w-full rounded-lg animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 h-56 md:h-[260px] rounded-lg animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
          <div className="md:col-span-6 h-56 md:h-[260px] rounded-lg animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
        </div>
        <div className="mt-6">
          <div className="h-6 w-36 mb-4 rounded-lg animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
          <div className="flex gap-4 overflow-x-auto pb-2 mobile-scroll">
            <div className="h-32 min-w-[260px] w-[280px] shrink-0 rounded-lg animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
            <div className="h-32 min-w-[260px] w-[280px] shrink-0 rounded-lg animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
            <div className="h-32 min-w-[260px] w-[280px] shrink-0 rounded-lg animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <div className="p-4 md:p-margin-desktop max-w-[1440px] mx-auto w-full">
        <div
          className={cn(
            "rounded-lg p-6 flex flex-col items-center gap-4",
            "border border-outline-variant"
          )}
          style={{ backgroundColor: "var(--error-container)" }}
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6"
              style={{ color: "var(--error)" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span
              className="text-base font-medium"
              style={{ color: "var(--error)" }}
            >
              加载失败
            </span>
          </div>
          <p
            className="text-sm text-center"
            style={{ color: "var(--error)" }}
          >
            {fetchError instanceof Error ? fetchError.message : String(fetchError)}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            重试
          </Button>
        </div>
      </div>
    );
  }

  // ── Rendered ───────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-margin-desktop max-w-[1440px] mx-auto w-full">
      <DashboardHeader streakData={streakData} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
        <DailyGoalCard
          todayCount={todayCount}
          dailyGoal={dailyGoal}
          weeklyCount={weeklyCount}
          monthlyCount={monthlyCount}
          goalMet={streakData?.goalMet ?? false}
        />
        <StatsCards extendedStats={extendedStats} statsData={statsData} />
        <DailyQuestionCard dailyQuestion={dailyQuestion} />
      </div>

      <DueReviewSection dueReviews={dueReviews} dueCount={dueCount} />

      <ChartsSection
        abilityData={abilityData}
        progressData={progressData}
        loading={chartLoading}
      />

      <HeatmapSection
        heatmap={extendedStats?.heatmap}
        streakData={streakData}
        extendedStats={extendedStats}
        statsData={statsData}
      />

      <CategoryErrorSection
        topCategories={topCategories}
        maxCategoryCount={maxCategoryCount}
        topErrors={topErrors}
        extendedStats={extendedStats}
      />

      <RecentPracticeSection recentHistory={recentHistory} />

      <footer
        className="w-full py-4 px-6 flex flex-col md:flex-row justify-between items-center mt-8"
        style={{
          backgroundColor: "var(--surface-lowest)",
          borderTop: "1px solid var(--outline-variant)",
        }}
      >
        <span className="text-[11px] font-mono tracking-widest uppercase text-on-surface-variant mb-4 md:mb-0">
          &copy; {new Date().getFullYear()} 面试网. All rights reserved for engineers.
        </span>
      </footer>

      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}
