"use client"

import dynamic from "next/dynamic"

interface MarkdownRendererProps {
  content: string
  className?: string
}

// 动态导入实际的 Markdown 渲染器，将 rehype-highlight / highlight.js 等大依赖延迟加载
const MarkdownRendererInner = dynamic(() => import("./MarkdownRendererInner"), {
  ssr: false,
  loading: () => (
    <div className="markdown-body">
      <p style={{ color: "var(--on-surface-variant)" }}>加载中...</p>
    </div>
  ),
})

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return <MarkdownRendererInner content={content} className={className} />
}
