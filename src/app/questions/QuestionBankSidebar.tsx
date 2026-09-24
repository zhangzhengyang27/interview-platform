"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { QuestionBankList } from "./QuestionBankList";
import type { QuestionBank, CategoryWithCount } from "./types";

interface QuestionBankSidebarProps {
  questionBanks: QuestionBank[];
  selectedBank: string | null;
  expandedBank: string | null;
  categories: CategoryWithCount[];
  onSelectBank: (id: string) => void;
  onToggleExpand: (id: string | null) => void;
}

export function QuestionBankSidebar({
  questionBanks,
  selectedBank,
  expandedBank,
  categories,
  onSelectBank,
  onToggleExpand
}: QuestionBankSidebarProps) {
  return (
    <aside
      className="w-[220px] shrink-0 border-r overflow-y-auto hidden lg:block"
      style={{
        backgroundColor: "var(--surface-container-low)",
        borderColor: "var(--outline-variant)"
      }}>
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: "var(--outline-variant)" }}>
        <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-on-surface-variant">
          题库
        </span>
        <span className="text-[11px] text-on-surface-variant">{questionBanks.length} 个</span>
      </div>

      {/* 精选题集入口 */}
      <Link
        href="/question-sets"
        className="flex items-center gap-2 px-4 py-2.5 border-b transition-colors hover:bg-surface-high"
        style={{ borderColor: "var(--outline-variant)" }}
      >
        <svg
          className="w-4 h-4 shrink-0"
          style={{ color: "var(--primary)" }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
          <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
          <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
        </svg>
        <span className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
          精选题集
        </span>
      </Link>

      <QuestionBankList
        questionBanks={questionBanks}
        selectedBank={selectedBank}
        expandedBank={expandedBank}
        categories={categories}
        onSelectBank={onSelectBank}
        onToggleExpand={onToggleExpand}
      />

      {/* Company Bank shortcut */}
      <div className="p-3 border-t" style={{ borderColor: "var(--outline-variant)" }}>
        <Link href="/companies">
          <Button variant="secondary" size="sm" className="w-full justify-center gap-1.5">
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2">
              <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
            </svg>
            按公司查看
          </Button>
        </Link>
      </div>
    </aside>
  );
}
