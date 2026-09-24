"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { QuestionBankList } from "./QuestionBankList";
import type { QuestionBank, CategoryWithCount } from "./types";

interface MobileQuestionBankDrawerProps {
  questionBanks: QuestionBank[];
  selectedBank: string | null;
  expandedBank: string | null;
  categories: CategoryWithCount[];
  onSelectBank: (id: string) => void;
  onToggleExpand: (id: string | null) => void;
  open: boolean;
  onClose: () => void;
}

export function MobileQuestionBankDrawerTrigger({
  onClick,
  selectedBankName,
}: {
  onClick: () => void;
  selectedBankName?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border bg-surface-high text-on-surface outline-none shrink-0"
      style={{ borderColor: "var(--outline-variant)" }}
      aria-label="打开题库筛选">
      <svg
        className="w-4 h-4 text-on-surface-variant"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2">
        <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z" />
      </svg>
      <span className="truncate max-w-[120px]">
        {selectedBankName ?? "选择题库"}
      </span>
      <svg
        className="w-3.5 h-3.5 text-on-surface-variant"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}

export function MobileQuestionBankDrawer({
  questionBanks,
  selectedBank,
  expandedBank,
  categories,
  onSelectBank,
  onToggleExpand,
  open,
  onClose,
}: MobileQuestionBankDrawerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  const handleSelectBank = (id: string) => {
    onSelectBank(id);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[280px] max-w-[80vw] bg-surface-bright border-r border-outline-variant transition-transform duration-300 ease-out lg:hidden flex flex-col",
          open ? "translate-x-0" : "-translate-x-full"
        )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2">
              <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z" />
            </svg>
            <span className="text-base font-semibold text-on-surface">题库筛选</span>
          </div>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors"
            aria-label="关闭题库筛选">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Bank list */}
        <div className="flex-1 overflow-y-auto mobile-scroll">
          <QuestionBankList
            questionBanks={questionBanks}
            selectedBank={selectedBank}
            expandedBank={expandedBank}
            categories={categories}
            onSelectBank={handleSelectBank}
            onToggleExpand={onToggleExpand}
          />
        </div>

        {/* Company shortcut */}
        <div className="p-3 border-t border-outline-variant shrink-0">
          <Link href="/companies" onClick={onClose}>
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
      </div>
    </>
  );
}
