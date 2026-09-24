"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { DIFFICULTY_COLORS, getTagColor } from "@/lib/design-tokens";
import {
  FileText,
  Globe2,
  User,
  Plus,
  Calendar,
  Hash,
  Layers,
  ClipboardList,
  Sparkles,
} from "lucide-react";

type Difficulty = "easy" | "medium" | "hard";

interface TestPaper {
  id: string;
  name: string;
  detail: string | null;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  user: { name: string };
  items: { question: { id: string; title: string; difficulty: Difficulty } }[];
}

/** 从试卷题目中统计难度分布 */
function useDifficultyStats(papers: TestPaper[]) {
  return useMemo(() => {
    const stats = { easy: 0, medium: 0, hard: 0, total: 0 };
    for (const p of papers) {
      for (const it of p.items) {
        const d = it.question.difficulty;
        if (d in stats) stats[d]++;
        stats.total++;
      }
    }
    return stats;
  }, [papers]);
}

/** 试卷卡片 */
function PaperCard({ paper }: { paper: TestPaper }) {
  const count = paper.items?.length ?? 0;
  const firstTag = paper.tags?.[0];
  const tagColor = firstTag ? getTagColor(firstTag) : null;

  // 难度统计（用于卡片底部分布条）
  const diff = useDifficultyStats([paper]);

  return (
    <Link href={`/test-papers/${paper.id}`} className="block group h-full">
      <div
        className="relative flex flex-col h-full overflow-hidden rounded-2xl p-5 transition-all duration-300 bg-surface-low hover:-translate-y-1"
        style={{ border: "1px solid var(--outline-variant)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 12px 32px -8px color-mix(in srgb, var(--primary) 35%, transparent)";
          e.currentTarget.style.borderColor = "color-mix(in srgb, var(--primary) 45%, var(--outline))";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "";
          e.currentTarget.style.borderColor = "var(--outline-variant)";
        }}
      >
        {/* 顶部：类型图标 + 隐私标识 */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--primary-container), color-mix(in srgb, var(--primary) 70%, var(--tertiary)))",
              color: "var(--on-primary-container)",
            }}
          >
            <ClipboardList className="w-5 h-5" />
          </div>
          <span
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
            style={
              paper.isPublic
                ? { backgroundColor: "var(--info-container)", color: "var(--info-text)" }
                : { backgroundColor: "var(--surface-high)", color: "var(--on-surface-variant)" }
            }
          >
            {paper.isPublic ? <Globe2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {paper.isPublic ? "公开" : "私密"}
          </span>
        </div>

        {/* 标题 + 详情 */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-base font-semibold leading-snug line-clamp-1 transition-colors"
            style={{ color: "var(--on-surface)" }}
          >
            <span className="group-hover:text-primary">{paper.name}</span>
          </h3>
          {paper.detail && (
            <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--on-surface-variant)" }}>
              {paper.detail}
            </p>
          )}
        </div>

        {/* 难度分布条 */}
        {diff.total > 0 && (
          <div className="mt-4">
            <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
              {(["easy", "medium", "hard"] as const).map((k) =>
                diff[k] > 0 ? (
                  <span
                    key={k}
                    className="rounded-full"
                    style={{ flex: diff[k], backgroundColor: DIFFICULTY_COLORS[k].text }}
                  />
                ) : null
              )}
            </div>
          </div>
        )}

        {/* 底部信息 */}
        <div
          className="flex items-center justify-between gap-2 mt-4 pt-3 border-t"
          style={{ borderColor: "color-mix(in srgb, var(--outline-variant) 60%, transparent)" }}
        >
          <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
            {firstTag && tagColor ? (
              <span
                className="text-[11px] px-1.5 py-0.5 rounded-full truncate max-w-[110px] inline-block"
                style={{ backgroundColor: tagColor.bg, color: tagColor.text }}
                title={firstTag}
              >
                {firstTag}
              </span>
            ) : null}
            {paper.tags?.length > 1 && (
              <span className="text-[10px] text-on-surface-variant shrink-0">+{paper.tags.length - 1}</span>
            )}
          </div>
          <span className="font-mono text-[10px] text-on-surface-variant/70 shrink-0">
            #{paper.id.slice(-4)}
          </span>
        </div>

        {/* 元数据：题数 / 作者 / 时间 */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs" style={{ color: "var(--on-surface-variant)" }}>
          <span className="flex items-center gap-1">
            <Hash className="w-3.5 h-3.5" /> {count} 题
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> {paper.user?.name ?? "匿名"}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> {new Date(paper.createdAt).toLocaleDateString("zh-CN")}
          </span>
        </div>
      </div>
    </Link>
  );
}

