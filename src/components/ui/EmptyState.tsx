"use client";

import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: "var(--surface-high)" }}
      >
        {icon ?? <Inbox className="w-5 h-5" style={{ color: "var(--on-surface-variant)" }} aria-hidden />}
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: "var(--on-surface)" }}>
        {title}
      </p>
      {description && (
        <p className="text-sm mb-4" style={{ color: "var(--on-surface-variant)" }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
