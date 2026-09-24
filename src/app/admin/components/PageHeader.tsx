import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ title, description, actions, icon }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--primary-container), color-mix(in srgb, var(--primary-container) 60%, var(--surface-bright)))",
              color: "var(--on-primary-container)",
            }}
          >
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--on-surface)" }}>
            {title}
          </h1>
          {description && (
            <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
