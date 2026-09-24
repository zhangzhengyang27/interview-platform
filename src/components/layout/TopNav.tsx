"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { MobileDrawer } from "./MobileDrawer";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/hooks/useAuth";
import { LANGUAGE_GROUPS } from "@/app/questions/types";

import { triggerGlobalSearch } from "./search-global";

interface TopNavProps {
  activeLabel?: string;
  className?: string;
}

const NAV_LINKS = [
  { label: "面试宝典", href: "/questions", tour: "questions", hasDropdown: true },
  { label: "精选题集", href: "/question-sets" },
  { label: "AI 模拟面试", href: "/ai/mock-interview" },
  { label: "学习路线", href: "/learning-paths" },
  { label: "学习计划", href: "/study-plans", tour: "study-plans" },
  { label: "试卷中心", href: "/test-papers", tour: "test-papers" },
  { label: "求职指南", href: "/career" },
  { label: "社区交流", href: "/experiences" },
  { label: "竞赛中心", href: "/contests" },
];

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function QuestionsDropdown({
  link,
  isActive,
}: {
  link: { label: string; href: string; tour?: string };
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative h-full"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        data-tour={link.tour}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "relative flex items-center h-full gap-1 px-4 text-sm font-medium transition-all duration-200 rounded whitespace-nowrap",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          isActive
            ? "text-primary font-semibold"
            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
        )}
      >
        {link.label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          aria-hidden
        />
        {isActive && (
          <span
            className="absolute bottom-0 left-2 right-2 rounded-full"
            style={{
              background: "linear-gradient(90deg, var(--primary), var(--tertiary))",
              height: "2px",
            }}
          />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full pt-1" role="menu">
          <div className="min-w-45 rounded-lg border border-outline-variant bg-surface-bright p-1 shadow-lg shadow-black/10">
            {LANGUAGE_GROUPS.map((lang) => (
              <Link
                key={lang.id}
                href={lang.id === "all" ? "/questions" : `/questions?lang=${lang.id}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-on-surface transition-colors hover:bg-primary/12"
              >
                <span className="text-base">{lang.icon}</span>
                <span className="flex-1 whitespace-nowrap">{lang.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TopNav({ activeLabel, className }: TopNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // 获取未读通知数
  const { data } = useSWR<{ unreadCount?: number }>(
    "/api/notifications?unreadOnly=true&page=1",
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 30000,
      onError: () => {}, // 静默处理未登录等错误
    }
  );
  const unreadCount = data?.unreadCount ?? 0;

  // 根据当前路由自动匹配导航项
  const resolvedActiveLabel =
    activeLabel ??
    NAV_LINKS.find((link) => {
      if (link.href === "/") return pathname === "/";
      return pathname.startsWith(link.href);
    })?.label;

  // 后台管理路由：渲染简化顶栏，避免前台导航干扰
  if (pathname.startsWith("/admin")) {
    return (
      <nav
        className="fixed top-0 left-0 w-full z-50 flex items-center px-4 lg:px-8 transition-all duration-200"
        style={{
          height: 56,
          backgroundColor: "var(--surface-bright)",
          borderBottom: "1px solid var(--outline-variant)",
        }}
        role="navigation"
        aria-label="后台顶栏"
      >
        <Link
          href="/admin/dashboard"
          className="text-lg font-semibold tracking-tight leading-none mr-4 flex-shrink-0"
          style={{
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, var(--primary), var(--tertiary))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          面试网后台
        </Link>
        <div className="flex-1" />
        <Link
          href="/"
          className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          style={{ color: "var(--on-surface-variant)", backgroundColor: "var(--surface-high)" }}
        >
          返回前台
        </Link>
        <div className="ml-2">
          <ThemeToggle />
        </div>
        <div className="ml-1">
          <UserMenu />
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Skip Navigation - 无障碍访问：键盘用户快速跳转到主要内容 */}
      <a href="#main-content" className="skip-nav">
        跳转到主要内容
      </a>

      <nav
        className={cn(
          "fixed top-0 left-0 w-full z-50 flex items-center h-nav-height px-4 lg:px-margin-desktop",
          "bg-surface-bright border-b border-outline-variant transition-all duration-200",
          className
        )}
        style={{ height: 56 }}
        role="navigation"
        aria-label="主导航"
      >
        {/* Logo */}
        <Link
          href="/"
          className="text-xl lg:text-[32px] font-semibold tracking-tight leading-none mr-3 lg:mr-8 flex-shrink-0"
          style={{
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, var(--primary), var(--tertiary))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          面试网
        </Link>

        {/* 桌面端导航链接 — lg 以上显示 */}
        <div className="hidden lg:flex items-center h-full gap-1 flex-shrink-0">
          {NAV_LINKS.map((link) => {
            const isActive = resolvedActiveLabel === link.label;
            if (link.hasDropdown) {
              return <QuestionsDropdown key={link.label} link={link} isActive={isActive} />;
            }
            return (
              <Link
                key={link.label}
                href={link.href}
                data-tour={link.tour}
                className={cn(
                  "relative flex items-center h-full px-4 text-sm font-medium transition-all duration-200 rounded whitespace-nowrap",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
                )}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-2 right-2 rounded-full"
                    style={{
                      background: "linear-gradient(90deg, var(--primary), var(--tertiary))",
                      height: "2px",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* 桌面端操作区 — lg 以上显示 */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          {/* 全局搜索按钮（题搜 + 面经 + 计划） */}
          <button
            type="button"
            onClick={triggerGlobalSearch}
            data-tour="search"
            className="flex items-center gap-2 px-3 py-1.5 bg-surface-highest border border-outline-variant rounded text-sm text-on-surface-variant hover:text-on-surface hover:border-outline transition-all cursor-pointer focus:ring-2 focus:ring-primary/30 focus:outline-none"
            aria-label="搜索题目、面经、学习计划"
          >
            <svg className="w-4 h-4 transition-transform duration-300 hover:rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span className="max-w-[120px] truncate">搜索题目、面经...</span>
            <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono border border-outline-variant rounded">
              ⌘K
            </kbd>
          </button>
          <Link
            href="/questions/new"
            className="group btn-add-glow flex items-center gap-1.5 px-4 py-1.5 text-on-primary-container text-sm font-semibold rounded whitespace-nowrap transition-all"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--tertiary))",
              boxShadow: "0 0 10px color-mix(in srgb, var(--primary) 15%, transparent)",
            }}
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            新增题目
          </Link>
          <Link
            href="/notifications"
            className="relative p-2 text-on-surface-variant hover:text-primary hover:bg-surface-high rounded transition-colors flex-shrink-0"
            aria-label={unreadCount > 0 ? `通知，${unreadCount} 条未读` : "通知"}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span
                className={cn(
                  "absolute top-0.5 right-0.5 flex items-center justify-center",
                  "min-w-[18px] h-[18px] px-1 rounded-full",
                  "bg-error text-white text-[10px] font-bold leading-none",
                  "animate-in fade-in zoom-in duration-200",
                  "badge-pulse"
                )}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="relative p-2 text-on-surface-variant hover:text-primary hover:bg-surface-high rounded transition-colors flex-shrink-0"
              aria-label="后台管理"
              title="后台管理"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </Link>
          )}
          <ThemeToggle />
          <UserMenu />
        </div>

        {/* 移动端/平板汉堡菜单按钮 — lg 以下显示 */}
        <button
          className="lg:hidden hamburger-btn w-11 h-11 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors -mr-1 flex-shrink-0"
          onClick={() => setDrawerOpen(true)}
          aria-label="打开菜单"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
      </nav>

      {/* 移动端侧滑抽屉 */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
