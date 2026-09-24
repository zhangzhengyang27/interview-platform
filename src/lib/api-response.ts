import { NextResponse } from "next/server";

/**
 * API 错误兜底与统一返回工具。
 *
 * 目标：消除每个 Route Handler 里重复的
 *   `catch (e) { console.error(...); return NextResponse.json({ error: "服务器内部错误" }, { status: 500 }) }`
 * 样板代码，统一日志上下文与错误结构。
 *
 * 兼容性说明：
 * - `handleApiError` 保持返回既有结构 `{ error: "服务器内部错误" }` + 500，
 *   因此替换后**不需要改动任何现有前端解析逻辑**，纯属后端样板收敛。
 * - `ok` / `fail` 提供统一的成功/失败包装，供**新写**的 API 使用；
 *   `ok` 沿用顶层 `data` 字段（与现有 `data.xxx` 读取习惯一致），
 *   `fail` 沿用 `error` 字段（与现有 `data.error` 读取一致）。
 */

/** 成功响应（成功负载放顶层，兼容现有 `res.xxx` 读取） */
export function ok<T extends Record<string, unknown>>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

/** 失败响应：统一结构 + 可指定 HTTP 状态 */
export function fail(code: number, message: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, code, error: message }, { status });
}

/**
 * API 层统一错误兜底。
 * 用法：
 *   try { ... } catch (e) { return handleApiError(e, "GET /api/questions"); }
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  console.error(`[API Error] ${context}:`, error);
  return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
}
