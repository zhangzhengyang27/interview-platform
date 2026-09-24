"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  FileText,
  FolderTree,
  Trophy,
  History,
  MessageSquare,
  ShieldAlert,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DifficultyItem {
  name: string;
  value: number;
}
interface CategoryItem {
  id: string;
  name: string;
  value: number;
}
interface TrendItem {
  date: string;
  count: number;
}

interface AdminStats {
  totalUsers: number;
  totalQuestions: number;
  totalCategories: number;
  totalContests: number;
  totalPracticeHistory: number;
  totalComments: number;
  pendingReports: number;
  recentUsers: number;
  dailyPracticeTrend: TrendItem[];
  difficultyDistribution: DifficultyItem[];
  categoryDistribution: CategoryItem[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  简单: "var(--success-text)",
  中等: "var(--warning-text)",
  困难: "var(--error)",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [allCategories, setAllCategories] = useState<{ id: string; name: string; parentId: string | null }[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => setAllCategories((json.categories ?? json) || []))
      .catch(() => {});
  }, []);

  const statCards = [
    { title: "总用户数", value: stats?.totalUsers ?? 0, icon: Users, color: "var(--info)" },
    { title: "总题目数", value: stats?.totalQuestions ?? 0, icon: FileText, color: "var(--primary)" },
    { title: "分类数", value: stats?.totalCategories ?? 0, icon: FolderTree, color: "var(--success)" },
    { title: "竞赛数", value: stats?.totalContests ?? 0, icon: Trophy, color: "var(--warning)" },
    { title: "练习记录", value: stats?.totalPracticeHistory ?? 0, icon: History, color: "var(--info)" },
    { title: "评论数", value: stats?.totalComments ?? 0, icon: MessageSquare, color: "var(--info)" },
    { title: "待处理举报", value: stats?.pendingReports ?? 0, icon: ShieldAlert, color: "var(--error)" },
    { title: "今日新增用户", value: stats?.recentUsers ?? 0, icon: TrendingUp, color: "var(--warning)" },
  ];

  const trendData = useMemo(() => stats?.dailyPracticeTrend ?? [], [stats]);
  const difficultyData = useMemo(() => stats?.difficultyDistribution ?? [], [stats]);
  const categoryData = useMemo(() => stats?.categoryDistribution ?? [], [stats]);
  const totalDifficulty = difficultyData.reduce((s, d) => s + d.value, 0);

  const cardClass = {
    backgroundColor: "var(--surface-bright)",
    borderColor: "var(--outline-variant)",
  } as const;

  // 按顶级知识域分组的分类题目分布
  const categoryGroups = useMemo(() => {
    const valueById = new Map(categoryData.map((c) => [c.id, c.value]));
    const tops = allCategories.filter((c) => !c.parentId);
    return tops
      .map((top) => {
        const children = allCategories
          .filter((c) => c.parentId === top.id)
          .map((c) => ({ id: c.id, name: c.name, value: valueById.get(c.id) ?? 0 }))
          .filter((c) => c.value > 0)
          .sort((a, b) => b.value - a.value);
        return {
          id: top.id,
          name: top.name,
          total: children.reduce((s, c) => s + c.value, 0),
          children,
        };
      })
      .filter((g) => g.children.length > 0)
      .sort((a, b) => b.total - a.total);
  }, [allCategories, categoryData]);

  const totalCategory = categoryGroups.reduce((s, g) => s + g.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="仪表盘"
        description="平台数据总览"
        icon={<LayoutDashboard className="h-5 w-5" />}
        actions={
          <>
            <Link
              href="/questions/new"
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
              style={{ color: "var(--on-primary)", backgroundColor: "var(--primary)" }}
            >
              新增题目
            </Link>
            <Link
              href="/admin/categories"
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
              style={{ color: "var(--on-primary-container)", backgroundColor: "var(--primary-container)" }}
            >
              管理分类
            </Link>
            <Link
              href="/admin/reports"
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
              style={{ color: "var(--on-surface-variant)", backgroundColor: "var(--surface-high)" }}
            >
              处理举报
            </Link>
          </>
        }
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="relative rounded-xl border p-4 overflow-hidden transition-shadow hover:shadow-lg"
              style={cardClass}
            >
              <div
                className="absolute top-0 left-0 right-0 h-0.5 opacity-80"
                style={{ background: `linear-gradient(90deg, ${item.color}, transparent)` }}
              />
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `color-mix(in srgb, ${item.color} 14%, transparent)` }}
                >
                  <Icon className="h-4 w-4" style={{ color: item.color }} />
                </div>
                <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
                  {item.title}
                </span>
              </div>
              <div className="text-2xl font-semibold" style={{ color: "var(--on-surface)" }}>
                {loading ? "…" : item.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* 趋势 + 难度 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border p-5" style={cardClass}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--on-surface)" }}>
            近30天刷题趋势
          </h2>
          {loading ? (
            <div className="flex items-center justify-center h-[280px] text-sm" style={{ color: "var(--on-surface-variant)" }}>
              加载中…
            </div>
          ) : trendData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: 280 }}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--outline-variant)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => v.slice(5)}
                    interval={4}
                    tick={{ fill: "var(--on-surface-variant)", fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: "var(--on-surface-variant)", fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [`${value} 题`, "刷题数"]}
                    contentStyle={{
                      backgroundColor: "var(--surface-bright)",
                      border: "1px solid var(--outline-variant)",
                      borderRadius: 8,
                      color: "var(--on-surface)",
                    }}
                  />
                  <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-sm" style={{ color: "var(--on-surface-variant)" }}>
              暂无数据
            </div>
          )}
        </div>

        <div className="rounded-xl border p-5" style={cardClass}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--on-surface)" }}>
            难度分布
          </h2>
          {loading ? (
            <div className="flex items-center justify-center h-[280px] text-sm" style={{ color: "var(--on-surface-variant)" }}>
              加载中…
            </div>
          ) : totalDifficulty > 0 ? (
            <div className="space-y-5 py-2">
              {difficultyData.map((d) => {
                const pct = Math.round((d.value / totalDifficulty) * 100);
                const color = DIFFICULTY_COLORS[d.name] || "#999";
                return (
                  <div key={d.name}>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="flex items-center gap-2" style={{ color: "var(--on-surface)" }}>
                        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        {d.name}
                      </span>
                      <span style={{ color: "var(--on-surface-variant)" }}>
                        {d.value} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-high)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
              <div className="text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
                共 {totalDifficulty} 道题目
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-sm" style={{ color: "var(--on-surface-variant)" }}>
              暂无数据
            </div>
          )}
        </div>
      </div>

      {/* 分类题目分布：按顶级知识域分组的卡片 */}
      <div className="rounded-xl border p-5" style={cardClass}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>
            分类题目分布
          </h2>
          {!loading && totalCategory > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--primary-container)", color: "var(--on-primary-container)" }}>
              共 {totalCategory} 题
            </span>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm" style={{ color: "var(--on-surface-variant)" }}>
            加载中…
          </div>
        ) : categoryGroups.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {categoryGroups.map((g) => (
              <div
                key={g.id}
                className="rounded-xl p-4 transition-shadow hover:shadow-md"
                style={{ backgroundColor: "var(--surface-low)", borderColor: "var(--outline-variant)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>
                    {g.name}
                  </span>
                  <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                    {g.total} 题
                  </span>
                </div>
                <div className="space-y-2.5">
                  {g.children.slice(0, 5).map((c) => {
                    const pct = g.total > 0 ? Math.round((c.value / g.total) * 100) : 0;
                    return (
                      <div key={c.id} className="flex items-center gap-3">
                        <span
                          className="w-24 text-xs truncate shrink-0"
                          style={{ color: "var(--on-surface-variant)" }}
                          title={c.name}
                        >
                          {c.name}
                        </span>
                        <div
                          className="flex-1 h-2 rounded-full overflow-hidden"
                          style={{ backgroundColor: "var(--surface-high)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--primary), var(--tertiary))" }}
                          />
                        </div>
                        <span className="w-9 text-xs text-right shrink-0" style={{ color: "var(--on-surface)" }}>
                          {c.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-16 text-sm" style={{ color: "var(--on-surface-variant)" }}>
            暂无数据
          </div>
        )}
      </div>
    </div>
  );
}
