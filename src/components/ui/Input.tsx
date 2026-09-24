"use client";

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const inputBase =
  "w-full bg-surface-highest border border-outline-variant text-on-surface text-sm rounded focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/50";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 是否显示错误状态 */
  error?: boolean;
  /** 输入框下方的辅助说明文本 */
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, hint, ...props }, ref) => (
    <div>
      <input
        ref={ref}
        className={cn(
          inputBase,
          "px-4 py-2",
          error && "border-error focus:border-error",
          className
        )}
        {...props}
      />
      {hint && (
        <p className="text-xs mt-1.5" style={{ color: "var(--on-surface-variant)" }}>
          {hint}
        </p>
      )}
    </div>
  )
);
Input.displayName = "Input";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 是否显示错误状态 */
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        inputBase,
        "px-4 py-3 resize-y min-h-[120px]",
        error && "border-error focus:border-error",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

/** 表单验证错误提示文本 */
export function FormError({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs text-error mt-1", className)}
      role="alert"
      {...props}
    >
      {children}
    </p>
  );
}
