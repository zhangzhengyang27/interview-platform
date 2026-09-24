"use client";

import { cn } from "@/lib/utils";
import { Difficulty } from "@/types";
import {
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  getTagColor,
} from "@/lib/design-tokens";

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const colors = DIFFICULTY_COLORS[difficulty] ?? {
    bg: "var(--surface-high)",
    text: "var(--on-surface-variant)",
    border: "var(--surface-high)",
  };
  const label = DIFFICULTY_LABELS[difficulty] ?? difficulty;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold font-mono tracking-wide leading-none",
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid color-mix(in srgb, ${colors.border} 60%, transparent)`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      }}
    >
      {label}
    </span>
  );
}

interface TagBadgeProps {
  tag: string;
  className?: string;
}

export function TagBadge({ tag, className }: TagBadgeProps) {
  const colors = getTagColor(tag);
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold font-mono tracking-wide leading-none",
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid color-mix(in srgb, ${colors.border} 60%, transparent)`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      }}
    >
      {tag}
    </span>
  );
}

interface ErrorCountBadgeProps {
  count: number;
  className?: string;
}

export function ErrorCountBadge({ count, className }: ErrorCountBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold leading-none",
        className
      )}
      style={{
        backgroundColor: "var(--error-container)",
        color: "var(--error)",
        border: "1px solid color-mix(in srgb, var(--error) 20%, transparent)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
      }}
    >
      错 {count} 次
    </span>
  );
}
