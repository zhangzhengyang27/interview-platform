"use client";

import { ViewTransition } from "react";

/**
 * 页面切换过渡动画包装器
 * 使用 React 19 的 ViewTransition API，配合 Next.js 16 的 viewTransition 实验性功能
 * 提供淡入淡出 + 轻微上移效果
 */
export function ViewTransitionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      default="none"
      enter="page-enter"
      exit="page-exit"
    >
      {children}
    </ViewTransition>
  );
}
