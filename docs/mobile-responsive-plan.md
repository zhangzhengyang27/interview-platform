# 移动端响应式适配实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为面试网平台实现完整的移动端响应式适配，覆盖全部页面和 UI 组件，支持手机（≤767px）和平板（768px-1024px）设备。

**Architecture:** 采用 Mobile-First 策略，默认样式面向手机端编写，通过 Tailwind 的 `md:` / `lg:` 断点前缀逐级增强桌面端布局。核心改造包括：新增 MobileDrawer 侧滑抽屉组件替代移动端导航、各页面从多栏/分屏布局重构为单列堆叠或 Tab 切换模式、全局触摸优化和间距系统适配。

**Tech Stack:** Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + TypeScript + 现有设计系统（CSS Variables + @theme inline）

**Design Spec:** [docs/mobile-responsive-design.md](../mobile-responsive-design.md)

---

## 文件结构总览

### 新建文件
| 文件 | 职责 |
|------|------|
| `src/components/layout/MobileDrawer.tsx` | 移动端侧滑抽屉菜单组件 |

### 修改文件
| 文件 | 改动范围 |
|------|---------|
| `src/app/layout.tsx` | 添加 viewport metadata |
| `src/app/globals.css` | 新增移动端基础规则（安全区域、触摸优化等） |
| `src/components/layout/TopNav.tsx` | 移动端显示汉堡按钮 + Drawer 控制 |
| `src/app/page.tsx` | Dashboard 全部区域 mobile-first 重构 |
| `src/app/questions/page.tsx` | 题目列表：Tab 栏横向滚动 + 侧边栏变筛选面板 |
| `src/app/questions/[id]/page.tsx` | 题目详情：分屏→垂直堆叠+底部Tab |
| `src/app/ai/page.tsx` | AI 对话：输入框底部固定 + 键盘适配 |
| `src/app/ai/mock-interview/page.tsx` | 模拟面试：方向卡片网格 + 聊天区适配 |
| `src/app/study-plans/page.tsx` | 学习计划列表：Modal/卡片适配 |
| `src/app/study-plans/[id]/page.tsx` | 计划详情：日历/列表单列化 |
| `src/app/experiences/page.tsx` | 面经笔记：三栏→两层跳转模式 |
| `src/app/questions/new/page.tsx` | 新增题目：表单单列化 |
| `src/app/questions/ai-generate/page.tsx` | AI 出题：参数区堆叠 |
| `src/components/ui/Card.tsx` | 默认 padding 响应式调整 |
| `src/components/ui/Button.tsx` | 触摸最小高度保证 |
| `src/components/ui/Input.tsx` | 全宽 + iOS font-size 修复 |
| `src/components/CodeEditor.tsx` | 全宽容器 + 最小高度 |
| `src/components/MarkdownRenderer.tsx` | 表格横向滚动 + 响应式字体 |
| `src/components/ui/ProgressRing.tsx` | 尺寸响应式 |

---

## Phase 1: 基础框架

### Task 1: 添加 Viewport Meta 标签

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 在 metadata 中添加 viewport 配置**

在 `src/app/layout.tsx` 的 `metadata` 对象中添加 viewport 配置：

```tsx
export const metadata: Metadata = {
  title: "面试网 - 程序员面试刷题平台",
  description: "一站式管理题库 / 刷题练习 / 面经笔记 / AI 搜索",
  icons: {
    icon: "/favicon.ico",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};
```

- [ ] **Step 2: 验证改动**

Run: `pnpm dev` 启动后检查 `<head>` 中是否包含 `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`

Expected: viewport meta 标签正确渲染

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(mobile): add viewport meta tag for responsive layout"
```

---

### Task 2: globals.css 移动端基础规则

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: 在 globals.css 末尾添加 Mobile-First 基础规则块**

在文件末尾（`nav, main > div` transition 规则之后）追加：

```css
/* ============================================================
   Mobile-First Responsive Base
   ============================================================ */

