"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ backgroundColor: "var(--background)" }}
        >
          <div className="max-w-md w-full text-center space-y-6">
            {/* Critical Error Icon */}
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--error-container)" }}
            >
              <svg
                className="w-10 h-10"
                style={{ color: "var(--error)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <div className="space-y-2" role="alert">
              <h1
                className="text-2xl font-semibold"
                style={{ color: "var(--on-background)" }}
              >
                严重错误
              </h1>
              <p style={{ color: "var(--on-surface-variant)" }}>
                应用程序发生了严重错误，需要刷新页面。
              </p>
            </div>

            {/* Error Details (dev only) */}
            {process.env.NODE_ENV === "development" && (
              <details className="text-left">
                <summary
                  className="cursor-pointer text-sm font-mono py-2 px-3 rounded"
                  style={{
                    color: "var(--on-surface-variant)",
                    backgroundColor: "var(--surface-container)",
                  }}
                >
                  错误详情
                </summary>
                <pre
                  className="mt-2 p-3 rounded text-xs overflow-auto font-mono"
                  style={{
                    backgroundColor: "var(--surface-lowest)",
                    color: "var(--on-surface)",
                  }}
                >
                  {error.message}
                  {error.stack && (
                    <code
                      className="block mt-2 pt-2 border-t"
                      style={{ borderColor: "var(--surface-variant)" }}
                    >
                      {error.stack}
                    </code>
                  )}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="px-6 py-2.5 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--on-primary)",
                }}
              >
                刷新页面
              </button>
              <a
                href="/"
                className="px-6 py-2.5 rounded-lg font-medium transition-colors border"
                style={{
                  borderColor: "var(--outline)",
                  color: "var(--on-surface)",
                }}
              >
                返回首页
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
