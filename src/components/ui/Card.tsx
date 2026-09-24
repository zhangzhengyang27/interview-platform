"use client";

import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "default" | "elevated" | "glass";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  variant?: CardVariant;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable, variant = "default", children, style, onMouseEnter, onMouseLeave, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base
          "rounded-xl",
          // Variant: default
          variant === "default" &&
            "bg-surface-low border border-outline-variant",
          // Variant: elevated - stronger shadow, no border
          variant === "elevated" &&
            "bg-surface-low shadow-lg shadow-black/[0.08]",
          // Variant: glass - frosted glass
          variant === "glass" &&
            "bg-surface-low/60 backdrop-blur-xl border border-outline-variant/50",
          // Hoverable
          hoverable &&
            "transition-all duration-200 cursor-pointer active:scale-[0.99]",
          className
        )}
        style={{
          ...(hoverable && variant === "default"
            ? {
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
              }
            : {}),
          ...(hoverable && variant === "elevated"
            ? {
                boxShadow: "0 4px 16px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.08)",
              }
            : {}),
          ...(hoverable && variant === "glass"
            ? {
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              }
            : {}),
          ...style,
        }}
        onMouseEnter={(e) => {
          if (hoverable) {
            if (variant === "default") {
              e.currentTarget.style.boxShadow =
                "0 4px 16px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06)";
              e.currentTarget.style.transform = "translateY(-2px)";
            } else if (variant === "elevated") {
              e.currentTarget.style.boxShadow =
                "0 8px 32px rgba(0,0,0,0.14), 0 16px 48px rgba(0,0,0,0.1)";
              e.currentTarget.style.transform = "translateY(-4px)";
            } else if (variant === "glass") {
              e.currentTarget.style.boxShadow =
                "0 8px 32px rgba(0,0,0,0.1)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }
          }
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          if (hoverable) {
            if (variant === "default") {
              e.currentTarget.style.boxShadow =
                "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)";
            } else if (variant === "elevated") {
              e.currentTarget.style.boxShadow =
                "0 4px 16px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.08)";
            } else if (variant === "glass") {
              e.currentTarget.style.boxShadow =
                "0 4px 24px rgba(0,0,0,0.06)";
            }
            e.currentTarget.style.transform = "";
          }
          onMouseLeave?.(e);
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";