/* 安全区域适配（刘海屏/底部指示器） */
@supports (padding: env(safe-area-inset-top)) {
  body {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
}

/* 触摸优化：取消 300ms 点击延迟 */
a, button, [role="button"], input, select, textarea {
  touch-action: manipulation;
}

/* 防止 iOS 自动缩放输入框 */
input, textarea, select {
  font-size: 16px;
}

/* 移动端滚动容器统一 */
.mobile-scroll {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* 仅在支持 hover 的设备上启用 hover 特效（触屏不触发） */
@media (hover: hover) and (pointer: fine) {
  .hover-lift:hover {
    transform: translateY(-2px);
  }
  .hover-glow:hover {
    box-shadow: 0 0 10px color-mix(in srgb, var(--primary) 15%, transparent);
  }
}
```

同时在 `@theme inline` 块中确认已有 `--spacing-margin-mobile: 16px;` 和 `--spacing-margin-desktop: 24px;`（已存在，无需修改）。

- [ ] **Step 2: 验证**

Run: `pnpm dev`，在浏览器 DevTools 中切换到 iPhone SE 视图，检查：
- body 有安全区域 padding（模拟刘海屏时可见）
- 触摸操作无延迟

Expected: 规则生效无报错

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(mobile): add safe-area, touch-optimization and hover-guard base rules"
```

---

### Task 3: 创建 MobileDrawer 组件

**Files:**
- Create: `src/components/layout/MobileDrawer.tsx`

- [ ] **Step 1: 创建 MobileDrawer 组件**

```tsx
"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const NAV_LINKS = [
  { label: "面试宝典", href: "/questions" },
  { label: "AI 出题", href: "/questions/ai-generate" },
  { label: "AI 模拟面试", href: "/ai/mock-interview" },
  { label: "学习计划", href: "/study-plans" },
  { label: "真题实战", href: "/" },
  { label: "社区交流", href: "/experiences" },
];

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  // ESC 键关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  // 打开时禁止背景滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
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
          "fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* 抽屉面板 */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[280px] max-w-[80vw] bg-surface-bright border-r border-outline-variant transition-transform duration-300 ease-out md:hidden flex flex-col",
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

        {/* 导航链接 */}
        <nav className="flex-1 overflow-y-auto py-2 mobile-scroll">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={onClose}
              className="flex items-center px-4 py-3.5 text-base font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 底部操作区 */}
        <div className="shrink-0 border-t border-outline-variant p-4 space-y-3">
          <Link
            href="/questions/new"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary-container text-on-primary-container text-sm font-semibold rounded hover:brightness-110 transition-all"
            style={{ boxShadow: "0 0 10px color-mix(in srgb, var(--primary) 15%, transparent)" }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            新增题目
          </Link>
          <div className="flex items-center justify-between px-2">
            <span className="text-sm text-on-surface-variant">主题</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: 验证组件可正常导入**

Expected: 无 TypeScript 编译错误

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/MobileDrawer.tsx
git commit -m "feat(mobile): create MobileDrawer sidebar component with nav links and theme toggle"
```

---

### Task 4: TopNav 移动端改造（集成汉堡菜单）

**Files:**
- Modify: `src/components/layout/TopNav.tsx`

- [ ] **Step 1: 改造 TopNav 组件**

将 TopNav 改造为移动端显示汉堡按钮 + 集成 MobileDrawer：

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { MobileDrawer } from "./MobileDrawer";

interface TopNavProps {
  activeLabel?: string;
  className?: string;
}

const NAV_LINKS = [
  { label: "面试宝典", href: "/questions" },
  { label: "AI 出题", href: "/questions/ai-generate" },
  { label: "AI 模拟面试", href: "/ai/mock-interview" },
  { label: "学习计划", href: "/study-plans" },
  { label: "真题实战", href: "/" },
  { label: "社区交流", href: "/experiences" },
];

export function TopNav({ activeLabel, className }: TopNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 w-full z-50 flex items-center h-nav-height px-4 md:px-margin-desktop",
          "bg-surface-bright border-b border-outline-variant transition-all duration-200",
          className
        )}
        style={{ height: 56 }}
      >
        {/* Logo — 移动端缩小 */}
        <Link
          href="/"
          className="text-xl md:text-[32px] font-semibold text-primary tracking-tight leading-none mr-4 md:mr-8 flex-shrink-0"
          style={{ letterSpacing: "-0.02em" }}
        >
          面试网
        </Link>

        {/* 桌面端导航链接 — md 以上显示 */}
        <div className="hidden md:flex items-center h-full gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = activeLabel === link.label;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "flex items-center h-full px-4 text-sm font-medium transition-all duration-200 rounded",
                  isActive
                    ? "text-primary border-b-2 border-primary font-semibold"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* 桌面端操作区 — md 以上显示 */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/questions/new"
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-container text-on-primary-container text-sm font-semibold rounded hover:brightness-110 transition-all"
            style={{ boxShadow: "0 0 10px color-mix(in srgb, var(--primary) 15%, transparent)" }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            新增题目
          </Link>
          <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-high rounded transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
          <ThemeToggle />
          <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-high rounded transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        {/* 移动端汉堡按钮 — md 以下显示 */}
        <button
          className="md:hidden w-11 h-11 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors -mr-1"
          onClick={() => setDrawerOpen(true)}
          aria-label="打开菜单"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
      </nav>

      {/* 移动端抽屉 */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
```

关键改动点：
- 引入 `useState` 管理 drawer 状态
- 引入 `MobileDrawer` 组件
- Logo: `text-xl md:text-[32px]` 响应式字号
- padding: `px-4 md:px-margin-desktop`
- 导航链接 + 操作按钮区包在 `hidden md:flex` 中
- 新增汉堡按钮（`md:hidden`），44×44px 触摸区域
- 底部渲染 `<MobileDrawer>`

- [ ] **Step 2: 验证**

Run: `pnpm dev`
1. 桌面端（≥768px）：TopNav 与改造前完全一致
2. 手机端（<768px）：Logo 缩小 + 右侧汉堡按钮
3. 点击汉堡 → Drawer 从左侧滑入
4. 点击遮罩 / ESC / 关闭按钮 → Drawer 关闭
5. Drawer 内导航链接可点击跳转

Expected: 所有交互符合预期

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/TopNav.tsx
git commit -m "feat(mobile): integrate hamburger menu and MobileDrawer into TopNav"
```

---

## Phase 2: 核心页面

### Task 5: Dashboard 首页移动端适配

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 修改外层容器和 Header 区域**

将外层容器的 padding 改为响应式：

```tsx
// 原来:
<div className="p-margin-desktop max-w-[1440px] mx-auto w-full">

// 改为:
<div className="p-4 md:p-margin-desktop max-w-[1440px] mx-auto w-full">
```

Header 区域（约第 424 行）保持现有 `sm:flex-row` 响应式写法即可，微调 gap：

```tsx
<div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
```
（此行已正确，无需改）

- [ ] **Step 2: 修改 Bento Grid Row 1 为 mobile-first**

将三列网格改为默认单列、md 以上三列：

```tsx
// 原来:
<div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">

// 保持不变（已经是 mobile-first 写法）
```

内部子项调整：
- 左侧进度环卡片 `md:col-span-4` → 保持（mobile 默认 full width）
- ProgressRing size 响应式：使用 hook 或直接传固定值 120（mobile 下够用）
- 中间统计卡片区域 `md:col-span-4` → 保持
- 右侧每日一题 `md:col-span-4` → 保持

进度环尺寸调整（约第 495 行）：

```tsx
// 原来:
<ProgressRing current={todayCount} total={dailyGoal} size={160} />

// 改为:
<ProgressRing current={todayCount} total={dailyGoal} size={120} md:size={160} />
```

注意：如果 ProgressRing 不支持响应式 props，则固定用 120（移动端 120px 足够清晰）。

- [ ] **Step 3: 修改分类分布 + 错题提醒区域**

```tsx
// 原来:
<div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">

// 保持不变（已是 mobile-first 单列）
```

- [ ] **Step 4: 修改最近练习卡片区域**

min-width 缩小以适应手机屏：

```tsx
// 约 875 行，原来 min-w-[280px]:
className="min-w-[280px] h-32 ..."

// 改为:
className="min-w-[260px] sm:min-w-[280px] h-32 ..."
```

- [ ] **Step 5: 修改 Loading Skeleton 区域**

所有 Skeleton 容器同步改为响应式 padding：

```tsx
// Loading state 外层:
<div className="p-4 md:p-margin-desktop max-w-[1440px] mx-auto w-full">
```

- [ ] **Step 6: Footer 适配**

Footer 已有 `md:flex-row` 响应式处理，无需大改。

- [ ] **Step 7: 验证**

Run: `pnpm dev`，iPhone SE 视图下检查：
1. 页面左右 padding 为 16px
2. 三列 Bento 区垂直堆叠，每个卡片全宽
3. 进度环大小适中（~120px）
4. 热力图可横向滚动
5. 分类分布和错题提醒垂直排列
6. 最近练习卡片可横向滚动
7. 桌面端视图无回归

Expected: Dashboard 在手机端完整可用

- [ ] **Step 8: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(mobile): adapt Dashboard page with responsive grid and spacing"
```

---

### Task 6: 题目列表页移动端适配

**Files:**
- Modify: `src/app/questions/page.tsx`

此文件较大（700+ 行），需分区域逐步修改。

- [ ] **Step 1: 外层容器 padding 响应式化**

找到页面最外层容器 div，添加移动端 padding：

```tsx
// 将 p-margin-desktop 替换为:
className="p-4 md:p-margin-desktop ..."
```

- [ ] **Step 2: 语言分组 Tab 栏改造**

找到语言分组 tab 栏的容器，确保：
- 容器有 `overflow-x-auto mobile-scroll` 
- `flex-shrink-0` 应用到每个 tab 按钮
- 每个 tab 有合适的 minWidth

典型改造（具体类名需根据实际代码调整）：

```tsx
<div className="flex gap-2 overflow-x-auto mobile-scroll pb-2 md:pb-0">
  {LANGUAGE_GROUPS.map((group) => (
    <button
      key={group.id}
      className="shrink-0 px-4 py-2 text-sm rounded-full whitespace-nowrap ..."
    >
      {group.icon} {group.label}
    </button>
  ))}
</div>
```

- [ ] **Step 3: 分类侧边栏改造为筛选面板**

这是最关键的布局改动。当前是左侧侧边栏 + 右侧内容区的两栏布局。

**方案：** 移动端隐藏侧边栏，顶部增加一个「筛选」按钮，点击后展开筛选区域（内联展开，非 Bottom Sheet 以减少复杂度）。

```tsx
// 新增状态:
const [showFilters, setShowFilters] = useState(false);

// 移动端筛选按钮（md 以下显示）:
<button
  className="md:hidden flex items-center gap-2 px-3 py-2 text-sm rounded border border-outline-variant text-on-surface-variant hover:bg-surface-high"
  onClick={() => setShowFilters(!showFilters)}
>
  <svg className="w-4 h-4" ... /> 筛选
</button>

// 侧边栏容器:
<aside className={cn(
  "hidden md:block md:w-56 shrink-0 ...",
  // 可选：移动端以内联折叠方式展示
  showFilters && "block fixed inset-0 z-40 pt-14 bg-background p-4 overflow-y-auto"
)}>
```

如果侧边栏代码过于耦合，更简化的方案是：移动端直接把分类筛选放到 Tab 栏下方的一个可折叠区域中。

- [ ] **Step 4: 题目卡片列表适配**

确保题目卡片在移动端：
- 单列展示（移除任何 `grid-cols-2/3` 等）
- 卡片间距 `gap-3`（12px）
- 卡片内部 padding `p-3 md:p-4`

- [ ] **Step 5: 分页器简化**

移动端分页器只显示：上一页 / 页码 / 下一页，省略首尾跳转。

- [ ] **Step 6: 验证**

Run: `pnpm dev`，iPhone SE 视图下：
1. 语言 Tab 栏可横向滚动
2. 筛选按钮可点击展开/收起分类列表
3. 题目卡片单列排列，间距合理
4. 分页器功能正常

Expected: 题目列表页在手机端完全可用

- [ ] **Step 7: Commit**

```bash
git add src/app/questions/page.tsx
git commit -m "feat(mobile): adapt questions list with scrollable tabs and collapsible filters"
```

---

### Task 7: 题目详情页移动端适配

**Files:**
- Modify: `src/app/questions/[id]/page.tsx`

这是最复杂的页面改造之一——从分屏布局变为垂直流式布局。

- [ ] **Step 1: 外层容器 padding 响应式**

```tsx
className="p-4 md:p-margin-desktop ..."
```

- [ ] **Step 2: 添加返回按钮（移动端顶栏）**

在页面顶部新增一个移动端专属的返回栏（md 以上隐藏）：

```tsx
{/* 移动端顶栏 */}
<div className="md:hidden flex items-center gap-3 mb-4">
  <Link href="/questions" className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-high">
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  </Link>
  <h1 className="text-base font-semibold truncate">{questionData?.title ?? "加载中..."}</h1>
</div>
```

- [ ] **Step 3: 分屏布局改为垂直堆叠**

当前页面可能使用了类似 `grid grid-cols-2` 或 `flex` 分屏。需要将其改为：

**移动端布局顺序：**
1. 题目标题 + 元信息（难度 Badge、标签）
2. 题目内容（Markdown 渲染）
3. 底部粘性 Tab 栏（编辑器 / 题解 / 面试 / 讨论）
4. Tab 对应内容区

核心思路是用条件渲染/响应式类名切换布局模式：

```tsx
{/* 桌面端：保留原分屏布局 */}
<div className="hidden md:grid md:grid-cols-2 ...">
  {/* 原有左栏：题面 */}
  {/* 原有右栏：Tab 内容 */}
</div>

{/* 移动端：垂直堆叠 */}
<div className="md:hidden flex flex-col">
  {/* 题目元信息 */}
  <div className="flex flex-wrap items-center gap-2 mb-3">
    <DifficultyBadge difficulty={...} />
    {tags.map(t => <TagBadge key={t.tag} tag={t.tag} />)}
  </div>

  {/* 题目内容 */}
  <div className="mb-4">
    <MarkdownRenderer content={questionData?.content} />
  </div>

  {/* 底部 Tab 切换栏 */}
  <div className="sticky bottom-0 bg-surface-bright border-t border-outline-variant -mx-4 px-4">
    <div className="flex">
      {tabs.map(tab => (
        <button key={tab.key} ...>{tab.label}</button>
      ))}
    </div>
  </div>

  {/* 当前 Tab 内容 */}
  <div className="mt-4">
    {activeTabContent}
  </div>
</div>
```

- [ ] **Step 4: 代码编辑器全宽适配**

确保 CodeEditor 在移动端：
- `w-full` 全宽
- `min-h-[200px]` 最小高度
- 工具栏（语言选择等）不溢出

- [ ] **Step 5: 验证**

Run: `pnpm dev`，iPhone SE 视图：
1. 顶部显示返回按钮 + 题目标题
2. 难度标签和 Tag 正确显示
3. 题目内容完整渲染
4. 底部 Tab 栏固定，可切换
5. 代码编辑器全宽可用
6. 桌面端分屏布局不受影响

Expected: 题目详情页双端体验良好

- [ ] **Step 6: Commit**

```bash
git add src/app/questions/[id]/page.tsx
git commit -m "feat(mobile): adapt question detail page with stacked layout and sticky tab bar"
```

---

## Phase 3: 功能页面

### Task 8: AI 对话页适配

**Files:**
- Modify: `src/app/ai/page.tsx`

- [ ] **Step 1: 外层容器 padding 响应式**

```tsx
className="p-4 md:p-margin-desktop ..."
```

- [ ] **Step 2: 聊天消息列表适配**

- 消息气泡最大宽度 85%
- padding 调整：`p-3`（移动端）
- 输入框区域：固定底部，全宽

```tsx
{/* 输入区容器 */}
<div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-bright border-t border-outline-variant md:relative md:border-0 md:p-0">
  <div className="max-w-[1440px] mx-auto flex gap-2">
    <input className="flex-1 ..." />
    <button>发送</button>
  </div>
</div>
```

主内容区需要增加 `pb-20`（为底部输入框留空）。

- [ ] **Step 3: Commit**

```bash
git add src/app/ai/page.tsx
git commit -m "feat(mobile): adapt AI chat page with fixed bottom input area"
```

---

### Task 9: AI 模拟面试页适配

**Files:**
- Modify: `src/app/ai/mock-interview/page.tsx`

- [ ] **Step 1: 方向选择界面网格适配**

```tsx
// 原来 2×2 网格:
className="grid grid-cols-2 ..."

// 改为:
className="grid grid-cols-1 sm:grid-cols-2 gap-4 ..."
```

每个方向卡片内部：
- 图标尺寸 `w-8 h-8` → `w-12 h-12`（增大触摸面积）
- 文字允许折行

- [ ] **Step 2: 面试聊天界面**

复用 Task 8 的模式：消息列表 + 固定底部输入区。

- [ ] **Step 3: Commit**

```bash
git add src/app/ai/mock-interview/page.tsx
git commit -m "feat(mobile): adapt mock-interview page with single-column direction cards"
```

---

### Task 10: 学习计划页适配

**Files:**
- Modify: `src/app/study-plans/page.tsx`
- Modify: `src/app/study-plans/[id]/page.tsx`

- [ ] **Step 1: 列表页 (`study-plans/page.tsx`)**

外层 padding 响应式化。
创建计划 Modal：移动端 `mx-4` 且基本全宽，padding 缩小至 `p-4`。
计划卡片：单列堆叠（已有 `grid-cols-1` 则无需改）。

- [ ] **Step 2: 详情页 (`study-plans/[id]/page.tsx`)**

外层 padding 响应式化。
日历/进度视图：保持原有布局，允许横向滚动。
题目列表：单列，每行高度适当增加（min-h-[52px]）。

- [ ] **Step 3: Commit**

```bash
git add src/app/study-plans/page.tsx src/app/study-plans/[id]/page.tsx
git commit -m "feat(mobile): adapt study plan pages with responsive layouts"
```

---

### Task 11: 面经笔记页适配（最复杂页面）

**Files:**
- Modify: `src/app/experiences/page.tsx`

- [ ] **Step 1: 将三栏布局替换为两层模式**

核心策略：移动端使用状态变量控制「列表模式」和「详情模式」的切换。

```tsx
const [selectedId, setSelectedId] = useState<string | null>(null);
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// 移动端：根据 selectedId 显示不同视图
if (isMobile && selectedId) {
  return <MobileNoteDetail note={...} onBack={() => setSelectedId(null)} />;
}

// 桌面端 or 移动端列表：
return (
  <div className="flex flex-col md:flex-row h-[calc(100vh-56px)] overflow-hidden">
    {/* 移动端：笔记列表全屏 */}
    {/* 桌面端：三栏布局（保持原有代码在 md: 以上） */}
  </div>
);
```

- [ ] **Step 2: 移除左侧图标导航栏（移动端）**

图标导航栏 `w-16` 在 `md:` 以下完全隐藏。

- [ ] **Step 3: 笔记列表区域**

移动端全宽展示公司分组手风琴 + 笔记条目列表。
点击笔记条目 → `setSelectedId(note.id)` 进入详情。

- [ ] **Step 4: 笔记详情区域（移动端）**

新建一个内联组件或在同文件中定义：

```tsx
function MobileNoteDetail({ note, onBack }: { note: Note; onBack: () => void }) {
  return (
    <div className="h-[calc(100vh-56px)] flex flex-col overflow-hidden">
      {/* 顶栏 */}
      <div className="flex items-center gap-3 p-4 border-b border-outline-variant shrink-0">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-high">
          <svg ... /> {/* 返回箭头 */}
        </button>
        <h1 className="text-base font-semibold truncate">{note.title}</h1>
      </div>
      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4 mobile-scroll">
        <MarkdownRenderer content={note.content} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/experiences/page.tsx
git commit -m "feat(mobile): rewrite experiences page with two-layer navigation for mobile"
```

---

### Task 12: 其他页面适配

**Files:**
- Modify: `src/app/questions/new/page.tsx`
- Modify: `src/app/questions/ai-generate/page.tsx`

- [ ] **Step 1: 新增题目页 (`questions/new/page.tsx`)**

- 表单容器 padding: `p-4 md:p-6`
- Input / Textarea: `w-full`
- 标签选择器：允许横向滚动或 `flex-wrap`
- 提交按钮：移动端 `w-full`

- [ ] **Step 2: AI 出题页 (`questions/ai-generate/page.tsx`)**

- 参数配置区垂直堆叠
- 结果列表单列

- [ ] **Step 3: Commit**

```bash
git add src/app/questions/new/page.tsx src/app/questions/ai-generate/page.tsx
git commit -m "feat(mobile): adapt new question and AI generate pages"
```

---

## Phase 4: 组件收尾

### Task 13: UI 组件移动端适配

**Files:**
- Modify: `src/components/ui/Card.tsx`
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/Input.tsx`
- Modify: `src/components/CodeEditor.tsx`
- Modify: `src/components/MarkdownRenderer.tsx`
- Modify: `src/components/ui/ProgressRing.tsx`

- [ ] **Step 1: Card 组件**

默认 padding 缩小：

```tsx
// 原来（如果有默认 p-6）:
<div className={cn("bg-surface-low border border-outline-variant rounded-lg ...", className)} {...props}>
  {children}
</div>

// 如果 children 需要更紧凑的内边距，让调用方控制
// Card 本身保持不变，由各页面传入响应式 className
```

Card 组件本身可以不做强制改动，而是通过各页面调用时传入不同的 padding class 来控制。

- [ ] **Step 2: Button 组件**

确保最小触摸高度：

```tsx
// 在 Button 的 className 合并中确保:
// size === "sm" → py-2 (8px*2=16px + text = ~36px，偏小)
// 改为 size === "sm" → py-2.5 (10px*2=20px + text ≈ 40px+)

// 或者在组件外部包裹时由调用方决定
```

实际上 Button 的 padding 已经合理，只需确认 `size="sm"` 时高度不低于 40px。

- [ ] **Step 3: Input 组件**

确认 `w-full` 为默认行为，font-size 16px 已在 globals.css 中全局设置。

- [ ] **Step 4: CodeEditor 组件**

容器样式确保：

```tsx
<div className="w-full border border-outline-variant rounded-lg overflow-hidden min-h-[200px]">
```

- [ ] **Step 5: MarkdownRenderer 组件**

表格横向滚动：

```tsx
// 在 pre/table 渲染处包装:
<table className="min-w-full overflow-x-auto" ...>
```

- [ ] **Step 6: ProgressRing 组件**

如果组件接受 size prop，无需改动（由调用方传入响应式值）。如果不接受，考虑添加默认值或由调用方控制。

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/Card.tsx src/components/ui/Button.tsx src/components/ui/Input.tsx src/components/CodeEditor.tsx src/components/MarkdownRenderer.tsx src/components/ui/ProgressRing.tsx
git commit -m "feat(mobile): adapt UI components with touch-friendly sizing and responsive defaults"
```

---

### Task 14: 全面验证与修复

- [ ] **Step 1: 启动开发服务器**

Run: `pnpm dev`

- [ ] **Step 2: 逐页面验证清单**

使用浏览器 DevTools 切换以下视口逐一检查：

| 页面 | iPhone SE (375px) | iPad (768px) | Desktop (1280px) |
|------|-------------------|-------------|------------------|
| `/` Dashboard | 可浏览 | 布局良好 | 无回归 |
| `/questions` 列表 | Tab 可滚动+筛选可用 | 侧边栏出现 | 无回归 |
| `/questions/[id]` 详情 | 堆叠+Tab 可切 | 分屏恢复 | 无回归 |
| `/ai` 对话 | 输入框贴底 | 正常 | 无回归 |
| `/ai/mock-interview` | 单列卡片 | 2列网格 | 无回归 |
| `/study-plans` | Modal 全宽 | 正常 | 无回归 |
| `/study-plans/[id]` | 单列 | 正常 | 无回归 |
| `/experiences` | 两层跳转 | 三栏恢复 | 无回归 |
| `/questions/new` | 表单全宽 | 正常 | 无回归 |
| `/questions/ai-generate` | 参数堆叠 | 正常 | 无回归 |

- [ ] **Step 3: 交互验证**

- [ ] 汉堡菜单打开/关闭流畅
- [ ] Drawer 中所有链接可跳转
- [ ] 所有按钮触摸区域 ≥ 44px
- [ ] 横向滚动区域惯性滚动正常
- [ ] 键盘弹起时不遮挡关键元素
- [ ] 暗色模式在移动端正常工作

- [ ] **Step 4: 修复发现的问题**

逐项修复验证中发现的问题。

- [ ] **Step 5: 最终 Commit**

```bash
git add -A
git commit -m "fix(mobile): fix issues found during cross-device verification"
```

---

## Self-Review 清单

### Spec 覆盖检查
- [x] viewport meta 标签 → Task 1
- [x] 安全区域/触摸优化 CSS → Task 2
- [x] 间距系统 → Task 2 (globals.css) + 各页面
- [x] TopNav + Drawer → Task 3 + Task 4
- [x] Dashboard → Task 5
- [x] 题目列表 → Task 6
- [x] 题目详情 → Task 7
- [x] AI 对话 → Task 8
- [x] 模拟面试 → Task 9
- [x] 学习计划 → Task 10
- [x] 面经笔记 → Task 11
- [x] 其他页面 → Task 12
- [x] UI 组件 → Task 13
- [x] 验收测试 → Task 14

### Placeholder 扫描
- 无 TBD / TODO / 占位符

### 类型一致性
- MobileDrawer props 接口与 TopNav 中的调用一致
- 各页面响应式断点统一使用 `md:` 作为桌面/手机分界点
