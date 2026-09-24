"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Database,
  FolderTree,
  Users,
  ShieldAlert,
  Trophy,
  Route as RouteIcon,
  Layers,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "仪表盘", icon: LayoutDashboard },
  { href: "/admin/questions", label: "题目管理", icon: Database },
  { href: "/admin/question-sets", label: "题集管理", icon: Layers },
  { href: "/admin/categories", label: "分类管理", icon: FolderTree },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/reports", label: "举报管理", icon: ShieldAlert },
  { href: "/admin/contests", label: "竞赛管理", icon: Trophy },
  { href: "/admin/learning-paths", label: "学习路径", icon: RouteIcon },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  // 未登录/非 admin 时显示无权限（middleware 已兜底重定向，这里作双保险）
  if (!isLoading && (!isAuthenticated || !isAdmin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: "var(--surface-high)" }}
        >
          <ShieldAlert className="w-8 h-8" style={{ color: "var(--on-surface-variant)" }} />
        </div>
        <h1 className="text-xl font-semibold mb-2" style={{ color: "var(--on-surface)" }}>
          无权访问后台
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--on-surface-variant)" }}>
          仅管理员账号可访问后台管理
        </p>
        <Link
          href="/"
          className="px-4 py-2 text-sm font-medium rounded-md transition-opacity hover:opacity-90"
          style={{
            color: "var(--on-primary)",
            backgroundColor: "var(--primary)",
          }}
        >
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-56px)] md:block">
      {/* 移动端遮罩 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* 侧栏（桌面 fixed 不随页面滚动，移动端抽屉式） */}
      <aside
        className={cn(
          "fixed top-14 left-0 z-40 w-60 border-r",
          "flex flex-col overflow-y-auto transition-transform md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          height: "calc(100dvh - 56px)",
          backgroundColor: "var(--surface-bright)",
          borderColor: "var(--outline-variant)",
        }}
      >
        {/* 移动端关闭 */}
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          <span className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>
            后台管理
          </span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="关闭菜单"
            className="p-1.5 rounded-md hover:bg-surface-high"
          >
            <X className="h-4 w-4" style={{ color: "var(--on-surface-variant)" }} />
          </button>
        </div>

        {/* 品牌区 */}
        <div className="hidden md:flex items-center gap-3 px-5 py-5 mb-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--tertiary))",
              color: "var(--on-primary)",
            }}
          >
            <LayoutDashboard className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <div
              className="text-sm font-semibold leading-tight"
              style={{
                color: "var(--on-surface)",
                background: "linear-gradient(135deg, var(--primary), var(--tertiary))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              面试网后台
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
              管理控制台
            </div>
          </div>
        </div>

        {/* 分组标题 */}
        <div
          className="hidden md:block px-5 mb-1 text-[11px] font-medium uppercase tracking-wider"
          style={{ color: "var(--on-surface-variant)" }}
        >
          管理
        </div>

        <nav className="flex flex-col gap-0.5 px-3">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={
                  active
                    ? {
                        backgroundColor: "var(--primary-container)",
                        color: "var(--on-primary-container)",
                      }
                    : {
                        color: "var(--on-surface-variant)",
                      }
                }
              >
                <span
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary transition-opacity",
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                  )}
                />
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    !active && "group-hover:text-on-surface"
                  )}
                  style={active ? { color: "var(--on-primary-container)" } : undefined}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* 底部用户信息卡 */}
        {user && (
          <div
            className="mx-3 mb-4 p-3 rounded-xl flex items-center gap-3"
            style={{ backgroundColor: "var(--surface-container)" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--tertiary))",
                color: "var(--on-primary)",
              }}
            >
              {(user.name || user.email || "A").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: "var(--on-surface)" }}>
                {user.name || user.email}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
                管理员
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* 移动端顶部按钮 */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="打开菜单"
        className="fixed bottom-5 right-5 z-30 md:hidden p-3 rounded-full shadow-lg"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--on-primary)",
        }}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* 内容区 */}
      <div
        className="flex-1 min-w-0 p-4 md:p-6 pb-20 md:pb-6 md:pl-[264px]"
        style={{
          background:
            "radial-gradient(1200px 500px at 20% -10%, color-mix(in srgb, var(--primary) 6%, transparent), transparent), var(--surface-low)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
