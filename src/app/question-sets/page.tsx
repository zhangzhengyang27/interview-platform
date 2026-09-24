"use client";

import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { Layers, Eye, FileText } from "lucide-react";

interface QuestionSetItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover: string | null;
  viewCount: number;
  questionCount: number;
}

export default function QuestionSetsPage() {
  const { data, error, isLoading } = useSWR<{ sets: QuestionSetItem[] }>(
    "/api/question-sets",
    fetcher
  );

  const sets = data?.sets ?? [];

  return (
    <div className="p-4 md:p-margin-desktop max-w-[1440px] mx-auto w-full">
      {/* 页面标题 */}
      <div className="mb-8">
        <div
          className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: "var(--primary-container)", color: "var(--on-primary-container)" }}
        >
          <Layers className="h-3.5 w-3.5" />
          精选题集
        </div>
        <h1 className="text-3xl font-semibold mb-1" style={{ color: "var(--on-surface)" }}>
          精选面试题集
        </h1>
        <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
          由平台整理的常见面试题合集，按主题/方向分类，助你高效备考
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-24 text-sm" style={{ color: "var(--error)" }}>
          加载失败，请稍后重试
        </div>
      ) : sets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Layers className="w-16 h-16 mb-4" style={{ color: "var(--on-surface-variant)" }} />
          <h3 className="text-lg font-semibold" style={{ color: "var(--on-surface)" }}>
            暂无题集
          </h3>
          <p className="text-sm mt-1" style={{ color: "var(--on-surface-variant)" }}>
            题集正在准备中，敬请期待
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {sets.map((set) => (
            <Link
              key={set.id}
              href={`/question-sets/${set.slug}`}
              className="group rounded-2xl border p-4 sm:p-5 flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{
                backgroundColor: "var(--surface-bright)",
                borderColor: "var(--outline-variant)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{
                  background: "linear-gradient(135deg, var(--primary-container), color-mix(in srgb, var(--primary-container) 60%, var(--surface-bright)))",
                }}
              >
                {set.cover ?? "📚"}
              </div>
              <h3
                className="text-base font-semibold mb-1 group-hover:text-primary transition-colors"
                style={{ color: "var(--on-surface)" }}
              >
                {set.name}
              </h3>
              {set.description && (
                <p
                  className="text-sm mb-4 flex-1 line-clamp-2"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  {set.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {set.questionCount} 题
                </span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {set.viewCount}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
