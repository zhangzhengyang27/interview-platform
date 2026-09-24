"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // 未登录状态
  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-container text-on-primary-container text-sm font-semibold rounded hover:brightness-110 transition-all whitespace-nowrap"
        style={{ boxShadow: "0 0 10px color-mix(in srgb, var(--primary) 15%, transparent)" }}
      >
        登录
      </Link>
    );
  }

  // 已登录状态
  const displayName = user?.name || user?.email || "用户";
  const initial = (displayName.charAt(0) || "U").toUpperCase();
  const avatarUrl = user?.image;

  return (
    <div ref={menuRef} className="relative">
      {/* 头像按钮 */}
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 hover:ring-2 focus:outline-none cursor-pointer flex-shrink-0"
        style={{
          backgroundColor: avatarUrl ? "transparent" : "var(--primary-container)",
          color: "var(--on-primary-container)",
        }}
        aria-label="打开用户菜单"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            width={32}
            height={32}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          initial
        )}
      </button>

      {/* 下拉菜单 */}
      <div
        className={cn(
          "absolute right-0 top-full mt-2 w-56 rounded-lg shadow-lg border overflow-hidden transition-all duration-200 z-50",
          open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        )}
        style={{
          backgroundColor: "var(--surface-bright)",
          borderColor: "var(--outline-variant)",
        }}
      >
        {/* 用户信息 */}
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--outline-variant)" }}>
          <p className="text-sm font-semibold truncate" style={{ color: "var(--on-surface)" }}>
            {displayName}
          </p>
          <p className="text-xs truncate mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
            {user?.email}
          </p>
        </div>

        {/* 菜单项 */}
        <div className="py-1.5">
          {user?.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
              style={{ color: "var(--primary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-high)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              后台管理
            </Link>
          )}
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
            style={{ color: "var(--on-surface)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-high)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            个人资料
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
            style={{ color: "var(--on-surface)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-high)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            设置
          </Link>
        </div>

        {/* 分隔线 + 退出按钮 */}
        <div className="border-t pt-1.5" style={{ borderColor: "var(--outline-variant)" }}>
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer"
            style={{ color: "var(--error)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--error-container)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
