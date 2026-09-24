"use client";

import dynamic from "next/dynamic";

// 动态导入 CodeMirror 编辑器，减少首屏包大小
const CodeMirrorEditor = dynamic(() => import("./CodeMirrorEditor"), {
  ssr: false,
  loading: () => (
    <div
      className="rounded border border-outline-variant flex-1 flex animate-pulse"
      style={{ backgroundColor: "var(--code-bg)" }}
    >
      <div className="w-10 bg-surface-low" />
      <div className="flex-1" />
    </div>
  ),
});

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = "javascript",
  readOnly = false,
  className,
}: CodeEditorProps) {
  return (
    <CodeMirrorEditor
      value={value}
      onChange={onChange}
      language={language}
      readOnly={readOnly}
      className={className}
    />
  );
}