/** 骨架屏加载卡片 */
function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 border border-outline-variant bg-surface-low">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
        <div className="w-14 h-5 rounded-full animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
      </div>
      <div className="space-y-2">
        <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
        <div className="h-3 rounded animate-pulse w-4/5" style={{ backgroundColor: "var(--surface-high)" }} />
      </div>
      <div className="mt-4 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--surface-high)" }} />
      <div className="mt-4 pt-3 border-t border-outline-variant">
        <div className="h-3 rounded animate-pulse w-1/3" style={{ backgroundColor: "var(--surface-high)" }} />
      </div>
    </div>
  );
}

export default function TestPapersPage() {
  const [papers, setPapers] = useState<TestPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"public" | "mine">("public");

  useEffect(() => {
    setLoading(true);
    const url = tab === "public"
      ? "/api/test-papers?isPublic=true&take=50"
      : "/api/test-papers?mine=true&take=50";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setPapers(data.papers ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab]);

  const stats = useDifficultyStats(papers);

  const tabs = [
    { key: "public", label: "公开试卷", icon: Globe2 },
    { key: "mine", label: "我的试卷", icon: User },
  ] as const;

  return (
    <div
      className="min-h-[calc(100dvh-56px)] px-4 md:px-6 lg:px-8 py-6 md:py-8"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* ── Header：渐变横幅 ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 md:p-8 mb-6"
          style={{
            background:
              "linear-gradient(135deg, var(--primary-container), color-mix(in srgb, var(--primary) 55%, var(--tertiary)))",
            color: "var(--on-primary-container)",
          }}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 bg-white blur-2xl" />
          <div className="absolute -bottom-16 right-16 w-48 h-48 rounded-full opacity-10 bg-white blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 opacity-90" />
                <span className="text-xs font-semibold uppercase tracking-widest opacity-80">Test Papers</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                📋 试卷中心
              </h1>
              <p className="text-sm mt-1.5 opacity-90">
                组卷练习，模拟真实面试场景
              </p>
            </div>
            <Link href="/test-papers/new" className="shrink-0">
              <Button variant="primary" size="lg" className="bg-white! text-primary! shadow-lg">
                <Plus className="w-4 h-4" /> 创建试卷
              </Button>
            </Link>
          </div>
        </div>

        {/* ── 工具条：Tab + 统计 ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="inline-flex p-1 rounded-xl gap-1" style={{ backgroundColor: "var(--surface-low)", border: "1px solid var(--outline-variant)" }}>
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: active ? "var(--primary)" : "transparent",
                    color: active ? "var(--on-primary)" : "var(--on-surface-variant)",
                    boxShadow: active ? "0 2px 8px color-mix(in srgb, var(--primary) 40%, transparent)" : undefined,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {!loading && papers.length > 0 && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--surface-low)" }}>
                <ClipboardList className="w-3.5 h-3.5" /> {papers.length} 份
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--surface-low)" }}>
                <Hash className="w-3.5 h-3.5" /> 共 {stats.total} 题
              </span>
            </div>
          )}
        </div>

        {/* ── 内容区 ── */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed"
            style={{ borderColor: "var(--outline)", backgroundColor: "var(--surface-low)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "var(--surface-high)", color: "var(--on-surface-variant)" }}
            >
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--on-surface)" }}>
              {tab === "public" ? "暂无公开试卷" : "你还没有创建试卷"}
            </h3>
            <p className="text-sm mb-5" style={{ color: "var(--on-surface-variant)" }}>
              {tab === "public"
                ? "等其他用户分享，或自己创建一份试试"
                : "选择题目，组一份属于自己的模拟试卷"}
            </p>
            <Link href="/test-papers/new">
              <Button variant="primary">创建第一份试卷</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {papers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
