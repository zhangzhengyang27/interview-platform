import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";

/**
 * 服务端页面使用：未登录则重定向到登录页
 */
export async function getServerSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/**
 * 可选认证：返回 session 或 null，不做任何拦截
 */
export async function optionalAuth() {
  return auth();
}

/**
 * API 路由使用：要求用户必须登录
 * 未登录时返回 401 JSON 响应，登录则返回 null
 *
 * @example
 * const authError = await requireAuth();
 * if (authError) return authError;
 * // 此后可安全调用 await auth() 获取 session
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "未登录，请先登录" },
      { status: 401 }
    );
  }
  return null;
}

/**
 * 获取当前认证用户（API 路由内使用）
 * 必须先通过 requireAuth() 检查后才调用
 */
export async function getCurrentUser(): Promise<Session["user"] | null> {
  const session = await auth();
  return session?.user ?? null;
}
