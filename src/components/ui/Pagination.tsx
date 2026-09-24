"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number, pageSize: number) => void;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  className?: string;
}

function buildPages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 4) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 3) pages.push("…");
  pages.push(total);
  return pages;
}

export function Pagination({
  current,
  pageSize,
  total,
  onChange,
  pageSizeOptions = [10, 20, 50],
  showSizeChanger = true,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safeCurrent = Math.min(Math.max(1, current), totalPages);

  const goto = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    if (next !== safeCurrent) onChange(next, pageSize);
  };

  const baseBtn =
    "inline-flex items-center justify-center min-w-9 h-9 px-3 rounded-lg text-sm border transition-colors select-none";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        disabled={safeCurrent <= 1}
        onClick={() => goto(safeCurrent - 1)}
        aria-label="上一页"
        className={cn(
          baseBtn,
          "bg-transparent text-on-surface border-outline-variant hover:bg-surface-high disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {buildPages(safeCurrent, totalPages).map((p, idx) =>
        p === "…" ? (
          <span key={`e-${idx}`} className="px-1 text-on-surface-variant text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => goto(p)}
            aria-current={p === safeCurrent ? "page" : undefined}
            className={cn(
              baseBtn,
              p === safeCurrent
                ? "bg-primary-container text-on-primary-container font-semibold border-primary-container"
                : "bg-transparent text-on-surface border-outline-variant hover:bg-surface-high"
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        disabled={safeCurrent >= totalPages}
        onClick={() => goto(safeCurrent + 1)}
        aria-label="下一页"
        className={cn(
          baseBtn,
          "bg-transparent text-on-surface border-outline-variant hover:bg-surface-high disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <span className="ml-2 text-sm text-on-surface-variant whitespace-nowrap">
        共 {total} 条
      </span>

      {showSizeChanger && (
        <select
          value={pageSize}
          onChange={(e) => onChange(1, Number(e.target.value))}
          className="ml-2 h-9 rounded-lg border border-outline-variant bg-surface-highest text-sm text-on-surface px-2 focus:outline-none focus:border-primary"
          aria-label="每页条数"
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n} 条/页
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
