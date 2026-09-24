"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-success" />,
  error: <XCircle className="h-5 w-5 text-error" />,
  info: <Info className="h-5 w-5 text-primary" />,
};

const BORDER: Record<ToastType, string> = {
  success: "border-l-success",
  error: "border-l-error",
  info: "border-l-primary",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => remove(id), 3200);
    },
    [remove]
  );

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, "success"),
    error: (m) => show(m, "error"),
    info: (m) => show(m, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(92vw,360px)] pointer-events-none">
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const [enter, setEnter] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setEnter(true));
    return () => cancelAnimationFrame(r);
  }, []);

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-2.5 rounded-lg border border-l-4 bg-surface-bright px-4 py-3 shadow-lg transition-all duration-300",
        BORDER[item.type],
        enter ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      )}
      role="status"
    >
      <span className="mt-0.5 shrink-0">{ICONS[item.type]}</span>
      <p className="flex-1 text-sm leading-snug" style={{ color: "var(--on-surface)" }}>
        {item.message}
      </p>
      <button
        type="button"
        onClick={onClose}
        aria-label="关闭"
        className="shrink-0 text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // 兜底：未包裹 Provider 时不报错，仅空操作
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}
