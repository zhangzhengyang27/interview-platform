"use client";

import { forwardRef, ButtonHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: boolean;
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width="16"
      height="16"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      icon = false,
      children,
      style,
      disabled,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const [hovered, setHovered] = useState(false);

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        data-skip-touch-min-height
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer select-none",
          "disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
          // Sizes - rounded corners upgraded
          size === "sm" && !icon && "px-3 py-2 text-sm rounded-lg",
          size === "sm" && icon && "p-2 text-sm rounded-lg",
          size === "md" && !icon && "px-4 py-2.5 text-sm rounded-lg",
          size === "md" && icon && "p-2.5 text-sm rounded-lg",
          size === "lg" && !icon && "px-6 py-3 text-base rounded-xl",
          size === "lg" && icon && "p-3 text-base rounded-xl",
          // Variants
          variant === "primary" &&
            "bg-primary-container text-on-primary-container hover:brightness-110 font-semibold",
          variant === "secondary" &&
            "bg-transparent border border-outline-variant text-on-surface hover:border-outline hover:bg-surface-high/80",
          variant === "ghost" &&
            "bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-high",
          variant === "danger" &&
            "bg-transparent text-error hover:bg-error-container hover:text-on-error",
          // Loading state
          loading && "opacity-70 cursor-wait",
          className
        )}
        style={{
          ...(variant === "primary"
            ? {
                boxShadow: hovered
                  ? "0 0 20px color-mix(in srgb, var(--primary) 25%, transparent), 0 4px 12px color-mix(in srgb, var(--primary) 15%, transparent)"
                  : "0 0 10px color-mix(in srgb, var(--primary) 15%, transparent)",
                ...style,
              }
            : style),
        }}
        onMouseEnter={(e) => {
          setHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setHovered(false);
          onMouseLeave?.(e);
        }}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
