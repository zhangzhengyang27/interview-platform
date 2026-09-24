"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

type LeaderboardType = "practice" | "streak" | "mastery";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userImage: string | null;
  value: number;
  total?: number;
}

const TABS: { key: LeaderboardType; label: string; unit: string }[] = [
  { key: "practice", label: "刷题榜", unit: "次" },
  { key: "streak", label: "打卡榜", unit: "天" },
  { key: "mastery", label: "掌握榜", unit: "题" },
];

function getRankColor(rank: number): string | undefined {
  if (rank === 1) return "var(--medal-gold)";
  if (rank === 2) return "var(--medal-silver)";
  if (rank === 3) return "var(--medal-bronze)";
  return undefined;
}

function getRankBg(rank: number): string | undefined {
  if (rank === 1) return "var(--medal-gold-bg)";
  if (rank === 2) return "var(--medal-silver-bg)";
  if (rank === 3) return "var(--medal-bronze-bg)";
  return undefined;
}

function Avatar({ name, image }: { name: string; image?: string | null }) {
  const initial = name?.charAt(0)?.toUpperCase() ?? "?";
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        loading="lazy"
        width={28}
        height={28}
        className="w-7 h-7 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-on-primary"
      style={{ backgroundColor: "var(--primary)" }}
    >
      {initial}
    </div>
  );
}

export function LeaderboardWidget({ className }: { className?: string }) {
  const [activeTab, setActiveTab] = useState<LeaderboardType>("practice");
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?type=${activeTab}`)
      .then((r) => r.json())
      .then((res) => {
        setData(res.data ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab]);

  const currentTab = TABS.find((t) => t.key === activeTab)!;

  return (
    <Card className={cn("p-4", className)}>
      {/* Tab 切换 */}
      <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ backgroundColor: "var(--surface-variant)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all",
              activeTab === tab.key
                ? "text-on-primary-container shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            )}
            style={
              activeTab === tab.key
                ? { backgroundColor: "var(--primary-container)" }
                : undefined
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 排行列表 */}
      <div className="space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-center text-sm text-on-surface-variant py-6">
            暂无数据
          </p>
        ) : (
          data.slice(0, 5).map((entry) => (
            <div
              key={entry.userId}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-md transition-colors",
                entry.rank <= 3 && "font-medium"
              )}
              style={{ backgroundColor: entry.rank <= 3 ? getRankBg(entry.rank) : undefined }}
            >
              {/* 排名 */}
              <span
                className="w-6 text-center text-sm font-bold tabular-nums shrink-0"
                style={{ color: getRankColor(entry.rank) ?? "var(--on-surface-variant)" }}
              >
                {entry.rank}
              </span>

              {/* 头像 + 昵称 */}
              <Avatar name={entry.userName} image={entry.userImage} />
              <span className="text-sm text-on-surface truncate flex-1 min-w-0">
                {entry.userName}
              </span>

              {/* 数值 */}
              <span
                className="text-sm font-semibold tabular-nums shrink-0"
                style={{
                  color:
                    entry.rank === 1
                      ? "var(--primary)"
                      : "var(--on-surface)",
                }}
              >
                {entry.value}
                {currentTab.unit}
                {entry.total != null && (
                  <span className="text-[11px] text-on-surface-variant ml-0.5">
                    /{entry.total}
                  </span>
                )}
              </span>
            </div>
          ))
        )}
      </div>

      {/* 查看完整榜单链接 */}
      <Link
        href="/leaderboard"
        className="block mt-4 pt-3 border-t text-center text-xs font-medium text-primary hover:text-primary-fixed transition-colors"
        style={{ borderColor: "var(--outline-variant)" }}
      >
        查看完整榜单 →
      </Link>
    </Card>
  );
}
