"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "interview_search_history"
const MAX_HISTORY = 10

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        // 类型校验：确保是字符串数组
        if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
          setHistory(parsed)
        }
      }
    } catch {}
  }, [])

  const add = useCallback((term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return
    setHistory((prev) => {
      const next = [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
    fetch("/api/search-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed }),
    }).catch(() => {})
  }, [])

  const remove = useCallback((term: string) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h !== term)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { history, add, remove, clear }
}
