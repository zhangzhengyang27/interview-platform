"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  title: string;
  difficulty: string;
  questionType: string;
  tags: { tag: string }[];
}

const STEPS = ["基本信息", "选择题目", "预览确认", "创建成功"];

export default function NewTestPaperPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [paperId, setPaperId] = useState<string | null>(null);

  // 加载题目列表
  useEffect(() => {
    const params = new URLSearchParams({ take: "100" });
    if (search) params.set("search", search);
    fetch(`/api/questions?${params}`)
      .then((r) => r.json())
      .then((data) => setQuestions(data.questions ?? []));
  }, [search]);

  const toggleQuestion = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedQuestions = questions.filter((q) => selectedIds.includes(q.id));

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/test-papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          detail,
          isPublic,
          questionIds: selectedIds,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPaperId(data.id);
        setStep(3);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-56px)] p-4 md:p-6 lg:p-8" style={{ backgroundColor: "var(--background)" }}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-on-surface mb-6">📝 创建试卷</h1>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  i < step ? "bg-primary text-on-primary" :
                  i === step ? "bg-primary text-on-primary" :
                  "bg-surface-container text-on-surface-variant"
                )}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span className={cn("text-sm hidden sm:inline", i <= step ? "text-on-surface" : "text-on-surface-variant")}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className="w-8 h-px" style={{ backgroundColor: "var(--outline-variant)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Basic Info */}
        {step === 0 && (
          <Card>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">试卷名称 *</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  style={{ backgroundColor: "var(--surface)", borderColor: "var(--outline-variant)" }}
                  placeholder="如：字节跳动后端一面模拟"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">描述</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border text-sm text-on-surface outline-none resize-none focus:ring-2 focus:ring-primary"
                  style={{ backgroundColor: "var(--surface)", borderColor: "var(--outline-variant)" }}
                  placeholder="试卷描述（可选）"
                  rows={3}
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                <span className="text-sm text-on-surface">公开试卷（其他用户可见）</span>
              </label>
              <div className="flex justify-end">
                <Button variant="primary" disabled={!title.trim()} onClick={() => setStep(1)}>
                  下一步：选择题目
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 1: Select Questions */}
        {step === 1 && (
          <Card>
            <div className="space-y-4">
              <input
                className="w-full px-3 py-2 rounded-lg border text-sm text-on-surface outline-none"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--outline-variant)" }}
                placeholder="搜索题目..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="text-sm text-on-surface-variant">
                已选 {selectedIds.length} 题
              </div>
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {questions.map((q) => (
                  <label
                    key={q.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors",
                      selectedIds.includes(q.id) ? "border-primary" : ""
                    )}
                    style={{
                      borderColor: selectedIds.includes(q.id) ? "var(--primary)" : "var(--outline-variant)",
                      backgroundColor: selectedIds.includes(q.id) ? "color-mix(in srgb, var(--primary) 8%, transparent)" : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(q.id)}
                      onChange={() => toggleQuestion(q.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface truncate">{q.title}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={cn("text-xs px-1.5 py-0.5 rounded",
                          q.difficulty === "easy" ? "bg-success-container text-success" :
                          q.difficulty === "medium" ? "bg-warning-container text-warning" :
                          "bg-error-container text-error"
                        )}>
                          {q.difficulty === "easy" ? "简单" : q.difficulty === "medium" ? "中等" : "困难"}
                        </span>
                        <span className="text-xs text-on-surface-variant">{q.questionType}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep(0)}>上一步</Button>
                <Button variant="primary" disabled={selectedIds.length === 0} onClick={() => setStep(2)}>
                  下一步：预览
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
              {detail && <p className="text-sm text-on-surface-variant">{detail}</p>}
              <div className="text-sm text-on-surface-variant">
                共 {selectedIds.length} 题 | {isPublic ? "公开" : "私有"}
              </div>
              <ol className="space-y-2">
                {selectedQuestions.map((q, i) => (
                  <li key={q.id} className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: "var(--surface-container)", color: "var(--on-surface-variant)" }}>
                      {i + 1}
                    </span>
                    <span className="text-on-surface">{q.title}</span>
                  </li>
                ))}
              </ol>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setStep(1)}>上一步</Button>
                <Button variant="primary" onClick={handleCreate} disabled={loading}>
                  {loading ? "创建中..." : "创建试卷"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Success */}
        {step === 3 && paperId && (
          <Card>
            <div className="text-center py-8 space-y-4">
              <div className="text-4xl">🎉</div>
              <h3 className="text-xl font-semibold text-on-surface">试卷创建成功！</h3>
              <div className="flex gap-3 justify-center">
                <Button variant="primary" onClick={() => router.push(`/test-papers/${paperId}`)}>
                  查看试卷
                </Button>
                <Button variant="secondary" onClick={() => router.push("/test-papers")}>
                  返回列表
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
