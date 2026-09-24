import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// 注意：此 proxy 运行在 Edge Runtime，不能导入 prisma 或 @/lib/auth。
// 页面级登录态用 getToken（next-auth/jwt 的 Edge 兼容导出）校验 JWT；
// 细粒度鉴权（admin 权限、数据归属）仍由各 API 路由内部处理。

// 需要登录才能访问的页面路由前缀
const PROTECTED_PAGES = ["/profile", "/settings", "/bookmarks", "/dashboard"];

// 仅管理员可访问的路由前缀
const ADMIN_PAGES = ["/admin"];

const isStaticAsset = (pathname: string) =>
  pathname.startsWith("/_next/static") ||
  pathname.startsWith("/_next/image") ||
  pathname === "/favicon.ico" ||
  pathname.startsWith("/public/") ||
  /\.(ico|svg|png|jpg|jpeg|webp|css|js|map|woff2?)$/.test(pathname);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) return NextResponse.next();

  const isProtectedPage = PROTECTED_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAdminPage = ADMIN_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // 公开页面 / 公开 API 直接放行
  if (!isProtectedPage && !isAdminPage) {
    return NextResponse.next();
  }

  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  const token = await getToken({ req: request, secret });

  // 未登录：跳转登录页，并携带回跳地址
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 管理员页面：校验 role
  if (isAdminPage && token.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
