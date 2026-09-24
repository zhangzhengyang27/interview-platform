"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, FileText, Layers, ChevronLeft } from "lucide-react";
import { DIFFICULTY_LABELS, getTagColor } from "@/lib/design-tokens";
import { QUESTION_TYPE_LABELS, type DbQuestion } from "@/app/questions/types";
import { cn } from "@/lib/utils";

interface SetDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover: string | null;
  viewCount: number;
  questionCount: number;
}

function QuestionSetDetail({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const pageSize = 24;

  const [detail, setDetail] = useState<SetDetail | null>(null);
  const [questions, setQuestions] = useState<DbQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const skip = (page - 1) * pageSize;
    fetch(`/api/question-sets/${slug}?take=${pageSize}&skip=${skip}`)
      .then(async (res) => {
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error ?? "加载失败");
        }
        return res.json();
      })
      .then((data) => {
        setDetail(data.set);
        setQuestions(data.questions);
        setTotal(data.total);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-4 md:p-margin-desktop max-w-[1440px] mx-auto w-full">
      {/* 返回 */}
      <Link
        href="/question-sets"
        className="inline-flex items-center gap-1 text-sm mb-4 hover:opacity-80"
        style={{ color: "var(--on-surface-variant)" }}
      >
        <ChevronLeft className="h-4 w-4" />
        返回题集列表
      </Link>

      {error ? (
        <div className="text-center py-24 text-sm" style={{ color: "var(--error)" }}>
          {error}
        </div>
      ) : !detail || loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* 题集头部 */}
          <div
            className="rounded-2xl border p-4 sm:p-6 mb-4 sm:mb-6"
            style={{
              backgroundColor: "var(--surface-bright)",
              borderColor: "var(--outline-variant)",
            }}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{
                  background: "linear-gradient(135deg, var(--primary-container), color-mix(in srgb, var(--primary-container) 60%, var(--surface-bright)))",
                }}
              >
                {detail.cover ?? "📚"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: "var(--primary-container)", color: "var(--on-primary-container)" }}
                  >
                    <Layers className="h-3 w-3" />
                    精选题集
                  </span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--on-surface)" }}>
                  {detail.name}
                </h1>
                {detail.description && (
                  <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    {detail.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    {detail.questionCount} 题
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {detail.viewCount} 次浏览
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 题目列表 */}
          {loading && questions.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-20 text-sm" style={{ color: "var(--on-surface-variant)" }}>
              该题集暂无题目
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questions.map((q) => (
                <QuestionCard key={q.id} q={q} />
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8 px-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/question-sets/${slug}?page=${p}`}
                  className={cn(
                    "w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors",
                    p === page
                      ? "font-semibold"
                      : "hover:bg-surface-high"
                  )}
                  style={
                    p === page
                      ? { backgroundColor: "var(--primary)", color: "var(--on-primary)" }
                      : { color: "var(--on-surface-variant)" }
                  }
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function QuestionCard({ q }: { q: DbQuestion }) {
  const difficulty = q.difficulty as "easy" | "medium" | "hard";
  const diffLabel = DIFFICULTY_LABELS[difficulty] ?? q.difficulty;
  const dotColor =
    { easy: "var(--success-text)", medium: "var(--warning-text)", hard: "var(--error)" }[difficulty] ??
    "var(--on-surface-variant)";
  const firstTag = q.tags?.[0];
  const tagColor = firstTag ? getTagColor(firstTag.tag) : null;
  const isCode = q.questionType === "code";

  return (
    <Link
      href={`/questions/${q.id}`}
      className="group block rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{ backgroundColor: "var(--surface-container-low)", borderColor: "var(--outline-variant)" }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
        <span className="text-[11px] font-medium" style={{ color: dotColor }}>
          {diffLabel}
        </span>
        <span className="text-[10px] text-on-surface-variant">
          {QUESTION_TYPE_LABELS[q.questionType] ?? q.questionType}
        </span>
      </div>
      <h4
        className="text-sm font-semibold leading-snug line-clamp-2 min-h-[2.6em] transition-colors"
        style={{ color: "var(--on-surface)" }}
      >
        <span className="group-hover:text-primary">{q.title}</span>
      </h4>
      <div className="flex items-center gap-1 mt-2">
        {firstTag && tagColor && (
          <span
            className="text-[11px] px-1.5 py-0.5 rounded-md truncate max-w-25"
            style={{ backgroundColor: tagColor.bg, color: tagColor.text }}
          >
            {firstTag.tag}
          </span>
        )}
        {q.tags.length > 1 && (
          <span className="text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
            +{q.tags.length - 1}
          </span>
        )}
        {isCode && (
          <span className="text-[10px] px-1 py-0.5 rounded border ml-auto" style={{ color: "var(--info-text)", borderColor: "var(--info-text)", opacity: 0.6 }}>
            代码
          </span>
        )}
      </div>
    </Link>
  );
}

export default function QuestionSetPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string | null>(null);
  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  if (!slug) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <QuestionSetDetail slug={slug} />;
}
