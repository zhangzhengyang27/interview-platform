"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface LearningPath {
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
  totalItems: number;
}

const CATEGORY_TABS = [
  { key: "all", label: "全部" },
  { key: "backend", label: "后端" },
  { key: "frontend", label: "前端" },
  { key: "algorithm", label: "算法" },
  { key: "database", label: "数据库" },
  { key: "system-design", label: "系统设计" },
  { key: "fullstack", label: "全栈" },
];

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: "var(--info-container)", text: "var(--info-text)" },
  intermediate: { bg: "var(--warning-container)", text: "var(--warning-text)" },
  advanced: { bg: "var(--error-container)", text: "var(--error)" },
};

function SkeletonCard() {
  return (
    <div
      className="rounded-lg p-6 animate-pulse"
      style={{
        backgroundColor: "var(--surface-low)",
        border: "1px solid var(--outline-variant)",
      }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-lg shrink-0"
          style={{ backgroundColor: "var(--surface-high)" }}
        />
        <div className="flex-1">
          <div
            className="h-5 w-3/4 rounded mb-2"
            style={{ backgroundColor: "var(--surface-high)" }}
          />
          <div
            className="h-4 w-full rounded"
            style={{ backgroundColor: "var(--surface-high)" }}
          />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div
          className="h-5 w-14 rounded"
          style={{ backgroundColor: "var(--surface-high)" }}
        />
        <div
          className="h-5 w-16 rounded"
          style={{ backgroundColor: "var(--surface-high)" }}
        />
      </div>
      <div
        className="h-9 w-full rounded-md"
        style={{ backgroundColor: "var(--surface-high)" }}
      />
    </div>
  );
}

function PathCard({ path }: { path: LearningPath }) {
  const router = useRouter();
  const diffColor = DIFFICULTY_COLORS[path.difficultyLevel] ?? DIFFICULTY_COLORS.intermediate;

  return (
    <Card hoverable className="p-6 flex flex-col gap-4 cursor-pointer" onClick={() => router.push(`/learning-paths/${path.id}`)}>
      {/* 头部：icon + 标题 */}
      <div className="flex items-start gap-3">
        <span
          className="text-3xl leading-none flex items-center justify-center w-12 h-12 rounded-lg shrink-0"
          style={{ backgroundColor: "var(--surface-high)" }}
          role="img"
          aria-label={path.title}
        >
          {path.icon || "\u{1F4DA}"}
        </span>
        <div className="flex-1 min-w-0">
          <h3
            className="text-lg font-semibold truncate"
            style={{ color: "var(--on-surface)" }}
          >
            {path.title}
          </h3>
          <p
            className="text-sm mt-1 line-clamp-2"
            style={{ color: "var(--on-surface-variant)" }}
          >
            {path.description || "暂无描述"}
          </p>
        </div>
      </div>

      {/* 标签行 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 难度标签 */}
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold font-mono tracking-wide"
          style={{ backgroundColor: diffColor.bg, color: diffColor.text, border: `1px solid ${diffColor.bg}` }}
        >
          {path.difficultyLabel}
        </span>

        {/* 天数标签 */}
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium"
          style={{
            backgroundColor: "var(--surface-high)",
            color: "var(--on-surface-variant)",
          }}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          {path.durationDays} 天
        </span>

        {/* 题目数量 */}
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium"
          style={{
            backgroundColor: "var(--surface-high)",
            color: "var(--on-surface-variant)",
          }}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          {path.totalItems} 题
        </span>

        {/* 分类标签 */}
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium"
          style={{
            backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
            color: "var(--primary)",
          }}
        >
          {path.categoryLabel}
        </span>

        {/* 预设标记 */}
        {path.isPreset && (
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
            style={{
              backgroundColor: "var(--primary-container)",
              color: "var(--on-primary-container)",
            }}
          >
            预设
          </span>
        )}
      </div>

      {/* 操作按钮 */}
      <Button variant="primary" size="sm" className="w-full mt-auto">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
        开始学习
      </Button>
    </Card>
  );
}

export default function LearningPathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const fetchPaths = useCallback(async (category?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category && category !== "all") {
        params.set("category", category);
      }
      const url = `/api/learning-paths${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPaths(data);
    } catch (err) {
      console.error("Failed to fetch learning paths:", err);
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaths(activeCategory);
  }, [fetchPaths, activeCategory]);

  return (
    <div className="p-4 md:p-margin-desktop max-w-[1440px] mx-auto w-full">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1
          className="text-3xl font-semibold mb-1"
          style={{ color: "var(--on-surface)" }}
        >
          学习路线
        </h1>
        <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
          精选面试备考路线，按部就班系统化提升
        </p>
      </div>

      {/* 分类筛选 Tabs */}
      <div
        className="flex flex-wrap gap-2 mb-8 pb-1 overflow-x-auto"
        style={{ borderBottom: `1px solid var(--outline-variant)` }}
      >
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveCategory(tab.key)}
            className="px-4 py-2 text-sm font-medium rounded-t transition-all whitespace-nowrap"
            style={
              activeCategory === tab.key
                ? {
                    color: "var(--primary)",
                    backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)",
                    border: `1px solid var(--outline-variant)`,
                    borderBottomColor: "transparent",
                    marginBottom: "-1px",
                  }
                : {
                    color: "var(--on-surface-variant)",
                    border: "1px solid transparent",
                  }
            }
            onMouseEnter={(e) => {
              if (activeCategory !== tab.key)
                e.currentTarget.style.backgroundColor = "var(--surface-high)";
            }}
            onMouseLeave={(e) => {
              if (activeCategory !== tab.key)
                e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
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
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--on-surface)" }}
          >
            加载失败
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: "var(--on-surface-variant)" }}
          >
            无法加载学习路线。<br />
            <span className="text-xs opacity-70">错误：{error}</span>
          </p>
          <Button variant="primary" onClick={() => fetchPaths(activeCategory)}>
            重新加载
          </Button>
        </div>
      ) : paths.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: "var(--surface-high)" }}
          >
            <svg
              className="w-12 h-12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--on-surface-variant)"
              strokeWidth="1.2"
            >
              <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h2
            className="text-2xl font-semibold mb-2"
            style={{ color: "var(--on-surface)" }}
          >
            暂无学习路线
          </h2>
          <p
            className="text-sm mb-8 text-center max-w-sm"
            style={{ color: "var(--on-surface-variant)" }}
          >
            当前分类下还没有学习路线。
            <br />
            切换其他分类或等待管理员添加新路线。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paths.map((path) => (
            <PathCard key={path.id} path={path} />
          ))}
        </div>
      )}
    </div>
  );
}
