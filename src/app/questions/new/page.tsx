"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, FormError } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CodeEditor } from "@/components/CodeEditor";
import { Difficulty, TestCase } from "@/types";
import { CODE_LANGUAGES } from "@/lib/design-tokens";
import { QUESTION_TYPE_META, getQuestionTypeMeta } from "@/lib/question-types";
import { cn } from "@/lib/utils";
import { uploadToOSS } from "@/lib/oss-upload";

type QuestionType = "code" | "qa";

interface Category {
  id: string;
  name: string;
  type: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AVAILABLE_TAGS = [
  "JavaScript", "React", "前端", "算法", "数据结构",
  "动态规划", "哈希表", "树", "链表", "系统设计",
  "Redis", "MySQL", "网络", "操作系统", "Python",
];


export default function NewQuestionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionType, setQuestionType] = useState<QuestionType>("qa");
  const [content, setContent] = useState("");
  const [solution, setSolution] = useState("");
  const [code, setCode] = useState("var twoSum = function(nums, target) {\n  // Write your code here\n};");
  const [language, setLanguage] = useState("javascript");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [company, setCompany] = useState("");
  const [tags, setTags] = useState<string[]>(["JavaScript"]);
  const [tagInput, setTagInput] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: "nums = [2,7,11,15]\ntarget = 9", expected: "[0,1]", isPublic: true },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [touched, setTouched] = useState<{ title: boolean; content: boolean }>({ title: false, content: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const titleError = touched.title && !title.trim() ? "题目标题为必填项" : undefined;
  const contentError = touched.content && !content.trim() ? "题目描述为必填项" : undefined;

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, []);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const addTestCase = () => {
    setTestCases([...testCases, { input: "", expected: "", isPublic: false }]);
  };

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: string | boolean) => {
    setTestCases(
      testCases.map((tc, i) =>
        i === index ? { ...tc, [field]: value } : tc
      )
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("只支持图片文件"); return; }
    if (file.size > 10 * 1024 * 1024) { setError("图片大小不能超过 10MB"); return; }

    setError("");
    setUploadingImage(true);
    try {
      const url = await uploadToOSS(file);
      setContent((prev) => `${prev}\n![${file.name}](${url})\n`.trimStart());
    } catch {
      setError("图片上传失败，请重试");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePublish = async () => {
    // 标记所有字段为 touched
    setTouched({ title: true, content: true });

    if (!title.trim()) { setError("请填写题目标题"); return; }
    if (!content.trim()) { setError("请填写题目描述"); return; }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          difficulty,
          questionType,
          content: content.trim(),
          solution: solution.trim() || null,
          codeTemplate: questionType === "code" ? { [language]: code } : undefined,
          company: company.trim() || null,
          categoryId: categoryId || null,
          tags,
        }),
      });

      if (res.ok) {
        router.push("/questions");
      } else {
        const data = await res.json();
        setError(data.error ?? "发布失败，请重试");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-56px)] overflow-y-auto p-4 md:p-8">
      <div className="max-w-[860px] mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-high rounded transition-colors"
              aria-label="返回上一页"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-on-surface tracking-tight">新增题目</h1>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="secondary" onClick={() => router.back()} className="flex-1 sm:flex-none">取消</Button>
            <Button
              variant="primary"
              onClick={handlePublish}
              disabled={submitting}
              className="flex-1 sm:flex-none"
            >
              {submitting ? "发布中..." : "正式发布题目"}
            </Button>
          </div>
        </div>

        {error && (
          <div
            className="px-4 py-3 rounded-md text-sm"
            style={{ backgroundColor: "var(--error-container)", color: "var(--error)", border: "1px solid var(--error)" }}
          >
            {error}
          </div>
        )}

        {/* Question Type Selector */}
        <div
          className="rounded-lg border overflow-hidden"
          style={{ backgroundColor: "var(--surface-container)", borderColor: "var(--outline-variant)" }}
        >
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-on-surface-variant shrink-0">
              题目类型
            </span>
            <div className="flex gap-2 flex-wrap">
              {(["qa", "code"] as QuestionType[]).map((t) => {
                const isActive = questionType === t;
                const meta = QUESTION_TYPE_META[t];
                const color = { active: meta.color.bg, border: meta.color.text, text: meta.color.text };
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setQuestionType(t)}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all"
                    style={
                      isActive
                        ? { backgroundColor: color.active, border: `1px solid ${color.border}`, color: color.text }
                        : { backgroundColor: "transparent", border: "1px solid var(--outline-variant)", color: "var(--on-surface-variant)" }
                    }
                  >
                    {t === "code" ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    )}
                    {meta.label}
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-on-surface-variant sm:ml-2">
              {questionType === "code" ? "需要编写代码的算法/编程题目" : "面试问答题，考察口头表达和知识点理解"}
            </span>
          </div>
        </div>

        {/* Form Card */}
        <div
          className="rounded-lg border overflow-hidden"
          style={{ backgroundColor: "var(--surface-container)", borderColor: "var(--outline-variant)" }}
        >
          <div className="p-6 flex flex-col gap-8">
            {/* Basic Info */}
            <section>
              <label className="block text-[11px] font-mono font-semibold uppercase text-on-surface-variant mb-2">
                基本信息
              </label>
              <Input
                placeholder="题目标题 (例如: 两数之和)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
                error={!!titleError}
                aria-invalid={!!titleError}
              />
              {titleError && <FormError>{titleError}</FormError>}
            </section>

            {/* Category & Company & Difficulty */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[11px] font-mono font-semibold uppercase text-on-surface-variant mb-2">
                  技术分类
                </label>
                <Select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="cursor-pointer"
                >
                  <option value="">选择分类...</option>
                  {categories
                    .filter((c) => c.type === "tech")
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </Select>
              </div>
              <div>
                <label className="block text-[11px] font-mono font-semibold uppercase text-on-surface-variant mb-2">
                  来源公司 / 场景
                </label>
                <Select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="cursor-pointer"
                >
                  <option value="">无特定公司</option>
                  {categories
                    .filter((c) => c.type === "company")
                    .map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                </Select>
              </div>
              <div>
                <label className="block text-[11px] font-mono font-semibold uppercase text-on-surface-variant mb-2">
                  难度
                </label>
                <div className="flex gap-2">
                  {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
                    const labels = { easy: "简单", medium: "中等", hard: "困难" };
                    const colors = {
                      easy: { active: "var(--info-container)", border: "var(--info-text)", text: "var(--info-text)" },
                      medium: { active: "var(--warning-container)", border: "var(--warning-text)", text: "var(--warning-text)" },
                      hard: { active: "var(--error-container)", border: "var(--error)", text: "var(--error)" },
                    };
                    const c = colors[d];
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className="flex-1 py-2 rounded-md text-sm font-medium transition-colors"
                        style={
                          difficulty === d
                            ? {
                                backgroundColor: c.active,
                                border: `1px solid ${c.border}`,
                                color: c.text,
                              }
                            : {
                                backgroundColor: "transparent",
                                border: "1px solid var(--outline-variant)",
                                color: "var(--on-surface-variant)",
                              }
                        }
                      >
                        {labels[d]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Content Editor */}
            <section>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 mb-2">
                <label className="block text-[11px] font-mono font-semibold uppercase text-on-surface-variant">
                  题目描述 (Markdown)
                </label>
                <div
                  className="flex gap-1 rounded px-1 py-0.5"
                  style={{ backgroundColor: "var(--surface-variant)" }}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {[
                    { icon: "B", title: "粗体" },
                    { icon: "I", title: "斜体" },
                    { icon: "<>", title: "代码块" },
                    { icon: "Link", title: "链接" },
                  ].map((btn) => (
                    <button
                    key={btn.title}
                    type="button"
                    className="p-1 text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-high transition-colors"
                    title={btn.title}
                    aria-label={btn.title}
                  >
                      <span className="text-xs font-mono font-bold">{btn.icon}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => !uploadingImage && fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="p-1 text-on-surface-variant hover:text-on-surface rounded hover:bg-surface-high transition-colors disabled:opacity-50"
                    title="上传图片"
                    aria-label="上传图片"
                  >
                    {uploadingImage ? (
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <Textarea
                placeholder="输入题目描述，支持 Markdown 语法..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, content: true }))}
                rows={6}
                className={cn("font-mono text-sm", contentError && "border-error focus:border-error")}
                aria-invalid={!!contentError}
              />
              {contentError && <FormError>{contentError}</FormError>}
            </section>

            {/* Solution */}
            <section>
              <label className="block text-[11px] font-mono font-semibold uppercase text-on-surface-variant mb-2">
                参考答案 / 题解 (Markdown)
              </label>
              <Textarea
                placeholder="输入题解，支持 Markdown..."
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </section>

            {/* Code Template — code questions only */}
            {getQuestionTypeMeta(questionType).needsTemplate && (
            <section>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 mb-2">
                <label className="block text-[11px] font-mono font-semibold uppercase text-on-surface-variant">
                  初始代码模板
                </label>
                <Select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="border-none text-xs cursor-pointer"
                >
                  {CODE_LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="rounded-md overflow-hidden border" style={{ borderColor: "var(--outline-variant)" }}>
                <CodeEditor value={code} onChange={setCode} language={language} />
              </div>
            </section>
            )}

            {/* Test Cases — code questions only */}
            {getQuestionTypeMeta(questionType).needsTemplate && (
            <section>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <label className="block text-[11px] font-mono font-semibold uppercase text-on-surface-variant">
                  测试用例
                </label>
                <button
                  type="button"
                  onClick={addTestCase}
                  className="flex items-center gap-1 text-primary hover:brightness-110 text-sm transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  添加用例
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {testCases.map((tc, i) => (
                  <div
                    key={i}
                    className="rounded-md p-4 relative group"
                    style={{ backgroundColor: "var(--surface-low)", border: "1px solid var(--outline-variant)" }}
                  >
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => removeTestCase(i)}
                        className="p-1.5 text-on-surface-variant hover:text-error rounded hover:bg-error/10 transition-colors"
                        aria-label={`删除测试用例 ${i + 1}`}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-[12px] text-on-surface-variant mb-1 font-mono">输入 (Input)</div>
                        <Textarea
                          placeholder="nums = [2,7,11,15]\ntarget = 9"
                          value={tc.input}
                          onChange={(e) => updateTestCase(i, "input", e.target.value)}
                          rows={2}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div>
                        <div className="text-[12px] text-on-surface-variant mb-1 font-mono">预期输出 (Expected)</div>
                        <Textarea
                          placeholder="[0,1]"
                          value={tc.expected}
                          onChange={(e) => updateTestCase(i, "expected", e.target.value)}
                          rows={2}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tc.isPublic}
                        onChange={(e) => updateTestCase(i, "isPublic", e.target.checked)}
                        id={`public-${i}`}
                        className="rounded"
                        style={{ accentColor: "var(--primary)" }}
                      />
                      <label htmlFor={`public-${i}`} className="text-[13px] text-on-surface-variant cursor-pointer">
                        作为公开示例 (展示在题目描述中)
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            )}

            {/* Tags */}
            <section>
              <label className="block text-[11px] font-mono font-semibold uppercase text-on-surface-variant mb-2">
                附加标签
              </label>
              <div
                className="flex flex-wrap items-center gap-2 border rounded-md px-3 py-2 min-h-[44px] focus-within:border-primary transition-colors"
                style={{
                  backgroundColor: "var(--surface-highest)",
                  borderColor: "var(--outline-variant)",
                }}
              >
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-sm"
                    style={{ backgroundColor: "var(--surface-variant)", color: "var(--on-surface)" }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-primary transition-colors"
                      aria-label={`移除标签 ${tag}`}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
                <input
                  className="flex-1 bg-transparent border-none text-on-surface text-sm p-0 focus:ring-0 min-w-[150px]"
                  placeholder="输入标签后按回车..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
              </div>
            </section>
          </div>
        </div>
        <div className="h-12" />
      </div>
    </div>
  );
}
