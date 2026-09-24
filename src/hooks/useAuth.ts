"use client";

import { useSession, signOut } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  const user = session?.user;
  const isLoading = status === "loading";
  const isAuthenticated = !!session;

  const logout = () => signOut({ callbackUrl: "/login" });

  return { user, isLoading, isAuthenticated, logout };
}
