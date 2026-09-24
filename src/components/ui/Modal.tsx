"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number | string;
  className?: string;
  closeOnMask?: boolean;
  /** 隐藏右上角关闭按钮 */
  hideClose?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 560,
  className,
  closeOnMask = true,
  hideClose = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : undefined}
    >
      {/* 遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => closeOnMask && onClose()}
      />

      {/* 居中容器：始终垂直居中，内容过高时可滚动且顶部不被裁切 */}
      <div className="min-h-full flex items-center justify-center p-4 md:p-8">
        {/* 面板 */}
        <div
          className="relative w-full rounded-xl border border-outline-variant bg-surface-bright shadow-2xl"
          style={{ maxWidth: width }}
        >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <h3
            className="text-base font-semibold truncate"
            style={{ color: "var(--on-surface)" }}
          >
            {title}
          </h3>
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="p-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 内容 */}
        <div className={cn("px-5 py-4 max-h-[70vh] overflow-y-auto", className)}>
          {children}
        </div>

        {/* 底部 */}
        {footer !== undefined && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-outline-variant">
            {footer}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

/** 便捷的确认对话框 footer 生成 */
export function modalFooter(
  onCancel: () => void,
  onOk: () => void,
  okText = "确定",
  okLoading = false
): ReactNode {
  return (
    <>
      <Button variant="secondary" onClick={onCancel}>
        取消
      </Button>
      <Button onClick={onOk} loading={okLoading}>
        {okText}
      </Button>
    </>
  );
}
