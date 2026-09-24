"use client";

import { memo, useState } from "react";
import type { Comment } from "../types";

const DiscussionContent = memo(function DiscussionContent({
  questionId,
  comments,
  onUpvote,
}: {
  questionId: string;
  comments: Comment[];
  onUpvote: (id: string) => void;
}) {
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const submitComment = async () => {
    if (!commentText.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const res = await fetch(`/api/questions/${questionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        setCommentText("");
      }
    } catch {
      // silently fail
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div
        className="shrink-0 p-4 border-b"
        style={{ borderColor: "var(--outline-variant)" }}
      >
        <div
          className="flex gap-2"
          style={{ backgroundColor: "var(--surface-container)", borderRadius: "8px", padding: "8px" }}
        >
          <textarea
            className="flex-1 bg-transparent border-none text-on-surface text-sm resize-none outline-none placeholder:text-on-surface-variant"
            placeholder="写下你的回答或讨论..."
            rows={2}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submitComment();
              }
            }}
          />
          <button
            onClick={submitComment}
            disabled={!commentText.trim() || commentLoading}
            className="self-end px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-40"
            style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
          >
            {commentLoading ? "发送中..." : "发布"}
          </button>
        </div>
        <p className="text-[11px] text-on-surface-variant mt-1 px-1">
          按 Ctrl+Enter 快速发布
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!comments || comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg
              className="w-12 h-12 text-on-surface-variant mb-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path d="M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v4l-4-4H9a1.994 1.994 0 0 1-1.414-.586m0 0L11 14h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2v4l.586-.586z" />
            </svg>
            <p className="text-sm text-on-surface-variant">暂无讨论，成为第一个回答者</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg p-4"
              style={{ backgroundColor: "var(--surface-low)", border: "1px solid var(--outline-variant)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary">
                  {comment.author ?? "匿名用户"}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => onUpvote(comment.id)}
                  className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                  {comment.upvotes}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

export default DiscussionContent;
