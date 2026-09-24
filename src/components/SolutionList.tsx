"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";

interface SolutionUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface Solution {
  id: string;
  content: string;
  language: string | null;
  upvotes: number;
  isFeatured: boolean;
  createdAt: string;
  user: SolutionUser | null;
}

interface SolutionListProps {
  questionId: string;
  onSolutionClick: (solution: Solution) => void;
  onWriteClick: () => void;
}

export function SolutionList({ questionId, onSolutionClick, onWriteClick }: SolutionListProps) {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"newest" | "most_upvotes">("newest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  const fetchSolutions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/questions/${questionId}/solutions?page=${page}&limit=${limit}&sort=${sort}`
      );
      if (res.ok) {
        const data = await res.json();
        setSolutions(data.solutions ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (error) {
      console.error("Failed to fetch solutions:", error);
    } finally {
      setLoading(false);
    }
  }, [questionId, page, limit, sort]);

  useEffect(() => {
    fetchSolutions();
  }, [questionId, sort, page, fetchSolutions]);

  const handleUpvote = async (solutionId: string) => {
    try {
      const res = await fetch(`/api/solutions/${solutionId}/upvote`, {
        method: "PATCH",
      });
      if (res.ok) {
        const data = await res.json();
        setSolutions((prev) =>
          prev.map((s) => (s.id === solutionId ? { ...s, upvotes: data.upvotes } : s))
        );
      }
    } catch (error) {
      console.error("Failed to upvote:", error);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="shrink-0 p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        style={{ borderColor: "var(--outline-variant)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-on-surface">
            用户题解
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: "var(--primary-container)",
              color: "var(--on-primary-container)",
            }}
          >
            {total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={sort === "newest" ? "primary" : "ghost"} size="sm" onClick={() => setSort("newest")}>
            最新
          </Button>
          <Button variant={sort === "most_upvotes" ? "primary" : "ghost"} size="sm" onClick={() => setSort("most_upvotes")}>
            最赞
          </Button>
          <Button variant="secondary" size="sm" onClick={onWriteClick}>
            写题解
          </Button>
        </div>
      </div>

      {/* Solution List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-on-surface-variant">加载中...</span>
            </div>
          </div>
        ) : solutions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <svg
              className="w-16 h-16 text-on-surface-variant"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8M16 17H8M10 9H8" />
            </svg>
            <div>
              <p className="text-on-surface font-medium mb-1">暂无题解</p>
              <p className="text-on-surface-variant text-sm">
                成为第一个分享解题思路的人吧！
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={onWriteClick}>
              写第一篇题解
            </Button>
          </div>
        ) : (
          solutions.map((solution) => (
            <Card
              key={solution.id}
              hoverable
              className="p-4 cursor-pointer"
              onClick={() => onSolutionClick(solution)}
            >
              {/* User Info */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {solution.user?.image ? (
                    <img
                      src={solution.user.image}
                      alt={solution.user.name ?? "用户"}
                      loading="lazy"
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                      style={{
                        backgroundColor: "var(--surface-highest)",
                        color: "var(--on-surface-variant)",
                      }}
                    >
                      {(solution.user?.name ?? "匿")[0]}
                    </div>
                  )}
                  <span className="text-sm font-medium text-on-surface">
                    {solution.user?.name ?? "匿名用户"}
                  </span>
                  {solution.isFeatured && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: "var(--warning-container)",
                        color: "var(--warning)",
                      }}
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      精选
                    </span>
                  )}
                  {solution.language && (
                    <span
                      className="text-[11px] px-1.5 py-0.5 rounded font-mono"
                      style={{
                        backgroundColor: "var(--surface-highest)",
                        color: "var(--on-surface-variant)",
                      }}
                    >
                      {solution.language}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-on-surface-variant">
                  {formatRelativeTime(solution.createdAt)}
                </span>
              </div>

              {/* Content Preview */}
              <p className="text-sm text-on-surface leading-relaxed line-clamp-3">
                {solution.content.length > 200
                  ? `${solution.content.slice(0, 200)}...`
                  : solution.content}
              </p>

              {/* Footer */}
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpvote(solution.id);
                  }}
                  className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                  {solution.upvotes}
                </button>
                <span className="text-[11px] text-on-surface-variant">
                  查看详情 →
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div
          className="shrink-0 p-3 border-t flex items-center justify-center gap-2"
          style={{ borderColor: "var(--outline-variant)" }}
        >
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </Button>
          <span className="text-xs text-on-surface-variant">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
