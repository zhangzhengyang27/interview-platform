"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface SolutionEditorProps {
  questionId: string;
  onSubmit: (content: string, language?: string) => Promise<void>;
  onCancel: () => void;
}

const LANGUAGE_OPTIONS = [
  { value: "", label: "无" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

export function SolutionEditor({ onSubmit, onCancel }: SolutionEditorProps) {
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;

    setLoading(true);
    try {
      await onSubmit(content.trim(), language || undefined);
      setContent("");
      setLanguage("");
      setIsPreview(false);
    } catch (error) {
      console.error("Failed to submit solution:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-lg border p-4"
      style={{ borderColor: "var(--outline-variant)", backgroundColor: "var(--surface-low)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-on-surface">编写题解</h3>
        <button
          onClick={onCancel}
          className="text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Language Selector */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-on-surface-variant mb-1">
          编程语言（可选）
        </label>
        <Select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="cursor-pointer"
        >
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Editor / Preview */}
      {!isPreview ? (
        <textarea
          className="w-full min-h-[200px] bg-transparent border border-outline-variant text-on-surface text-sm rounded p-3 outline-none focus:border-primary resize-y transition-colors placeholder:text-on-surface-variant"
          placeholder="在这里写下你的解题思路...&#10;&#10;支持 Markdown 格式：&#10;- 使用 # ## ### 表示标题&#10;- 使用 **文字** 表示加粗&#10;- 使用 `代码` 表示行内代码&#10;- 使用 ```代码块``` 表示代码块"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      ) : (
        <div
          className="min-h-[200px] max-h-[400px] overflow-y-auto rounded border p-3"
          style={{
            borderColor: "var(--outline-variant)",
            backgroundColor: "var(--background)",
          }}
        >
          {content ? (
            <MarkdownRenderer content={content} />
          ) : (
            <p className="text-on-surface-variant text-sm">暂无内容</p>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="mt-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPreview(!isPreview)}
        >
          {isPreview ? "编辑" : "预览"}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            取消
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!content.trim() || loading}
            onClick={handleSubmit}
          >
            {loading ? "发布中..." : "发布题解"}
          </Button>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-on-surface-variant">
        支持 Markdown 语法，请确保内容清晰易懂，帮助其他用户理解解题思路。
      </p>
    </div>
  );
}
