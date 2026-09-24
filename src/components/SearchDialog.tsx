"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
      setQuery("");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

      {/* Dialog */}
      <div
        className="relative w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <form onSubmit={handleSubmit} className="flex items-center border-b" style={{ borderColor: "var(--outline-variant)" }}>
          <svg className="w-5 h-5 ml-4 text-on-surface-variant" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            className="flex-1 px-3 py-4 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
            placeholder="搜索题目、题解、笔记..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="mr-4 px-2 py-0.5 text-[10px] rounded text-on-surface-variant" style={{ backgroundColor: "var(--surface-container)" }}>
            ESC
          </kbd>
        </form>
        <div className="p-3 text-xs text-on-surface-variant">
          按 Enter 搜索，Esc 关闭
        </div>
      </div>
    </div>
  );
}
