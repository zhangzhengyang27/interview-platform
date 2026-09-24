"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
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

interface SolutionDetailProps {
  solution: Solution;
  currentUserId?: string | null;
  onBack: () => void;
  onEdit: (solution: Solution) => void;
  onDelete: (solutionId: string) => Promise<void>;
  onUpvote: (solutionId: string) => Promise<void>;
}

export function SolutionDetail({
  solution,
  currentUserId,
  onBack,
  onEdit,
  onDelete,
  onUpvote,
}: SolutionDetailProps) {
  const [upvoted, setUpvoted] = useState(false);
  const [currentUpvotes, setCurrentUpvotes] = useState(solution.upvotes);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isAuthor = currentUserId && solution.user?.id === currentUserId;

  const handleUpvote = async () => {
    try {
      await onUpvote(solution.id);
      setUpvoted(!upvoted);
      setCurrentUpvotes(upvoted ? currentUpvotes - 1 : currentUpvotes + 1);
    } catch (error) {
      console.error("Failed to upvote:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这篇题解吗？此操作不可恢复。")) return;

    setDeleteLoading(true);
    try {
      await onDelete(solution.id);
      onBack();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="shrink-0 p-4 border-b flex items-center justify-between"
        style={{ borderColor: "var(--outline-variant)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-sm font-medium text-on-surface">题解详情</h3>
        </div>
        {isAuthor && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(solution)}>
              编辑
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={deleteLoading}
              onClick={handleDelete}
            >
              {deleteLoading ? "删除中..." : "删除"}
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <Card className="p-4">
          {/* User Info & Meta */}
          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
            <div className="flex items-center gap-2">
              {solution.user?.image ? (
                <img
                  src={solution.user.image}
                  alt={solution.user.name ?? "用户"}
                  loading="lazy"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                  style={{
                    backgroundColor: "var(--surface-highest)",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  {(solution.user?.name ?? "匿")[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-on-surface">
                  {solution.user?.name ?? "匿名用户"}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {formatRelativeTime(solution.createdAt)}
                </p>
              </div>
            </div>
            {solution.language && (
              <span
                className="text-xs px-2 py-1 rounded font-mono"
                style={{
                  backgroundColor: "var(--surface-highest)",
                  color: "var(--on-surface-variant)",
                }}
              >
                {solution.language}
              </span>
            )}
          </div>

          {/* Markdown Content */}
          <div className="prose-sm max-w-none">
            <MarkdownRenderer content={solution.content} />
          </div>

          {/* Actions */}
          <div
            className="mt-4 pt-3 flex items-center gap-3"
            style={{ borderTop: "1px solid var(--outline-variant)" }}
          >
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                upvoted
                  ? "text-on-primary-container"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-high"
              }`}
              style={
                upvoted
                  ? { backgroundColor: "var(--primary-container)" }
                  : undefined
              }
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={upvoted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              有用 ({currentUpvotes})
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
