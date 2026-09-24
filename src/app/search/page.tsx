"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  question: "题目",
  solution: "题解",
  note: "笔记",
};

interface SearchResultItem {
  id: string;
  title: string;
  content?: string;
  author?: string | null;
  createdAt: string | Date;
  _type: string;
  questionId?: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(q);
  const [type, setType] = useState("all");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`)
      .then((r) => r.json())
      .then((data) => setResults(data.results ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [q, type]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-56px)] p-4 md:p-6" style={{ backgroundColor: "var(--background)" }}>
      <div className="max-w-3xl mx-auto">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              className="flex-1 px-4 py-2.5 rounded-lg border text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--outline-variant)" }}
              placeholder="搜索题目、题解、笔记..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-on-primary"
              style={{ backgroundColor: "var(--primary)" }}
            >
              搜索
            </button>
          </div>
        </form>

        {/* Type Filter */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "all", label: "全部" },
            { id: "question", label: "题目" },
            { id: "solution", label: "题解" },
            { id: "note", label: "笔记" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className="px-3 py-1.5 text-sm rounded-lg transition-colors"
              style={{
                backgroundColor: type === t.id ? "var(--primary)" : "var(--surface-container)",
                color: type === t.id ? "var(--on-primary)" : "var(--on-surface-variant)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-on-surface-variant">
              {q ? "未找到相关结果" : "输入关键词开始搜索"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((item) => (
              <Link
                key={`${item._type}-${item.id}`}
                href={
                  item._type === "question" ? `/questions/${item.id}` :
                  item._type === "solution" ? `/questions/${item.questionId}` :
                  "/experiences"
                }
              >
                <Card className="hoverable cursor-pointer">
                  <div className="flex items-start gap-3">
                    <span
                      className="shrink-0 px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: "var(--info-container)",
                        color: "var(--info)",
                      }}
                    >
                      {TYPE_LABELS[item._type] ?? item._type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-on-surface truncate">
                        {item.title}
                      </h3>
                      {item.content && (
                        <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                          {item.content}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
