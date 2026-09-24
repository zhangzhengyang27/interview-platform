"use client";

import { useSyncExternalStore } from "react";

/**
 * 统一响应式断点 hook。
 *
 * 设计目标：
 * 1. SSR 安全 —— 服务端快照返回 false，避免水合(hydration)不一致。
 * 2. 复用项目已有的 matchMedia 模式（见 useTheme.ts）。
 * 3. 消除现网三套断点（lg=1024 / sm=640 / CSS 硬编码 768/640）并存的混乱。
 *
 * 断点对齐 Tailwind v4 默认：
 *   sm: 640px  md: 768px  lg: 1024px  xl: 1280px
 * 语义划分：
 *   mobile  : < 768px        （手机，竖屏优先，单栏 + 抽屉/底部 Tab）
 *   tablet  : 768–1023px     （平板，部分双栏）
 *   desktop : >= 1024px      （桌面，多栏布局）
 */

export type Breakpoint = "mobile" | "tablet" | "desktop";

const QUERY_MOBILE = "(max-width: 767px)";
const QUERY_TABLET = "(min-width: 768px) and (max-width: 1023px)";
const QUERY_DESKTOP = "(min-width: 1024px)";

const serverSnapshot = () => false;

function subscribe(query: string) {
  return (onChange: () => void) => {
    if (typeof window === "undefined") return () => {};
    const mq = window.matchMedia(query);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  };
}

function matchMediaSnapshot(query: string) {
  return () =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches;
}

/** 监听任意媒体查询，返回是否匹配。SSR 安全（服务端恒为 false）。 */
export function useMediaQuery(query: string): boolean {
  const subscribeFn = subscribe(query);
  const getSnapshot = matchMediaSnapshot(query);
  return useSyncExternalStore(subscribeFn, getSnapshot, serverSnapshot);
}

/** 是否手机视口（< 768px）。 */
export function useIsMobile(): boolean {
  return useMediaQuery(QUERY_MOBILE);
}

/** 是否平板视口（768–1023px）。 */
export function useIsTablet(): boolean {
  return useMediaQuery(QUERY_TABLET);
}

/** 是否桌面视口（>= 1024px）。 */
export function useIsDesktop(): boolean {
  return useMediaQuery(QUERY_DESKTOP);
}

/** 返回当前断点类别（mobile / tablet / desktop）。注意：仅客户端准确，SSR 返回 "desktop" 占位。 */
export function useBreakpoint(): Breakpoint {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  if (isMobile) return "mobile";
  if (isTablet) return "tablet";
  return "desktop";
}
