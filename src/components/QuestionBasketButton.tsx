"use client"

import { useState } from "react"
import { QuestionBasketDrawer } from "./QuestionBasketDrawer"

interface Props {
  count: number
}

export function QuestionBasketButton({ count }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        题集
        {count > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-primary text-on-primary text-[10px] flex items-center justify-center">
            {count}
          </span>
        )}
      </button>
      <QuestionBasketDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
