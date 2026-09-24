"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, getTagColor } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { Code2, FileText, CheckCircle2 } from "lucide-react";
import { type DbQuestion } from "./types";

interface QuestionGridProps {
  questions: DbQuestion[];
  fetching: boolean;
  fetchError: string | null;
  total: number;
  page: number;
  totalPages: number;
  search: string;
  /** 当前列表筛选状态对应的查询字符串（如 ?q=xxx&page=2），用于详情页返回时恢复 */
  listQuery?: string;
  onPageChange: (page: number) => void;
  onClearSearch: () => void;
  onRetry: () => void;
}

export function QuestionGrid({
  questions,
  fetching,
  fetchError,
  page,
  totalPages,
  search,
  listQuery = "",
  onPageChange,
  onClearSearch,
  onRetry
}: QuestionGridProps) {
  if (fetchError) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-20 rounded-lg border",
          "bg-[var(--error-container)] border-[var(--error)]"
        )}>
        <svg
          className="w-12 h-12 mb-4"
          style={{ color: "var(--error)" }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-base font-medium mb-2" style={{ color: "var(--error)" }}>
          加载失败
        </p>
        <p className="text-sm mb-4" style={{ color: "var(--error)" }}>
          {fetchError}
        </p>
        <Button variant="primary" size="sm" onClick={onRetry}>
          重试
        </Button>
      </div>
    );
  }

  if (fetching && questions.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <svg
          className="w-16 h-16 text-on-surface-variant mb-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1">
          <path d="M20 7l-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h3 className="text-lg font-semibold text-on-surface mb-2">没有找到匹配的题目</h3>
        <p className="text-sm text-on-surface-variant max-w-sm mb-4">
          {search ? "换个关键词试试" : "这个题库还没有题目，快来添加第一道吧"}
        </p>
        <div className="flex gap-3">
          {search ? (
            <Button variant="secondary" size="sm" onClick={onClearSearch}>
              清除搜索
            </Button>
          ) : (
            <>
              <Link href="/questions/new">
                <Button variant="secondary" size="sm">
                  手动添加
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
        style={{ opacity: fetching ? 0.5 : 1, transition: "opacity 0.15s" }}>
        {questions.map((q) => (
          <QuestionCard key={q.id} question={q} listQuery={listQuery} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </>
  );
}

/** LeetCode/LintCode 风格的紧凑题目卡片 */
function QuestionCard({
  question: q,
  listQuery,
}: {
  question: DbQuestion;
  listQuery?: string;
}) {
  // 难度色彩（默认 fallback 防止未知值）
  const diffKey = (q.difficulty as keyof typeof DIFFICULTY_COLORS) in DIFFICULTY_COLORS
    ? (q.difficulty as keyof typeof DIFFICULTY_COLORS)
    : "easy";
  const diffColor = DIFFICULTY_COLORS[diffKey];
  const diffLabel = DIFFICULTY_LABELS[diffKey] ?? q.difficulty;
  const dotColor = diffColor.text;
  const isCode = q.questionType === "code";
  const firstTag = q.tags[0];
  const tagColor = firstTag ? getTagColor(firstTag.tag) : null;
  const isMastered = q.mastery === "mastered";

  return (
    <Link href={`/questions/${q.id}${listQuery ? `?${listQuery}` : ""}`} className="block group h-full">
      <div
        className={cn(
          "relative flex flex-col h-full rounded-xl transition-all duration-300",
          "bg-surface-bright border border-outline-variant hover:-translate-y-1"
        )}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 12px 30px -8px ${dotColor}40`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "";
        }}
      >
        {/* 顶部徽章行：类型图标 + 难度 + 标签 */}
        <div className="flex items-center gap-2 px-4 pt-4">
          <span
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ backgroundColor: dotColor, color: "#fff" }}
          >
            {isCode ? <Code2 className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
          </span>
          <span
            className="text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0"
            style={{ backgroundColor: diffColor.bg, color: dotColor }}
          >
            {diffLabel}
          </span>
          {isMastered && (
            <CheckCircle2 className="w-4 h-4 shrink-0 ml-auto" style={{ color: "var(--success-text)" }} />
          )}
        </div>

        {/* 内容区 */}
        <div className="flex flex-col flex-1 px-4 py-3">
          <h4
            className="text-[15px] font-semibold leading-snug line-clamp-2 transition-colors min-h-[2.9em]"
            style={{ color: "var(--on-surface)" }}
          >
            <span className="group-hover:text-primary">{q.title}</span>
          </h4>
          <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t"
            style={{ borderColor: "color-mix(in srgb, var(--outline-variant) 60%, transparent)" }}>
            <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
              {firstTag && (
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full truncate max-w-[110px] inline-block font-medium"
                  style={{ backgroundColor: tagColor!.bg, color: tagColor!.text }}
                  title={firstTag.tag}
                >
                  {firstTag.tag}
                </span>
              )}
              {q.tags.length > 1 && (
                <span className="text-[10px] text-on-surface-variant shrink-0">
                  +{q.tags.length - 1}
                </span>
              )}
            </div>
            <span className="font-mono text-[10px] text-on-surface-variant/70 shrink-0">
              #{q.id.slice(-4)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Generate page numbers with ellipsis: [1, 2, 3, null, 8, 9, 10] */
function generatePageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | null)[] = [];

  // Always show first page
  pages.push(1);

  if (current > 3) {
    pages.push(null); // ellipsis
  }

  // Pages around current
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push(null); // ellipsis
  }

  // Always show last page
  pages.push(total);

  return pages;
}

function Pagination({
  page,
  totalPages,
  onPageChange
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-6 pb-4 px-4">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1.5 text-sm rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          color: "var(--on-surface-variant)",
          background: "linear-gradient(135deg, var(--surface-container), var(--surface-container-low))",
          border: "1px solid var(--outline-variant)",
        }}>
        上一页
      </button>

      {generatePageNumbers(page, totalPages).map((p, i) =>
        p === null ? (
          <span key={`dots-${i}`} className="px-1 text-on-surface-variant text-sm">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className="min-w-[32px] h-8 text-sm rounded transition-all"
            style={{
              background: p === page
                ? "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, var(--warning)))"
                : "linear-gradient(135deg, var(--surface-container), var(--surface-container-low))",
              color: p === page ? "var(--on-primary)" : "var(--on-surface-variant)",
              fontWeight: p === page ? 600 : 400,
              border: p === page ? "none" : "1px solid var(--outline-variant)",
            }}>
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-sm rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          color: "var(--on-surface-variant)",
          background: "linear-gradient(135deg, var(--surface-container), var(--surface-container-low))",
          border: "1px solid var(--outline-variant)",
        }}>
        下一页
      </button>

      <span className="ml-3 text-xs text-on-surface-variant font-mono">
        {page}/{totalPages}
      </span>
    </div>
  );
}
