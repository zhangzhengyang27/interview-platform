"use client";

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  current: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressRing({
  current,
  total,
  size = 160,
  strokeWidth = 6,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / total, 1);
  const dashOffset = circumference * (1 - progress);

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={`已完成 ${current} / ${total}`}
    >
      <svg width={size} height={size} className="transform -rotate-90" aria-hidden="true">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-highest)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
        <span
          className="text-3xl font-semibold text-on-surface"
          style={{ letterSpacing: "-0.02em" }}
        >
          {current}
          <span className="text-xl text-on-surface-variant">/{total}</span>
        </span>
        <span
          className="text-[11px] font-mono font-semibold tracking-widest text-on-surface-variant uppercase mt-1"
        >
          Completed
        </span>
      </div>
    </div>
  );
}
