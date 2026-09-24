"use client";

import type { QuestionBank, CategoryWithCount } from "./types";

interface QuestionBankListProps {
  questionBanks: QuestionBank[];
  selectedBank: string | null;
  expandedBank: string | null;
  categories: CategoryWithCount[];
  onSelectBank: (id: string) => void;
  onToggleExpand: (id: string | null) => void;
}

export function QuestionBankList({
  questionBanks,
  selectedBank,
  expandedBank,
  categories,
  onSelectBank,
  onToggleExpand,
}: QuestionBankListProps) {
  if (questionBanks.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-on-surface-variant">暂无题库</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      {questionBanks.map((bank) => {
        const isSelected = selectedBank === bank.id;
        const isExpanded = expandedBank === bank.id;
        const topics = categories
          .filter((c) => c.type === "topic" && c.parentId === bank.id)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        const hasTopics = topics.length > 0;

        return (
          <div key={bank.id}>
            <button
              onClick={() => {
                onSelectBank(bank.id);
                if (hasTopics) {
                  onToggleExpand(isExpanded ? null : bank.id);
                }
              }}
              data-skip-touch-min-height
              className="w-full text-left px-4 py-3 group"
              style={{
                background: isSelected && !isExpanded
                  ? "linear-gradient(90deg, color-mix(in srgb, var(--primary) 10%, transparent), transparent)"
                  : "transparent",
                borderLeft: isSelected && !isExpanded
                  ? "3px solid var(--primary)"
                  : "3px solid transparent",
                transition: "background 0.3s ease, border-color 0.3s ease",
              }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-medium truncate"
                    style={{
                      color:
                        isSelected && !isExpanded ? "var(--primary)" : "var(--on-surface)",
                      transition: "color 0.3s ease",
                    }}>
                    {bank.name}
                  </p>
                  {bank.description && (
                    <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">
                      {bank.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 mt-0.5">
                  <span
                    className="text-[11px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background: isSelected && !isExpanded
                        ? "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, var(--warning)))"
                        : "var(--surface-variant)",
                      color:
                        isSelected && !isExpanded
                          ? "var(--on-primary)"
                          : "var(--on-surface-variant)",
                      transition: "background 0.3s ease, color 0.3s ease",
                    }}>
                    {bank.questionCount}
                  </span>
                  {hasTopics && (
                    <svg
                      className="w-3 h-3 text-on-surface-variant transition-transform"
                      style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  )}
                </div>
              </div>
            </button>

            {hasTopics && isExpanded && (
              <div
                className="ml-4 border-l"
                style={{ borderColor: "var(--outline-variant)" }}>
                {topics.map((topic) => {
                  const isTopicSelected = selectedBank === topic.id;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => onSelectBank(topic.id)}
                      data-skip-touch-min-height
                      className="w-full text-left px-3 py-2"
                      style={{
                        background: isTopicSelected
                          ? "linear-gradient(90deg, color-mix(in srgb, var(--primary) 10%, transparent), transparent)"
                          : "transparent",
                        borderLeft: isTopicSelected
                          ? "3px solid var(--primary)"
                          : "3px solid transparent",
                        transition: "background 0.3s ease, border-color 0.3s ease",
                      }}>
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className="text-xs truncate"
                          style={{
                            color: isTopicSelected
                              ? "var(--primary)"
                              : "var(--on-surface-variant)",
                            transition: "color 0.3s ease",
                          }}>
                          {topic.name}
                        </p>
                        <span
                          className="text-[10px] font-mono px-1 py-0.5 rounded shrink-0"
                          style={{
                            background: isTopicSelected
                              ? "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 80%, var(--warning)))"
                              : "var(--surface-variant)",
                            color: isTopicSelected
                              ? "var(--on-primary)"
                              : "var(--on-surface-variant)",
                            transition: "background 0.3s ease, color 0.3s ease",
                          }}>
                          {topic.questionCount}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
