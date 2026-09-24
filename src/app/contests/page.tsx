"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CreateContestForm } from "@/components/CreateContestForm";
import { formatRelativeTime } from "@/lib/utils";

interface Contest {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  duration: number;
  status: string;
  type: string;
  createdAt: string;
  _count: {
    problems: number;
    submissions: number;
  };
}

const STATUS_CONFIG = {
  upcoming: {
    label: "即将开始",
    color: "var(--info)",
    bg: "var(--info-container)",
    textColor: "var(--info-text)",
  },
  ongoing: {
    label: "进行中",
    color: "var(--success)",
    bg: "var(--success-container)",
    textColor: "var(--success-text)",
  },
  ended: {
    label: "已结束",
    color: "var(--on-surface-variant)",
    bg: "var(--surface-variant)",
    textColor: "var(--on-surface-variant)",
  },
};

const TYPE_LABELS: Record<string, string> = {
  weekly: "周赛",
  monthly: "月赛",
  custom: "自定义",
};

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetch("/api/contests?limit=50")
      .then((r) => r.json())
      .then((data) => {
        setContests(data.contests ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // 按状态分组
  const grouped = {
    upcoming: contests.filter((c) => c.status === "upcoming"),
    ongoing: contests.filter((c) => c.status === "ongoing"),
    ended: contests.filter((c) => c.status === "ended"),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-56px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-56px)] p-4 md:p-6 lg:p-8" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-on-surface flex items-center gap-3">
              <svg className="w-7 h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              竞赛中心
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              参与编程竞赛，提升算法能力，赢取排名
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateForm(true)}>
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            创建竞赛
          </Button>
        </div>
      </div>

      {/* Contest Sections */}
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Ongoing - 优先显示 */}
        {grouped.ongoing.length > 0 && (
          <ContestSection
            title="进行中的竞赛"
            subtitle={`${grouped.ongoing.length} 场竞赛正在进行`}
            contests={grouped.ongoing}
            status="ongoing"
          />
        )}

        {/* Upcoming */}
        {grouped.upcoming.length > 0 && (
          <ContestSection
            title="即将开始"
            subtitle={`${grouped.upcoming.length} 场竞赛即将开始`}
            contests={grouped.upcoming}
            status="upcoming"
          />
        )}

        {/* Ended */}
        {grouped.ended.length > 0 && (
          <ContestSection
            title="已结束"
            subtitle={`${grouped.ended.length} 场竞赛已结束`}
            contests={grouped.ended}
            status="ended"
          />
        )}

        {/* Empty State */}
        {contests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="w-20 h-20 text-on-surface-variant mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <h3 className="text-lg font-semibold text-on-surface mb-2">暂无竞赛</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              创建第一场竞赛，邀请大家参与吧
            </p>
            <Button variant="primary" onClick={() => setShowCreateForm(true)}>
              创建竞赛
            </Button>
          </div>
        )}
      </div>

      {/* Create Contest Modal */}
      {showCreateForm && (
        <CreateContestForm onClose={() => setShowCreateForm(false)} onSuccess={() => {
          setShowCreateForm(false);
          window.location.reload();
        }} />
      )}
    </div>
  );
}

function ContestSection({
  title,
  subtitle,
  contests,
  status,
}: {
  title: string;
  subtitle: string;
  contests: Contest[];
  status: string;
}) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];

  return (
    <section>
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="text-xl font-bold text-on-surface">{title}</h2>
        <span className="text-sm text-on-surface-variant">{subtitle}</span>
        {status === "ongoing" && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold animate-pulse"
            style={{ backgroundColor: config.bg, color: config.textColor }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            LIVE
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {contests.map((contest) => (
          <Link key={contest.id} href={`/contests/${contest.id}`}>
            <Card hoverable className="relative overflow-hidden p-5 h-full">
              {/* Status Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: config.color }}
              />

              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                    {contest.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className="px-1.5 py-0.5 rounded text-[11px] font-medium"
                      style={{ backgroundColor: config.bg, color: config.textColor }}
                    >
                      {config.label}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      {TYPE_LABELS[contest.type] ?? contest.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {contest.description && (
                <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">
                  {contest.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-on-surface-variant pt-3 border-t" style={{ borderColor: "var(--outline-variant)" }}>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {formatRelativeTime(contest.startTime)}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {contest._count.problems} 题
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  {contest._count.submissions} 人参与
                </span>
                <span className="ml-auto font-mono">{contest.duration}分钟</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
