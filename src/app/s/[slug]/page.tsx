"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DifficultyBadge, TagBadge } from "@/components/ui/Badge";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface ShareData {
  id: string;
  type: string;
  targetId: string;
  slug: string;
  views: number;
  createdAt: string;
  expiresAt: string | null;
  creator: { id: string; name: string | null; image: string | null } | null;
  targetContent:
    | ({
        id: string;
        title: string;
        content: string;
        difficulty?: string;
        questionType?: string;
        tags?: { tag: string }[];
        company?: string | null;
        solution?: string | null;
      } & Record<string, unknown>)
    | null;
}

export default function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [slug, setSlug] = useState<string>("");
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/share?slug=${encodeURIComponent(slug)}`)
      .then(async (r) => {
        if (!r.ok) {
          if (r.status === 404 || r.status === 410) {
            throw new Error("分享链接不存在或已过期");
          }
          throw new Error("加载失败");
        }
        return r.json();
      })
      .then((res) => setData(res))
      .catch((err) => setError(err.message ?? "加载失败"))
      .finally(() => setLoading(false));
  }, [slug]);

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant">正在加载分享内容...</span>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !data?.targetContent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--background)" }}>
        <div className="max-w-md text-center">
          {/* 空状态图标 */}
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--surface-variant)" }}
          >
            <svg
              className="w-10 h-10 text-on-surface-variant"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/>
              <path d="M11 13h.01"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-on-surface mb-2">
            {error || "内容不存在"}
          </h1>
          <p className="text-sm text-on-surface-variant mb-6">
            该分享链接可能已被删除或已过期
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-on-primary-container transition-all hover:brightness-110"
            style={{ backgroundColor: "var(--primary-container)" }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const content = data.targetContent;

  return (
    <div className="min-h-screen py-8 px-4 md:px-8" style={{ backgroundColor: "var(--background)" }}>
      <div className="max-w-3xl mx-auto">
        {/* 头部分享信息 */}
        <div
          className="rounded-t-xl px-6 py-5 flex items-center justify-between"
          style={{
            backgroundColor: "var(--surface-high)",
            borderBottom: "1px solid var(--outline-variant)",
          }}
        >
          <div className="flex items-center gap-3">
            {/* Logo / 品牌标识 */}
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-primary hover:text-primary-fixed transition-colors"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />
              </svg>
              <span className="text-base">面试网</span>
            </Link>

            <span style={{ color: "var(--outline)" }}>·</span>

            <span className="text-xs text-on-surface-variant">
              分享自 {data.creator?.name ?? "匿名用户"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {data.views} 次浏览
            </span>
          </div>
        </div>

        {/* 内容区 */}
        <div
          className="rounded-b-xl overflow-hidden shadow-lg"
          style={{
            backgroundColor: "var(--surface-bright)",
            border: "1px solid var(--outline-variant)",
            borderTop: "none",
          }}
        >
          {/* 类型标签 */}
          <div className="px-6 pt-5 pb-3">
            <span
              className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{
                backgroundColor:
                  data.type === "question"
                    ? "var(--info-container)"
                    : "var(--warning-container)",
                color:
                  data.type === "question"
                    ? "var(--info-text)"
                    : "var(--warning-text)",
              }}
            >
              {data.type === "question" ? "📝 面试题" : data.type === "note" ? "📒 面经笔记" : "🎯 面试结果"}
            </span>
          </div>

          {/* 标题 */}
          <h1 className="px-6 pb-4 text-xl md:text-2xl font-bold text-on-surface leading-tight">
            {content.title}
          </h1>

          {/* 元信息（仅题目类型） */}
          {data.type === "question" && (
            <div className="px-6 pb-4 flex flex-wrap items-center gap-2">
              {(content as { difficulty?: string }).difficulty && (
                <DifficultyBadge
                  difficulty={(content as { difficulty: string }).difficulty as "easy" | "medium" | "hard"}
                />
              )}
              {(content as { tags?: { tag: string }[] }).tags?.map((t) => (
                <TagBadge key={t.tag} tag={t.tag} />
              ))}
              {(content as { company?: string | null }).company && (
                <TagBadge tag={(content as { company: string }).company} />
              )}
            </div>
          )}

          {/* 正文内容 */}
          <div className="px-6 pb-6">
            <div
              className="rounded-lg p-5 prose-sm max-w-none"
              style={{
                backgroundColor: "var(--surface-low)",
                border: "1px solid var(--outline-variant)",
              }}
            >
              <MarkdownRenderer content={content.content} />

              {/* 题目类型的题解 */}
              {data.type === "question" && (content as { solution?: string | null }).solution && (
                <details className="mt-5 group">
                  <summary
                    className="cursor-pointer text-sm font-medium text-primary hover:text-primary-fixed transition-colors list-none flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4 transition-transform group-open:rotate-90"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    查看答案解析
                  </summary>
                  <div className="mt-3 pl-6">
                    <MarkdownRenderer
                      content={(content as { solution: string }).solution!}
                    />
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>

        {/* 底部 CTA */}
        <div
          className="mt-8 rounded-xl p-8 text-center"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, transparent), color-mix(in srgb, var(--tertiary) 6%, transparent))",
            border: "1px solid var(--outline-variant)",
          }}
        >
          <h2 className="text-lg font-bold text-on-surface mb-2">
            来面试网开始你的面试准备 🚀
          </h2>
          <p className="text-sm text-on-surface-variant mb-5">
            海量题库 · 模拟面试 · 学习计划 · 真题实战
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-on-primary-container shadow-md transition-all hover:brightness-110 active:scale-95"
            style={{ backgroundColor: "var(--primary-container)" }}
          >
            立即开始
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>

        {/* 页脚 */}
        <footer className="mt-8 text-center text-[11px] text-on-surface-variant space-y-1">
          <p>
            分享于{" "}
            {new Date(data.createdAt).toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {data.expiresAt && (
              <>
                {" "}
                · 有效期至{" "}
                {new Date(data.expiresAt).toLocaleDateString("zh-CN")}
              </>
            )}
          </p>
          <p>
            由{" "}
            <Link href="/" className="font-medium text-primary hover:text-primary-fixed">
              面试网
            </Link>{" "}
            提供支持
          </p>
        </footer>
      </div>
    </div>
  );
}
