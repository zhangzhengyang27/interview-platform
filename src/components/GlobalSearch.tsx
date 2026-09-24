"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { DifficultyBadge } from "@/components/ui/Badge";
import type { Difficulty, Note } from "@/types";
import { registerOpenSearch } from "./layout/search-global";

// ─── 搜索结果类型 ───────────────────────────────────────────

interface QuestionResult {
  id: string;
  title: string;
  difficulty: Difficulty;
  _type: "question";
}

interface NoteResult {
  id: string;
  title: string;
  company?: string;
  _type: "note";
}

interface StudyPlanResult {
  id: string;
  title: string;
  totalDays: number;
  _type: "study-plan";
}

type SearchResult = QuestionResult | NoteResult | StudyPlanResult;

// ─── 搜索 API ────────────────────────────────────────────────

interface QuestionApiResponse {
  id: string;
  title: string;
  difficulty: Difficulty;
}

async function searchQuestions(query: string, signal?: AbortSignal): Promise<QuestionResult[]> {
  const res = await fetch(`/api/questions?search=${encodeURIComponent(query)}&take=5`, { signal });
  if (!res.ok) return [];
  const data: { questions?: QuestionApiResponse[] } = await res.json();
  return (data.questions ?? []).map((q) => ({
    id: q.id,
    title: q.title,
    difficulty: q.difficulty,
    _type: "question" as const,
  }));
}

async function searchNotes(query: string, signal?: AbortSignal): Promise<NoteResult[]> {
  const res = await fetch(`/api/notes?search=${encodeURIComponent(query)}`, { signal });
  if (!res.ok) return [];
  const data: { notes?: Note[] } = await res.json();
  const notes = data.notes ?? [];
  return notes.slice(0, 5).map((n) => ({
    id: n.id,
    title: n.title,
    company: n.company,
    _type: "note" as const,
  }));
}

interface StudyPlanApiResponse {
  id: string;
  title: string;
  totalDays?: number;
  days?: number;
}

async function searchStudyPlans(query: string, signal?: AbortSignal): Promise<StudyPlanResult[]> {
  const res = await fetch(`/api/study-plans?search=${encodeURIComponent(query)}`, { signal });
  if (!res.ok) return [];
  const data: { plans?: StudyPlanApiResponse[] } = await res.json();
  const plans = data.plans ?? [];
  return plans.slice(0, 5).map((p) => ({
    id: p.id,
    title: p.title,
    totalDays: p.totalDays ?? p.days ?? 0,
    _type: "study-plan" as const,
  }));
}

// ─── 结果项渲染 ──────────────────────────────────────────────

