"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  // 发送验证码倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email) {
      setError("请先填写邮箱");
      return;
    }
    if (countdown > 0) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "验证码发送失败");
        return;
      }
      setCountdown(60);
    } catch {
      setError("验证码发送失败，请稍后重试");
    } finally {
      setSending(false);
    }
  };

  const validate = (): string | null => {
    if (!name.trim()) return "请输入昵称";
    if (!email) return "请输入邮箱";
    if (!code) return "请输入邮箱验证码";
    if (!password) return "请输入密码";
    if (password.length < 6) return "密码至少需要 6 位字符";
    if (password !== confirmPassword) return "两次密码不一致";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      // 注册
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, password, code }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "注册失败");
      }

      // 注册成功后使用 NextAuth 自动登录
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // 自动登录失败也跳转到登录页
        router.push("/login?registered=true");
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "注册失败，请重试";
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
        创建账号
      </h1>
      <p className="text-sm text-center mb-8" style={{ color: "var(--on-surface-variant)" }}>
        加入面试网，开启高效刷题之旅
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
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

        {/* 昵称输入 */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--on-surface)" }}
          >
            昵称
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入昵称"
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

        {/* 验证码输入 */}
        <div>
          <label
            htmlFor="code"
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--on-surface)" }}
          >
            邮箱验证码
          </label>
          <div className="flex gap-2">
            <input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="请输入 6 位验证码"
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
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="shrink-0"
              disabled={sending || countdown > 0}
              onClick={handleSendCode}
            >
              {countdown > 0 ? `${countdown}s` : sending ? "发送中..." : "发送验证码"}
            </Button>
          </div>
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
            placeholder="至少 6 位字符"
            required
            minLength={6}
          />
        </div>

        {/* 确认密码输入 */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--on-surface)" }}
          >
            确认密码
          </label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再次输入密码"
            required
            minLength={6}
          />
        </div>

        {/* 注册按钮 */}
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
          {loading ? "注册中..." : "注册"}
        </Button>

        {/* 分隔线 */}
        {/* 登录链接 */}
        <p className="text-sm text-center mt-6" style={{ color: "var(--on-surface-variant)" }}>
          已有账号？{" "}
          <Link
            href="/login"
            className="font-medium underline-offset-4 hover:underline"
            style={{ color: "var(--primary)" }}
          >
            立即登录
          </Link>
        </p>
      </form>
    </div>
  );
}
