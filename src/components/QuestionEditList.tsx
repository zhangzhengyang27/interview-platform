"use client"

import { useState } from "react"
import { MarkdownRenderer } from "./MarkdownRenderer"

interface Edit {
  id: string
  description: string
  reference: string
  status: "pending" | "approved" | "rejected"
  reviewMessage: string | null
  createdAt: string
  user: { name: string | null }
}

interface Props {
  edits: Edit[]
  isAdmin?: boolean
  onReview?: (id: string, status: "approved" | "rejected") => void
}

export function QuestionEditList({ edits, isAdmin, onReview }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (edits.length === 0) return null

  const statusClass: Record<string, string> = {
    pending: "bg-warning-container text-warning",
    approved: "bg-success-container text-success",
    rejected: "bg-error-container text-error",
  }

  return (
    <div className="space-y-3">
      {edits.map((edit) => (
        <div key={edit.id} className="p-3 rounded-xl border" style={{ borderColor: "var(--outline-variant)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-on-surface">{edit.user.name ?? "匿名用户"}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass[edit.status]}`}>
              {edit.status === "pending" ? "待审核" : edit.status === "approved" ? "已通过" : "已拒绝"}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mb-2">{edit.description}</p>
          <button
            onClick={() => setExpanded(expanded === edit.id ? null : edit.id)}
            className="text-xs text-primary hover:underline"
          >
            {expanded === edit.id ? "收起" : "查看建议解析"}
          </button>
          {expanded === edit.id && (
            <div className="mt-2 p-3 rounded-lg text-sm" style={{ backgroundColor: "var(--surface-high)" }}>
              <MarkdownRenderer content={edit.reference} />
              {edit.reviewMessage && <p className="mt-2 text-xs text-on-surface-variant">审核意见：{edit.reviewMessage}</p>}
            </div>
          )}
          {isAdmin && edit.status === "pending" && onReview && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onReview(edit.id, "approved")}
                className="text-xs px-2 py-1 rounded bg-success text-on-success"
              >
                通过
              </button>
              <button
                onClick={() => onReview(edit.id, "rejected")}
                className="text-xs px-2 py-1 rounded bg-error text-on-error"
              >
                拒绝
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
