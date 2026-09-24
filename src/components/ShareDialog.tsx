"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  type: string;
  targetId: string;
}

const SOCIAL_SHARES = [
  {
    name: "微博",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10.098 20c-4.612 0-9.098-2.044-9.098-5.732 0-1.883 1.004-3.951 2.728-5.752 2.297-2.401 4.97-3.494 6.194-2.44.456.386.68.96.68 1.62-.001.35-.056.73-.164 1.13l-.032.115.112-.04c.464-.162.89-.238 1.27-.238 1.06 0 1.69.63 1.69 1.65 0 .26-.038.54-.114.83l-.027.103.102-.02c.29-.056.55-.084.78-.084 1.07 0 1.61.56 1.61 1.53 0 .22-.03.46-.09.72l-.025.11.108-.015c.21-.03.41-.045.59-.045 1.12 0 1.71.67 1.71 1.66 0 2.42-3.486 4.908-8.315 4.908zm-.396-9.47c-2.316.14-4.305 1.64-4.442 3.347-.137 1.708 1.608 2.98 3.924 2.84 2.317-.138 4.306-1.638 4.443-3.346.137-1.707-1.608-2.98-3.925-2.84zM20 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
      </svg>
    ),
    getUrl: (url: string, title: string) =>
      `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    color: "#E6162D",
  },
  {
    name: "Twitter",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    getUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    color: "#000000",
  },
];

export function ShareDialog({ open, onClose, type, targetId }: ShareDialogProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const generateLink = useCallback(async () => {
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, targetId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "生成失败" }));
        throw new Error(err.error ?? "生成失败");
      }
      const data = await res.json();
      setShareUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成链接失败");
    } finally {
      setLoading(false);
    }
  }, [type, targetId]);

  useEffect(() => {
    if (open && type && targetId) {
      generateLink();
    }
  }, [open, type, targetId, generateLink]);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSocialShare = (social: typeof SOCIAL_SHARES[0]) => {
    const title =
      type === "question"
        ? "来看看这道面试题"
        : type === "note"
          ? "来查看这篇面经笔记"
          : "分享自面试网";
    window.open(social.getUrl(shareUrl, title), "_blank", "noopener,noreferrer,width=600,height=400");
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        style={{ animation: "fadeIn 0.15s ease-out" }}
      />

      {/* 弹窗内容 */}
      <div
        className="relative w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--surface-bright)",
          animation: "slideUp 0.2s ease-out",
        }}
      >
        {/* 头部 */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--outline-variant)" }}
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <h3 className="text-base font-semibold text-on-surface">分享</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区 */}
        <div className="px-6 py-5 space-y-5">
          {/* 加载状态 */}
          {loading && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-on-surface-variant">正在生成分享链接...</span>
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg text-sm text-error"
              style={{ backgroundColor: "var(--error-container)" }}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
              <button
                onClick={generateLink}
                className="ml-auto text-xs font-medium underline hover:no-underline"
              >
                重试
              </button>
            </div>
          )}

          {/* 链接 + 复制 */}
          {!loading && !error && shareUrl && (
            <>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-2">
                  分享链接
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-mono bg-surface-low border border-outline-variant text-on-surface outline-none focus:border-primary transition-colors truncate"
                  />
                  <Button
                    variant={copied ? "secondary" : "primary"}
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        已复制
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        复制
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* 社交分享按钮 */}
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-2">
                  分享到
                </label>
                <div className="flex gap-3">
                  {SOCIAL_SHARES.map((social) => (
                    <button
                      key={social.name}
                      onClick={() => handleSocialShare(social)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all hover:scale-105 active:scale-95"
                      style={{
                        backgroundColor: `${social.color}10`,
                        color: social.color,
                      }}
                    >
                      {social.icon}
                      <span className="text-[11px] font-medium">{social.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 底部提示 */}
        <div
          className="px-6 py-3 border-t text-center"
          style={{
            backgroundColor: "var(--surface-container)",
            borderColor: "var(--outline-variant)",
          }}
        >
          <span className="text-[11px] text-on-surface-variant">
            链接有效期为 30 天
          </span>
        </div>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
