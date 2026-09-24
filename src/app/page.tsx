"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { OnboardingWizard, useShouldShowOnboarding } from "@/components/OnboardingWizard";
import { useAuth } from "@/hooks/useAuth";
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
  const { isAuthenticated, isLoading: authLoading } = useAuth();
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

  // ── Guest State：未登录访客展示欢迎页（仪表盘接口全部需要登录，401 对游客无意义）──

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="p-4 md:p-margin-desktop max-w-[1440px] mx-auto w-full">
        <div className="flex flex-col items-center text-center py-16 gap-5">
          <h1 className="text-4xl font-semibold tracking-tight" style={{ color: "var(--on-surface)" }}>
            欢迎来到面试网
          </h1>
          <p className="text-base max-w-xl" style={{ color: "var(--on-surface-variant)" }}>
            AI 驱动的程序员面试准备平台：题库练习、AI 模拟面试、间隔复习与数据看板。
            登录后即可开始你的备考计划。
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Link href="/register" className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:brightness-110" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
              免费注册
            </Link>
            <Link href="/login" className="px-5 py-2.5 rounded-lg text-sm font-medium border border-outline-variant transition-colors hover:border-outline" style={{ color: "var(--on-surface)" }}>
              登录
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full max-w-3xl">
            {[
              { icon: "📚", title: "刷题与错题本", desc: "多方向题库、判题与收藏夹" },
              { icon: "🎤", title: "AI 模拟面试", desc: "文本/语音/视频三种模式实时追问" },
              { icon: "🔥", title: "科学复习", desc: "艾宾浩斯曲线安排每日复习计划" },
            ].map((f) => (
              <div key={f.title} className="rounded-lg p-5 text-left" style={{ backgroundColor: "var(--surface-container)" }}>
                <div className="text-2xl mb-2" aria-hidden>{f.icon}</div>
                <p className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>{f.title}</p>
                <p className="text-xs mt-1" style={{ color: "var(--on-surface-variant)" }}>{f.desc}</p>
              </div>
            ))}
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
