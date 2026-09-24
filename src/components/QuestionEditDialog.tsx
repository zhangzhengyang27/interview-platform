"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"

interface Props {
  open: boolean
  onClose: () => void
  questionId: string
  onSuccess?: () => void
}

export function QuestionEditDialog({ open, onClose, questionId, onSuccess }: Props) {
  const [description, setDescription] = useState("")
  const [reference, setReference] = useState("")
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleSubmit = async () => {
    if (!description.trim() || !reference.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/questions/${questionId}/edits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), reference: reference.trim() }),
      })
      if (res.ok) {
        onSuccess?.()
        onClose()
        setDescription("")
        setReference("")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg rounded-xl shadow-2xl p-6" style={{ backgroundColor: "var(--surface-bright)" }}>
        <h3 className="text-base font-semibold text-on-surface mb-4">提出解析修改建议</h3>
        <textarea
          placeholder="修改说明"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border mb-3 bg-transparent text-sm text-on-surface"
          style={{ borderColor: "var(--outline-variant)" }}
        />
        <textarea
          placeholder="修改后的解析"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 rounded-lg border mb-4 bg-transparent text-sm text-on-surface"
          style={{ borderColor: "var(--outline-variant)" }}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit} disabled={loading || !description.trim() || !reference.trim()}>
            {loading ? "提交中" : "提交建议"}
          </Button>
        </div>
      </div>
    </div>
  )
}
