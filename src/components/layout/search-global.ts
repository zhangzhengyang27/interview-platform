"use client";

// 全局搜索触发器 — 用于跨组件（TopNav、MobileDrawer 等）打开搜索弹窗
// 避免 TopNav 与 MobileDrawer 之间的循环依赖

type OpenSearchFn = () => void;

let openSearchCallback: OpenSearchFn | null = null;

export function registerOpenSearch(fn: OpenSearchFn) {
  openSearchCallback = fn;
}

export function triggerGlobalSearch() {
  openSearchCallback?.();
}
