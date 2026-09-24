"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  userId: string | null;
  userName: string;
  userImage: string | null;
  value: number;
}

const PERIODS = [
  { id: "all", label: "全站榜" },
  { id: "week", label: "周榜" },
  { id: "month", label: "月榜" },
];

const DIMENSIONS = [
  { id: "solved", label: "解题数", icon: "✅" },
  { id: "submissions", label: "提交数", icon: "📝" },
  { id: "accuracy", label: "正确率", icon: "🎯" },
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState("all");
  const [dimension, setDimension] = useState("solved");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?by=${dimension}&period=${period}`)
      .then((r) => r.json())
      .then((data) => {
        setLeaderboard(data.leaderboard ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dimension, period]);

  const getValueLabel = () => {
    switch (dimension) {
      case "solved":
        return "解题数";
      case "submissions":
        return "提交次数";
      case "accuracy":
        return "正确率";
      default:
        return "数值";
    }
  };

  const formatValue = (value: number) => {
    if (dimension === "accuracy") {
      return `${value}%`;
    }
    return String(value);
  };

  return (
    <div className="min-h-[calc(100dvh-56px)] p-4 md:p-6 lg:p-8" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-on-surface flex items-center gap-3">
          <svg className="w-7 h-7 text-warning" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          排行榜
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          查看平台用户的各项数据排行
        </p>
      </div>

      {/* Controls */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Period Tabs */}
          <div
            className="inline-flex rounded-lg p-1"
            style={{ backgroundColor: "var(--surface-container-low)" }}
          >
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all",
                  period === p.id
                    ? "text-white shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
                style={
                  period === p.id
                    ? { backgroundColor: "var(--primary)" }
                    : undefined
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Dimension Tabs */}
          <div
            className="inline-flex rounded-lg p-1"
            style={{ backgroundColor: "var(--surface-container-low)" }}
          >
            {DIMENSIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => setDimension(d.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                  dimension === d.id
                    ? "text-white shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
                style={
                  dimension === d.id
                    ? { backgroundColor: "var(--primary)" }
                    : undefined
                }
              >
                <span>{d.icon}</span>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="max-w-5xl mx-auto">
        <Card className="overflow-hidden">
          {/* Table Header - 桌面端显示 */}
          <div
            className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: "var(--surface-container-low)",
              color: "var(--on-surface-variant)",
              borderBottom: "1px solid var(--outline-variant)",
            }}
          >
            <div className="col-span-1">排名</div>
            <div className="col-span-5">用户</div>
            <div className="col-span-3 text-right">{getValueLabel()}</div>
            <div className="col-span-3 text-right">趋势</div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-on-surface-variant">暂无数据</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.userId ?? entry.rank}
                  className={cn(
                    "sm:grid sm:grid-cols-12 sm:gap-4 px-4 sm:px-6 py-4 items-center transition-colors flex items-center gap-3",
                    entry.rank <= 3 && "font-medium"
                  )}
                  style={
                    entry.rank <= 3
                      ? {
                          backgroundColor:
                            entry.rank === 1
                              ? "var(--medal-gold-bg)"
                              : entry.rank === 2
                              ? "var(--medal-silver-bg)"
                              : "var(--medal-bronze-bg)",
                        }
                      : index % 2 === 1
                      ? { backgroundColor: "var(--surface-container-low)" }
                      : undefined
                  }
                >
                  {/* Rank */}
                  <div className="shrink-0 sm:col-span-1">
                    <RankBadge rank={entry.rank} />
                  </div>

                  {/* User Info - 移动端简化显示，点击进入公开主页 */}
                  <div className="flex-1 min-w-0 sm:col-span-5 flex items-center gap-3">
                    {entry.userImage ? (
                      <img
                        src={entry.userImage}
                        alt={`${entry.userName} 的头像`}
                        loading="lazy"
                        width={40}
                        height={40}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0"
                        style={{
                          backgroundColor: "var(--surface-high)",
                          color: "var(--on-surface)",
                        }}
                      >
                        {entry.userName.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      {entry.userId ? (
                        <Link
                          href={`/users/${entry.userId}`}
                          className="font-medium text-on-surface truncate text-sm sm:text-base hover:text-primary transition-colors"
                        >
                          {entry.userName}
                        </Link>
                      ) : (
                        <p className="font-medium text-on-surface truncate text-sm sm:text-base">
                          {entry.userName}
                        </p>
                      )}
                      <p className="text-[11px] sm:text-xs text-on-surface-variant hidden sm:block">
                        ID: {(entry.userId ?? "").slice(-8)}
                      </p>
                    </div>
                  </div>

                  {/* Value - 移动端突出显示 */}
                  <div className="shrink-0 sm:col-span-3 text-right">
                    <span
                      className={cn(
                        "font-mono text-sm sm:text-base",
                        entry.rank <= 3 ? "text-lg font-bold text-primary" : "text-on-surface"
                      )}
                    >
                      {formatValue(entry.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Summary */}
        {!loading && leaderboard.length > 0 && (
          <div className="mt-4 text-center text-sm text-on-surface-variant">
            共 <span className="font-mono text-on-surface">{leaderboard.length}</span> 名用户上榜
          </div>
        )}
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style={{ background: "var(--medal-gold-gradient)", color: "#fff" }}>
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style={{ background: "var(--medal-silver-gradient)", color: "#fff" }}>
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold" style={{ background: "var(--medal-bronze-gradient)", color: "#fff" }}>
        3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-mono text-on-surface-variant">
      {rank}
    </span>
  );
}