function ResultItem({
  result,
  index,
  activeIndex,
  onClick,
}: {
  result: SearchResult;
  index: number;
  activeIndex: number;
  onClick: () => void;
}) {
  const isActive = index === activeIndex;

  const iconMap: Record<string, React.ReactNode> = {
    question: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
      </svg>
    ),
    note: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
    "study-plan": (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  };

  const typeLabelMap: Record<string, string> = {
    question: "题目",
    note: "面经",
    "study-plan": "计划",
  };

  return (
    <button
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
        isActive ? "bg-surface-highest" : "hover:bg-surface-high"
      )}
      onClick={onClick}
      role="option"
      aria-selected={isActive}
    >
      <span className="text-on-surface-variant flex-shrink-0">
        {iconMap[result._type]}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-on-surface truncate font-medium">
            {result.title}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-on-surface-variant">
            {typeLabelMap[result._type]}
          </span>
          {result._type === "question" && (
            <DifficultyBadge difficulty={result.difficulty} />
          )}
          {result._type === "note" && result.company && (
            <span className="text-xs text-on-surface-variant">
              {result.company}
            </span>
          )}
          {result._type === "study-plan" && (
            <span className="text-xs text-on-surface-variant">
              {result.totalDays} 天
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── 分组头 ──────────────────────────────────────────────────

function GroupHeader({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider border-t border-outline-variant">
      {icon}
      {label}
    </div>
  );
}

// ─── GlobalSearch 组件 ────────────────────────────────────────

const DEBOUNCE_MS = 300;

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  // 打开/关闭
  const openPanel = useCallback(() => {
    setOpen(true);
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  // 注册全局打开回调（供 TopNav / MobileDrawer 等点击触发）
  useEffect(() => {
    registerOpenSearch(openPanel);
    return () => registerOpenSearch(() => {});
  }, [openPanel]);

  // Cmd+K / Ctrl+K 全局快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) {
          closePanel();
        } else {
          openPanel();
        }
      }
      if (e.key === "Escape" && open) {
        closePanel();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, openPanel, closePanel]);

  // 搜索逻辑（debounce）
  useEffect(() => {
    if (!open || !query.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const [questions, notes, plans] = await Promise.all([
          searchQuestions(query, controller.signal),
          searchNotes(query, controller.signal),
          searchStudyPlans(query, controller.signal),
        ]);

        if (!controller.signal.aborted) {
          setResults([...questions, ...notes, ...plans]);
          setLoading(false);
        }
      } catch {
        // AbortError 属于主动取消，无需处理；其他错误静默恢复 loading 态
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, open]);

  // Reset results when query becomes empty (moved out of effect body)
  useEffect(() => {
    if (query.trim() === "") {
      // 延迟到下一个渲染周期重置，避免 effect 内同步 setState
      const id = requestAnimationFrame(() => {
        setResults([]);
        setLoading(false);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [query]);

  // 导航到结果页
  const navigateTo = useCallback(
    (result: SearchResult) => {
      closePanel();
      switch (result._type) {
        case "question":
          router.push(`/questions/${result.id}`);
          break;
        case "note":
          router.push(`/experiences`);
          break;
        case "study-plan":
          router.push(`/study-plans/${result.id}`);
          break;
      }
    },
    [closePanel, router]
  );

  // 键盘导航
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
      } else if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        navigateTo(results[activeIndex]);
      }
    },
    [results, activeIndex, navigateTo]
  );

  // 分组结果
  const questions = results.filter((r) => r._type === "question");
  const notes = results.filter((r) => r._type === "note");
  const plans = results.filter((r) => r._type === "study-plan");

  const groupedResults: { label: string; icon: React.ReactNode; items: SearchResult[] }[] = [];
  if (questions.length > 0)
    groupedResults.push({
      label: "题目",
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
        </svg>
      ),
      items: questions,
    });
  if (notes.length > 0)
    groupedResults.push({
      label: "面经笔记",
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      ),
      items: notes,
    });
  if (plans.length > 0)
    groupedResults.push({
      label: "学习计划",
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      ),
      items: plans,
    });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="全局搜索"
    >
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-sm"
        onClick={closePanel}
      />

      {/* 搜索面板 */}
      <div
        ref={panelRef}
        className="search-panel relative w-full max-w-2xl mx-4 bg-surface-low border border-outline-variant rounded-xl shadow-2xl overflow-hidden"
        data-no-focus-outline=""
        onKeyDown={handleKeyDown}
        style={{
          maxHeight: "calc(70vh - 15vh)",
        }}
      >
        {/* 搜索输入 */}
        <div className="flex items-center gap-3 px-4 border-b border-outline-variant focus-within:border-outline-variant">
          <svg
            className="w-5 h-5 text-on-surface-variant flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            placeholder="搜索题目、面经、学习计划..."
            className="w-full bg-transparent border-0 outline-none ring-0 shadow-none px-0 py-4 text-base text-on-surface placeholder:text-on-surface-variant/50"
            style={{
              border: "0 !important",
              outline: "none !important",
              boxShadow: "none !important",
              WebkitAppearance: "none",
              MozAppearance: "none",
              appearance: "none",
            }}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
          />
          {query && (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-mono text-on-surface-variant border border-outline-variant rounded">
              ESC
            </kbd>
          )}
        </div>

        {/* 搜索结果 */}
        <div
          className="overflow-y-auto"
          role="listbox"
          aria-label="搜索结果"
          style={{
            maxHeight: "calc(70vh - 15vh - 60px)",
          }}
        >
          {!query.trim() && (
            <div className="px-4 py-8 text-center text-sm text-on-surface-variant">
              <p className="mb-2">输入关键词搜索题目、面经笔记、学习计划</p>
              <div className="flex items-center justify-center gap-2 text-xs">
                <kbd className="px-1.5 py-0.5 border border-outline-variant rounded font-mono">
                  ↑↓
                </kbd>
                <span>导航</span>
                <kbd className="px-1.5 py-0.5 border border-outline-variant rounded font-mono ml-2">
                  Enter
                </kbd>
                <span>打开</span>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {query.trim() && !loading && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-on-surface-variant">
              没有找到与「{query}」相关的结果
            </div>
          )}

          {groupedResults.map((group, groupIdx) => {
            const prevItemsCount = groupedResults
              .slice(0, groupIdx)
              .reduce((sum, g) => sum + g.items.length, 0);

            return (
              <div key={group.label}>
                <GroupHeader label={group.label} icon={group.icon} />
                {group.items.map((item, itemIdx) => {
                  const globalIndex = prevItemsCount + itemIdx;
                  return (
                    <ResultItem
                      key={item.id}
                      result={item}
                      index={globalIndex}
                      activeIndex={activeIndex}
                      onClick={() => navigateTo(item)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* 底部提示 */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-outline-variant text-xs text-on-surface-variant bg-surface-high/30">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 border border-outline-variant rounded font-mono text-[10px]">
              ↑↓
            </kbd>
            导航
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 border border-outline-variant rounded font-mono text-[10px]">
              Enter
            </kbd>
            打开
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 border border-outline-variant rounded font-mono text-[10px]">
              ESC
            </kbd>
            关闭
          </span>
        </div>
      </div>
    </div>
  );
}
