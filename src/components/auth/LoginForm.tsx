"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const registered = searchParams.get("registered") === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("请填写邮箱和密码");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // 区分失败原因：未注册 / 未验证 / 密码错误
        try {
          const check = await fetch(
            `/api/auth/check-email?email=${encodeURIComponent(email)}`
          ).then((r) => r.json());
          if (check.registered && !check.verified) {
            setError("该邮箱尚未验证，请先完成注册验证");
            return;
          }
          if (!check.registered) {
            setError("该邮箱尚未注册");
            return;
          }
        } catch {
          // 查询失败时退回通用提示
        }
        setError("邮箱或密码错误");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "登录失败，请重试";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-[400px] mx-auto p-8 rounded-lg"
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--outline-variant)",
      }}
    >
      <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "var(--on-surface)" }}>
        欢迎回来
      </h1>
      <p className="text-sm text-center mb-8" style={{ color: "var(--on-surface-variant)" }}>
        登录面试网，开始你的刷题之旅
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 注册成功提示 */}
        {registered && (
          <div
            className="px-4 py-3 rounded-md text-sm"
            style={{
              backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
              color: "var(--primary)",
            }}
          >
            注册成功，请使用新账号登录
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div
            className="px-4 py-3 rounded-md text-sm"
            style={{
              backgroundColor: "var(--error-container)",
              color: "var(--error)",
            }}
          >
            {error}
          </div>
        )}

        {/* 邮箱输入 */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--on-surface)" }}
          >
            邮箱
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入邮箱地址"
            required
            className="w-full px-4 py-2.5 text-sm rounded-md outline-none transition-all duration-200"
            style={{
              backgroundColor: "var(--surface-bright)",
              border: "1px solid var(--outline-variant)",
              color: "var(--on-surface)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--outline-variant)")}
          />
        </div>

        {/* 密码输入 */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--on-surface)" }}
          >
            密码
          </label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            required
          />
        </div>

        {/* 登录按钮 */}
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? "登录中..." : "登录"}
        </Button>

        {/* 注册链接 */}
        <p className="text-sm text-center mt-6" style={{ color: "var(--on-surface-variant)" }}>
          还没有账号？{" "}
          <Link
            href="/register"
            data-skip-touch-min-height
            className="font-medium underline-offset-4 hover:underline"
            style={{ color: "var(--primary)" }}
          >
            立即注册
          </Link>
        </p>
      </form>
    </div>
  );
}
