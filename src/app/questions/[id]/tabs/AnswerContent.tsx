"use client";

import { memo } from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

const AnswerContent = memo(function AnswerContent({
  solution,
  answer,
  questionType,
  isBookmarked,
  onToggleBookmark,
  onShare,
}: {
  solution: string | null;
  answer?: boolean | null;
  questionType?: string;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  onShare?: () => void;
}) {
  const isJudge = questionType === "judge";
  return (
    <div className="h-full overflow-y-auto md:p-6">
      {solution || isJudge ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="M22 4 12 14.01l-3-3" />
            </svg>
            <span className="text-sm font-medium" style={{ color: "var(--success)" }}>
              推荐答案
            </span>
            {/* 移动端：收藏/分享按钮放标题行右侧 */}
            <div className="ml-auto flex items-center gap-1 lg:hidden">
              <button
                onClick={onToggleBookmark}
                disabled={!onToggleBookmark}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  isBookmarked ? "text-primary" : "text-on-surface-variant"
                }`}
                aria-label={isBookmarked ? "取消收藏" : "收藏"}>
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill={isBookmarked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
              <button
                onClick={onShare}
                disabled={!onShare}
                className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant transition-colors"
                aria-label="分享">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            </div>
          </div>
          {isJudge && answer !== null && answer !== undefined && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-4"
              style={{
                backgroundColor: answer ? "var(--success-container)" : "var(--error-container)",
                color: answer ? "var(--success)" : "var(--error)",
              }}
            >
              {answer ? "✓ 正确答案：正确" : "✗ 正确答案：错误"}
            </div>
          )}
          {solution ? (
            <MarkdownRenderer content={solution} />
          ) : (
            <p className="text-sm text-on-surface-variant">暂无答案解析。</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
          <svg
            className="w-16 h-16 text-on-surface-variant"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <circle cx="12" cy="17" r="0.5" fill="currentColor" />
          </svg>
          <div>
            <p className="text-on-surface font-medium mb-2">暂无推荐答案</p>
            <p className="text-on-surface-variant text-sm">
              这道题还没有参考答案，试试 AI 生成一个？
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

export default AnswerContent;
