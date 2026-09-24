"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagBadge } from "@/components/ui/Badge";
import { DIFFICULTY_TOP_BORDER } from "@/lib/design-tokens";

const PAGE_SIZE = 24;

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

interface DbQuestion {
  id: string;
  title: string;
  content: string;
  questionType: string;
  difficulty: string;
  mastery: string;
  isBookmarked: boolean;
  company: string | null;
  categoryId: string | null;
  viewCount: number;
  tags: { tag: string }[];
}

export default function CompanyDetailPage() {
  const params = useParams();
  const [companyName, setCompanyName] = useState<string>("");
  const [questions, setQuestions] = useState<DbQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [fetching, setFetching] = useState(false);

  // 统计数据
  const [stats, setStats] = useState({
    difficultyDistribution: {} as Record<string, number>,
    categoryDistribution: [] as { name: string; count: number }[],
  });

  // 解析 URL 参数
  useEffect(() => {
    if (params?.company) {
      setCompanyName(decodeURIComponent(params.company as string));
    }
  }, [params]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 获取题目数据
  useEffect(() => {
    if (!companyName) return;

    const params = new URLSearchParams();
    params.set("take", String(PAGE_SIZE));
    params.set("skip", String((page - 1) * PAGE_SIZE));
    params.set("company", companyName);

    if (search) {
      params.set("search", search);
    }

    setFetching(true);
    fetch(`/api/questions?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data.questions ?? []);
        setTotal(data.total ?? 0);
        setFetching(false);
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [companyName, search, page]);

  // 获取统计数据
  useEffect(() => {
    if (!companyName) return;

    fetch(`/api/questions?company=${encodeURIComponent(companyName)}&take=1000&skip=0`)
      .then((r) => r.json())
      .then((data) => {
        const allQuestions = data.questions ?? [];

        // 难度分布
        const diffDist: Record<string, number> = {};
        allQuestions.forEach((q: DbQuestion) => {
          diffDist[q.difficulty] = (diffDist[q.difficulty] || 0) + 1;
        });

        setStats({
          difficultyDistribution: diffDist,
          categoryDistribution: [], // 可以后续扩展分类分布
        });

        if (loading) setLoading(false);
      })
      .catch(console.error);
  // 故意省略 loading：此 effect 仅在 companyName 变化时重新拉取，
  // 加入 loading 会导致 loading 状态变化触发无限重跑
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyName]);

  // 重置分页
  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
    <div className="min-h-[calc(100dvh-56px)] pt-20 px-4 md:px-8 pb-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/companies"
            className="text-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            返回公司列表
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-on-surface mb-2">
          🏢 {companyName} 面试题
        </h1>
        <p className="text-on-surface-variant">
          共 <strong className="text-on-surface">{total}</strong> 道面试真题
        </p>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Questions */}
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--primary-container)" }}
              >
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: "var(--primary)" }}
                >
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-on-surface-variant">题目总数</p>
                <p className="text-2xl font-bold text-on-surface">{total}</p>
              </div>
            </div>
          </Card>

          {/* Difficulty Distribution */}
          <Card className="p-5">
            <p className="text-sm text-on-surface-variant mb-3">难度分布</p>
            <div className="flex gap-4">
              {Object.entries(stats.difficultyDistribution).map(([diff, count]) => (
                <div key={diff} className="text-center">
                  <div
                    className="text-lg font-bold"
                    style={{
                      color:
                        DIFFICULTY_TOP_BORDER[
                          diff as keyof typeof DIFFICULTY_TOP_BORDER
                        ] ?? "var(--on-surface)",
                    }}
                  >
                    {count}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {DIFFICULTY_LABELS[diff] ?? diff}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-5">
            <p className="text-sm text-on-surface-variant mb-3">快捷操作</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                打印题单
              </Button>
              <Link href={`/questions/new?company=${encodeURIComponent(companyName)}`}>
                <Button variant="primary" size="sm">
                  添加题目
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <Input
            placeholder={`搜索 ${companyName} 的面试题...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      {/* Questions Grid */}
      <div className="max-w-7xl mx-auto">
        {fetching && questions.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              className="w-16 h-16 text-on-surface-variant mb-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-on-surface mb-2">
              暂无题目
            </h3>
            <p className="text-sm text-on-surface-variant mb-4">
              {search ? "换个关键词试试" : `${companyName} 还没有收录题目`}
            </p>
            {!search && (
              <Link href={`/questions/new?company=${encodeURIComponent(companyName)}`}>
                <Button variant="primary" size="sm">
                  添加第一道题
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              style={{ opacity: fetching ? 0.5 : 1, transition: "opacity 0.15s" }}
            >
              {questions.map((q) => {
                const topColor =
                  DIFFICULTY_TOP_BORDER[
                    q.difficulty as keyof typeof DIFFICULTY_TOP_BORDER
                  ] ?? "var(--on-surface-variant)";
                return (
                  <Link key={q.id} href={`/questions/${q.id}`} className="block group">
                    <Card
                      className="relative flex flex-col p-4 overflow-hidden h-full"
                      hoverable
                      style={{
                        borderTop: `2px solid ${topColor}`,
                      } as React.CSSProperties}
                    >
                      {/* Header row */}
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {q.questionType === "code" ? (
                            <svg
                              className="w-3.5 h-3.5 shrink-0"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              style={{ color: "var(--info-text)" }}
                            >
                              <polyline points="16 18 22 12 16 6" />
                              <polyline points="8 6 2 12 8 18" />
                            </svg>
                          ) : (
                            <svg
                              className="w-3.5 h-3.5 shrink-0"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              style={{ color: "var(--warning-text)" }}
                            >
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                          )}
                          <span className="font-mono text-xs text-on-surface-variant">
                            #{q.id.slice(-4)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className="text-[11px] px-1.5 py-0.5 rounded font-medium"
                            style={{
                              backgroundColor: `${topColor}22`,
                              color: topColor,
                            }}
                          >
                            {DIFFICULTY_LABELS[q.difficulty] ?? q.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="font-semibold text-on-surface mb-3 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {q.title}
                      </h4>

                      {/* Footer: tags + mastery */}
                      <div className="flex items-center justify-between gap-2 mt-auto">
                        <div className="flex flex-wrap gap-1.5">
                          {q.tags.slice(0, 2).map((t) => (
                            <TagBadge key={t.tag} tag={t.tag} />
                          ))}
                          {q.tags.length > 2 && (
                            <span className="text-[11px] text-on-surface-variant">
                              +{q.tags.length - 2}
                            </span>
                          )}
                        </div>
                        {q.mastery === "mastered" && (
                          <span
                            className="text-[11px] px-1.5 py-0.5 rounded font-medium"
                            style={{
                              backgroundColor: "var(--success-container)",
                              color: "var(--success-text)",
                            }}
                          >
                            已掌握
                          </span>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-6 pb-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    color: "var(--on-surface-variant)",
                    backgroundColor: "transparent",
                  }}
                >
                  上一页
                </button>

                {generatePageNumbers(page, totalPages).map(
                  (p, i) =>
                    p === null ? (
                      <span
                        key={`dots-${i}`}
                        className="px-1 text-on-surface-variant text-sm"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="min-w-[32px] h-8 text-sm rounded transition-colors"
                        style={{
                          backgroundColor:
                            p === page ? "var(--primary)" : "transparent",
                          color:
                            p === page
                              ? "var(--on-primary)"
                              : "var(--on-surface-variant)",
                          fontWeight: p === page ? 600 : 400,
                        }}
                      >
                        {p}
                      </button>
                    )
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    color: "var(--on-surface-variant)",
                    backgroundColor: "transparent",
                  }}
                >
                  下一页
                </button>

                <span className="ml-3 text-xs text-on-surface-variant font-mono">
                  {page}/{totalPages}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Generate page numbers with ellipsis */
function generatePageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | null)[] = [];

  pages.push(1);

  if (current > 3) {
    pages.push(null);
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push(null);
  }

  pages.push(total);

  return pages;
}
