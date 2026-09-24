"use client";

import { forwardRef, useState, InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const inputBase =
  "w-full bg-surface-highest border border-outline-variant text-on-surface text-sm rounded focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/50";

export interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** 是否显示错误状态 */
  error?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, disabled, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          disabled={disabled}
          className={cn(
            inputBase,
            "px-4 py-2 pr-11",
            error && "border-error focus:border-error",
            disabled && "opacity-60 cursor-not-allowed",
            className
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? "隐藏密码" : "显示密码"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors disabled:cursor-not-allowed"
        >
          {visible ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
