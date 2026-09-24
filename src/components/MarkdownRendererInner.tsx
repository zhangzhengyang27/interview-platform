"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import rehypeSanitize from "rehype-sanitize"
import "highlight.js/styles/tokyo-night-dark.css"
import MermaidRenderer from "./MermaidRenderer"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRendererInner({ content, className }: MarkdownRendererProps) {
  return (
    <div className={`markdown-body ${className ?? ""}`} style={{ color: "var(--on-surface)" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-semibold mb-4 mt-6" style={{ color: "var(--on-surface)" }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-3 mt-5" style={{ color: "var(--on-surface)" }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mb-2 mt-4" style={{ color: "var(--on-surface)" }}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-3 leading-relaxed break-words" style={{ color: "var(--on-surface-variant)" }}>
              {children}
            </p>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code
                  className="font-mono text-[13px] px-1.5 py-0.5 rounded break-all"
                  style={{
                    backgroundColor: "var(--surface-container)",
                    color: "var(--primary)"
                  }}
                  {...props}>
                  {children}
                </code>
              )
            }
            // 检测 mermaid 代码块
            const match = /language-(\w+)/.exec(className ?? "")
            if (match && match[1] === "mermaid") {
              const chart = String(children).replace(/\n$/, "")
              return <MermaidRenderer chart={chart} />
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children, ...props }) => {
            // 如果 pre 内包含 mermaid 代码块，不渲染 pre 包裹
            const child = children as React.ReactElement<{ className?: string }>
            if (child?.props?.className) {
              const match = /language-(\w+)/.exec(child.props.className ?? "")
              if (match && match[1] === "mermaid") {
                return <>{children}</>
              }
            }
            return (
              <pre
                className="mb-4 overflow-x-auto"
                style={{ color: "var(--on-surface)", background: "var(--code-bg)" }}
                {...props}>
                {children}
              </pre>
            )
          },
          ul: ({ children }) => (
            <ul
              className="list-disc pl-6 mb-3 space-y-1"
              style={{ color: "var(--on-surface-variant)" }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className="list-decimal pl-6 mb-3 space-y-1"
              style={{ color: "var(--on-surface-variant)" }}>
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong style={{ color: "var(--on-surface)", fontWeight: 600 }}>{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className="border-l-4 pl-4 my-3 italic opacity-80"
              style={{ borderColor: "var(--primary)" }}>
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th
              className="border px-3 py-2 text-left font-semibold"
              style={{
                borderColor: "var(--outline-variant)",
                backgroundColor: "var(--surface-container)",
                color: "var(--on-surface)"
              }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className="border px-3 py-2"
              style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}>
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="underline hover:opacity-80 transition-opacity break-all"
              style={{ color: "var(--tertiary)" }}
              target="_blank"
              rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt ?? ""}
              loading="lazy"
              className="rounded-lg my-2"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          ),
          hr: () => <hr className="my-4 border-[var(--outline-variant)]" />
        }}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
