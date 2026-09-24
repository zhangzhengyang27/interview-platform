import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permission";

/**
 * 管理员鉴权（RBAC 版本）。
 *
 * 由 `permission.ts` 的 `requirePermission("admin:access")` 实现：
 * 校验当前用户的角色是否被授予 `admin:access` 权限点。
 *
 * 支持两种验证方式（与 permission.ts 一致）：
 * 1. NextAuth session cookie（主站直接访问）
 * 2. JWT token（后台项目通过 Authorization header 传递）
 *
 * @returns 如果验证通过返回 null，否则返回错误响应
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  return requirePermission("admin:access");
}

// 供需要更细粒度权限的接口使用，透传 re-export 保持单一入口
export { requirePermission } from "@/lib/permission";
