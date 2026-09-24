"use client"

import { useState, useEffect, useCallback } from "react"

interface BasketItem {
  id: string
  title: string
  type: string
}

const STORAGE_KEY = "interview_question_basket"

export function useQuestionBasket() {
  const [items, setItems] = useState<BasketItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [])

  const add = useCallback(
    (item: BasketItem) => {
      setItems((prev) => {
        const next = prev.some((i) => i.id === item.id) ? prev : [...prev, item]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    },
    []
  )

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    },
    []
  )

  const clear = useCallback(() => {
    setItems([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const contains = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  )

  return { items, add, remove, clear, contains, count: items.length }
}
