"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--background)" }}>
      <div className="max-w-md w-full text-center space-y-6">
        {/* 404 Icon */}
        <div
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--info-container)" }}
        >
          <svg
            className="w-10 h-10"
            style={{ color: "var(--info)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* 404 Message */}
        <div className="space-y-2" role="alert">
          <h1
            className="text-6xl font-bold"
            style={{ color: "var(--primary)" }}
          >
            404
          </h1>
          <h2
            className="text-2xl font-semibold"
            style={{ color: "var(--on-background)" }}
          >
            页面未找到
          </h2>
          <p style={{ color: "var(--on-surface-variant)" }}>
            您访问的页面不存在或已被移除。
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--on-primary)",
            }}
          >
            返回首页
          </Link>
          <Link
            href="/questions"
            className="px-6 py-2.5 rounded-lg font-medium transition-colors border"
            style={{
              borderColor: "var(--outline)",
              color: "var(--on-surface)",
            }}
          >
            浏览题库
          </Link>
        </div>

        {/* Help Text */}
        <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
          如果您认为这是一个错误，请联系技术支持。
        </p>
      </div>
    </div>
  );
}
