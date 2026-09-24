"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";

interface ReportButtonProps {
  targetType: "question" | "comment" | "note";
  targetId: string;
  className?: string;
}

const REASON_OPTIONS = [
  { value: "spam", label: "垃圾广告" },
  { value: "inappropriate", label: "不当内容" },
  { value: "copyright", label: "版权问题" },
  { value: "outdated", label: "错误/过时" },
  { value: "other", label: "其他" },
];

export function ReportButton({ targetType, targetId, className = "" }: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason: selectedReason,
          description: description.trim() || undefined,
        }),
      });

      if (res.status === 409) {
        // 已存在举报
        setErrorMsg("您已经举报过该内容");
        setResult("error");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "提交失败");
      }

      setResult("success");
      setTimeout(() => {
        setShowModal(false);
        resetForm();
      }, 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "提交失败，请重试");
      setResult("error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedReason("");
    setDescription("");
    setResult(null);
    setErrorMsg("");
  };

  const handleClose = () => {
    setShowModal(false);
    setTimeout(resetForm, 200);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-1 transition-colors text-sm text-on-surface-variant hover:text-error hover:bg-error-container rounded px-2 py-1 ${className}`}
        aria-label="举报内容"
        title="举报内容"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 21c0 0 0-5.5 0-9 0-2.5 1.5-4 4-4h10c2.5 0 4 1.5 4 4v9" />
          <path d="M12 8v4" />
          <circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
      </button>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-title"
        >
          <div
            className="w-full max-w-md mx-4 rounded-xl p-6"
            style={{
              backgroundColor: "var(--surface-low)",
              border: "1px solid var(--outline-variant)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 id="report-title" className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>
                举报内容
              </h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors"
                aria-label="关闭"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Success/Error Message */}
            {result === "success" && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg mb-4"
                style={{ backgroundColor: "var(--success-container)", color: "var(--success)" }}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4 12 14.01l-3-3" />
                </svg>
                <span className="text-sm font-medium">举报已提交，感谢您的反馈</span>
              </div>
            )}

            {result === "error" && errorMsg && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg mb-4"
                style={{ backgroundColor: "var(--error-container)", color: "var(--error)" }}
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <circle cx="12" cy="16" r="0.5" fill="currentColor" />
                </svg>
                <span className="text-sm">{errorMsg}</span>
              </div>
            )}

            {!result && (
              <>
                {/* Reason Selection */}
                <div className="mb-4">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--on-surface-variant)" }}
                    htmlFor="report-reason"
                  >
                    举报理由 *
                  </label>
                  <Select
                    id="report-reason"
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="cursor-pointer"
                  >
                    <option value="">请选择举报理由</option>
                    {REASON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: "var(--on-surface-variant)" }}
                    htmlFor="report-desc"
                  >
                    详细说明（可选）
                  </label>
                  <textarea
                    id="report-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="请提供更多细节帮助我们处理..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-md text-sm outline-none transition-colors resize-none"
                    style={{
                      backgroundColor: "var(--surface-high)",
                      color: "var(--on-surface)",
                      border: "1px solid var(--outline-variant)",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--outline-variant)")}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleClose}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                    style={{
                      color: "var(--on-surface-variant)",
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "var(--surface-high)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedReason || submitting}
                    className="px-4 py-2 text-sm font-semibold rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: "var(--error)",
                      color: "var(--on-error)",
                    }}
                    onMouseEnter={(e) =>
                      !selectedReason || submitting
                        ? undefined
                        : (e.currentTarget.style.filter = "brightness(1.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.filter = "")
                    }
                  >
                    {submitting ? "提交中..." : "提交举报"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
