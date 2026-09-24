"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export function AuthGuard({ children, loadingComponent }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [timeoutReached, setTimeoutReached] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // 如果 loading 超过 3 秒，认为是未登录状态
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setTimeoutReached(true), 3000);
      return () => clearTimeout(timer);
    }
    setTimeoutReached(false);
  }, [isLoading]);

  // 未登录时跳转到 /login，带上 callbackUrl 以便登录后回到原页面
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const callbackUrl = encodeURIComponent(pathname || "/");
      router.replace(`/login?callbackUrl=${callbackUrl}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading && !timeoutReached) {
    return (
      loadingComponent || (
        <div className="flex items-center justify-center min-h-[200px]">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{
              borderColor: "var(--outline-variant)",
              borderTopColor: "var(--primary)",
            }}
          />
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return (
      loadingComponent || (
        <div className="flex items-center justify-center min-h-[200px]">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{
              borderColor: "var(--outline-variant)",
              borderTopColor: "var(--primary)",
            }}
          />
        </div>
      )
    );
  }

  return <>{children}</>;
}
