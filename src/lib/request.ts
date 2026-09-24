"use client";

import { signOut } from "next-auth/react";

/**
 * 前端统一请求封装。
 *
 * 目标：收敛「每个页面手工 fetch + 各自处理 !res.ok」的样板，
 * 并统一处理鉴权失败（401/403 → 退出登录并跳转 /login）。
 *
 * 约定（与后端 api-response.ts 保持一致）：
 * - 成功：返回解析后的 JSON（后端 `data` 或顶层业务字段）。
 * - 失败：抛出一个 `ApiError`，含 `status` 与 `message`（优先取后端 `error` 字段）。
 * - 401/403：自动调用 `signOut` 跳转登录页。
 *
 * 用法：
 *   const data = await apiGet<{ questions: Q[] }>("/api/questions?take=100");
 *   try { await apiPost("/api/x", { a: 1 }); } catch (e) { console.log(e.message) }
 */

export class ApiError extends Error {
  status: number;
  code?: number;

  constructor(status: number, message: string, code?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.error === "string") return body.error;
    if (body && typeof body.message === "string") return body.message;
  } catch {
    // 非 JSON 响应体，回退到文本
  }
  try {
    const text = await res.text();
    if (text) return text;
  } catch {
    // ignore
  }
  return `请求失败 (HTTP ${res.status})`;
}

let redirecting = false;

async function handleUnauthorized(res: Response): Promise<never> {
  if (!redirecting) {
    redirecting = true;
    try {
      await signOut({ callbackUrl: "/login", redirect: true });
    } finally {
      redirecting = false;
    }
  }
  throw new ApiError(res.status, "登录已失效，请重新登录");
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  /** 请求体（自动 JSON.stringify 并设置 Content-Type） */
  json?: unknown;
  /** 不抛错、返回原始 Response（如需要读 headers / 下载场景） */
  raw?: boolean;
  /** 遇到 401/403 时是否自动跳转登录，默认 true */
  redirectOnAuth?: boolean;
}

async function request<T = unknown>(url: string, options: RequestOptions = {}): Promise<T | Response> {
  const { json, raw, redirectOnAuth = true, ...init } = options;

  const headers = new Headers(init.headers);
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const rawInit = init as RequestInit;

  let res: Response;
  try {
    res = await fetch(url, {
      ...rawInit,
      headers,
      body: json !== undefined ? JSON.stringify(json) : rawInit.body,
    });
  } catch {
    throw new ApiError(0, "网络错误，请检查连接");
  }

  // 未登录 / 无权限：统一跳转登录
  if ((res.status === 401 || res.status === 403) && redirectOnAuth) {
    return handleUnauthorized(res);
  }

  if (!res.ok) {
    const message = await parseError(res);
    throw new ApiError(res.status, message);
  }

  if (raw) return res;

  // 204 无内容
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

export async function apiGet<T = unknown>(url: string, options?: RequestOptions): Promise<T> {
  return (await request<T>(url, { ...options, method: "GET" })) as T;
}

export async function apiPost<T = unknown>(url: string, json?: unknown, options?: RequestOptions): Promise<T> {
  return (await request<T>(url, { ...options, method: "POST", json })) as T;
}

export async function apiPatch<T = unknown>(url: string, json?: unknown, options?: RequestOptions): Promise<T> {
  return (await request<T>(url, { ...options, method: "PATCH", json })) as T;
}

export async function apiDelete<T = unknown>(url: string, options?: RequestOptions): Promise<T> {
  return (await request<T>(url, { ...options, method: "DELETE" })) as T;
}

export { request };
