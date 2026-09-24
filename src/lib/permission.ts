import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { verifyJWT } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * 细粒度权限校验（RBAC）。
 *
 * 在 `requireAdmin`（仅 admin 角色）基础上，升级为「权限点」校验：
 *   用户 -> Role（User.role 指向 Role.code）-> RolePermission -> Permission
 *
 * 支持两种鉴权来源（与 admin-auth 一致）：
 *   1. Authorization: Bearer <JWT>（后台项目直接调用）
 *   2. NextAuth session（主站访问）
 *
 * 用法（API 路由）：
 *   const permError = await requirePermission("question:add");
 *   if (permError) return permError;
 */

// 角色 -> 权限点集合 的内存缓存（开发期 TTL 30s，减少每次请求查库）
const cache = new Map<string, string[]>();
const cacheTime = new Map<string, number>();
const CACHE_TTL = 30_000;

async function loadRolePermissions(roleCode: string): Promise<string[]> {
  const now = Date.now();
  const last = cacheTime.get(roleCode);
  if (last && now - last < CACHE_TTL && cache.has(roleCode)) {
    return cache.get(roleCode)!;
  }
  const role = await prisma.role.findUnique({
    where: { code: roleCode },
    include: { permissions: { include: { permission: true } } },
  });
  const codes = (role?.permissions ?? []).map((rp) => rp.permission.code);
  cache.set(roleCode, codes);
  cacheTime.set(roleCode, now);
  return codes;
}

interface AuthUser {
  role: string | null;
}

async function resolveAuthUser(): Promise<AuthUser | null> {
  // 方式一：Bearer JWT
  const authHeader = (await headers()).get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const payload = await verifyJWT(authHeader.slice(7));
    if (payload) return { role: payload.role };
    return null; // token 无效
  }
  // 方式二：NextAuth session
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return { role: session.user.role ?? "user" };
  }
  return null;
}

/**
 * 校验当前用户是否具备指定权限点。
 * @returns 无权限时返回错误响应（401/403），有权限返回 null。
 */
export async function requirePermission(
  permissionCode: string
): Promise<NextResponse | null> {
  const user = await resolveAuthUser();

  if (!user) {
    return NextResponse.json({ error: "未登录，请先登录" }, { status: 401 });
  }

  // 权限点已内置给所有角色的兜底：role 无对应 Role 记录视为无权限
  const roleCode = user.role ?? "user";
  const permissions = await loadRolePermissions(roleCode);

  if (!permissions.includes(permissionCode)) {
    return NextResponse.json(
      { error: "无权限执行此操作" },
      { status: 403 }
    );
  }

  return null;
}

/**
 * 兼容旧接口：admin 角色校验（admin 拥有全部权限点）。
 * 保留 requireAdmin 供既有代码使用，内部走 RBAC 的 admin:access 权限点。
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  return requirePermission("admin:access");
}
