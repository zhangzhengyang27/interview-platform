"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuestionBasket } from "@/hooks/useQuestionBasket"
import { Button } from "@/components/ui/Button"

interface Props {
  open: boolean
  onClose: () => void
}

export function QuestionBasketDrawer({ open, onClose }: Props) {
  const { items, remove, clear } = useQuestionBasket()
  const [title, setTitle] = useState("")
  const [creating, setCreating] = useState(false)

  if (!open) return null

  const handleCreate = async () => {
    if (items.length === 0 || !title.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/test-papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), questionIds: items.map((i) => i.id) })
      })
      if (res.ok) {
        const data = await res.json()
        clear()
        onClose()
        window.location.href = `/test-papers/${data.id}`
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100]"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="absolute right-0 top-0 bottom-0 w-full max-w-md shadow-2xl flex flex-col"
        style={{ backgroundColor: "var(--surface-bright)" }}>
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: "var(--outline-variant)" }}>
          <h3 className="text-base font-semibold text-on-surface">题集 ({items.length})</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 && (
            <p className="text-sm text-on-surface-variant text-center py-8">
              题集为空，去题目列表添加题目。
            </p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: "var(--surface-high)" }}>
              <Link
                href={`/questions/${item.id}`}
                className="text-sm text-on-surface hover:text-primary truncate flex-1">
                {item.title}
              </Link>
              <button onClick={() => remove(item.id)} className="text-xs text-error px-2">
                删除
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t space-y-3" style={{ borderColor: "var(--outline-variant)" }}>
          <input
            type="text"
            placeholder="试卷标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border bg-transparent text-sm text-on-surface"
            style={{ borderColor: "var(--outline-variant)" }}
          />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={clear}
              disabled={items.length === 0}>
              清空
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={creating || items.length === 0 || !title.trim()}>
              {creating ? "组卷中" : "生成试卷"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
