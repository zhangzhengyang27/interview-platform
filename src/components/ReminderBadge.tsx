"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface ReminderBadgeProps {
  count: number;
  className?: string;
  href?: string;
}

export function ReminderBadge({ count, className, href = "/study-plans?tab=reminders" }: ReminderBadgeProps) {
  if (count === 0) {
    return null;
  }

  const badge = (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold rounded-full",
        "bg-error text-white leading-none",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {badge}
      </Link>
    );
  }

  return badge;
}
