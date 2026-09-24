"use client";

import { useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { triggerGlobalSearch } from "./search-global";
import { LANGUAGE_GROUPS } from "@/app/questions/types";

const NAV_LINKS = [
  { label: "面试宝典", href: "/questions", hasDropdown: true },
  { label: "精选题集", href: "/question-sets" },
  { label: "AI 模拟面试", href: "/ai/mock-interview" },
  { label: "学习路线", href: "/learning-paths" },
  { label: "学习计划", href: "/study-plans" },
  { label: "求职指南", href: "/career" },
  { label: "社区交流", href: "/experiences" },
  { label: "竞赛中心", href: "/contests" },
];

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const isAdmin = user?.role === "admin";
  const [expandedLang, setExpandedLang] = useState(false);

  // ESC 键关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  // 打开时禁止背景滚动；关闭时重置语言子列表展开态
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
    } else {
      setExpandedLang(false);
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  return (
    <>
      {/* 遮罩层 */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* 抽屉面板 */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[280px] max-w-[80vw] bg-surface-bright border-r border-outline-variant transition-transform duration-300 ease-out lg:hidden flex flex-col",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-outline-variant shrink-0">
          <span className="text-lg font-semibold text-primary">面试网</span>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors"
            aria-label="关闭菜单"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 快速操作 */}
        <div className="px-4 py-3 border-b border-outline-variant space-y-2">
          <button
            onClick={() => {
              onClose();
              triggerGlobalSearch();
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors"
            aria-label="搜索题目"
            data-skip-touch-min-height
            data-testid="mobile-search-button"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            搜索题目
          </button>
          <Link
            href="/notifications"
            onClick={onClose}
            data-skip-touch-min-height
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            通知中心
          </Link>
          <Link
            href="/questions/new"
            onClick={onClose}
            data-skip-touch-min-height
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            新增题目
          </Link>
        </div>

        {/* 导航链接 */}
        <nav className="flex-1 overflow-y-auto py-2 mobile-scroll">
          {NAV_LINKS.map((link) =>
            link.hasDropdown ? (
              <div key={link.label}>
                <button
                  onClick={() => setExpandedLang((prev) => !prev)}
                  aria-haspopup="true"
                  aria-expanded={expandedLang}
                  data-skip-touch-min-height
                  className="flex items-center justify-between w-full px-4 py-3.5 text-base font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors"
                >
                  <span>{link.label}</span>
                  <svg
                    className={cn("w-4 h-4 transition-transform", expandedLang && "rotate-180")}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {expandedLang && (
                  <div className="flex flex-col bg-surface-high/40">
                    {LANGUAGE_GROUPS.map((lang) => (
                      <Link
                        key={lang.id}
                        href={`/questions?lang=${lang.id}`}
                        onClick={onClose}
                        data-skip-touch-min-height
                        className="flex items-center gap-2 pl-8 pr-4 py-3 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors"
                      >
                        <span>{lang.icon}</span>
                        {lang.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                onClick={onClose}
                data-skip-touch-min-height
                className="flex items-center px-4 py-3.5 text-base font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors"
              >
                {link.label}
              </Link>
            )
          )}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={onClose}
              data-skip-touch-min-height
              className="flex items-center gap-3 px-4 py-3.5 text-base font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors"
            >
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span>后台管理</span>
            </Link>
          )}
        </nav>

        {/* 底部操作区 */}
        <div className="shrink-0 border-t border-outline-variant p-4 space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm text-on-surface-variant">主题</span>
            <ThemeToggle />
          </div>

          {/* 认证状态区域 */}
          {isAuthenticated ? (
            <div className="pt-3 border-t space-y-2" style={{ borderColor: "var(--outline-variant)" }}>
              <Link
                href="/profile"
                onClick={onClose}
                data-skip-touch-min-height
                className="flex items-center gap-2.5 px-2 py-1 rounded-md hover:bg-surface-high transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ backgroundColor: "var(--primary-container)", color: "var(--on-primary-container)" }}
                >
                  {user?.image ? (
                    <img src={user.image} alt={`${user?.name || '用户'}的头像`} width={32} height={32} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (user?.name || user?.email || "U").charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-sm font-medium truncate" style={{ color: "var(--on-surface)" }}>
                  {user?.name || user?.email || "用户"}
                </span>
              </Link>
              <button
                onClick={() => {
                  onClose();
                  logout();
                }}
                data-skip-touch-min-height
                className="w-full text-left px-4 py-2 text-sm rounded transition-colors cursor-pointer"
                style={{ color: "var(--error)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--error-container)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                退出登录
              </button>
            </div>
          ) : (
            <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid var(--outline-variant)" }}>
              <Link
                href="/login"
                onClick={onClose}
                data-skip-touch-min-height
                className="flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded transition-colors"
                style={{
                  backgroundColor: "var(--primary-container)",
                  color: "var(--on-primary-container)",
                }}
              >
                登录
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                data-skip-touch-min-height
                className="flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded transition-colors"
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid var(--outline-variant)",
                  color: "var(--on-surface)",
                }}
              >
                注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
