"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";

// 初始化 mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
});

interface MermaidRendererProps {
  chart: string;
}

// 预处理 Mermaid 图表内容，转义可能导致解析失败的特殊字符
function preprocessMermaidChart(chart: string): string {
  // 转义 @ 符号（如 Java 注解 @PostConstruct）
  // Mermaid 中 @ 被解析为 LINK_ID 令牌，会导致解析错误
  let result = chart.replace(/@/g, "&#64;");

  // 处理矩形节点文本中的嵌套方括号，例如 E1_0[table[0]: ...]
  // Mermaid 会把第一个 ] 当作节点结束，导致后续内容解析失败。
  // 把这类节点文本用双引号包裹，让内部方括号被视为普通文本。
  let prev = "";
  while (prev !== result) {
    prev = result;
    result = result.replace(
      /(\s|^)([A-Za-z0-9_\-]+)\[([^\[\]\r\n]*\[[^\[\]\r\n]*\][^\[\]\r\n]*)\]/g,
      (_match, prefix, id, text) => {
        const alreadyQuoted =
          (text.startsWith('"') && text.endsWith('"')) ||
          (text.startsWith("'") && text.endsWith("'"));
        if (alreadyQuoted) return _match;
        return `${prefix}${id}["${text.replace(/"/g, '\\"')}"]`;
      }
    );
  }

  return result;
}

function generateMermaidId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `mermaid-${crypto.randomUUID()}`;
  }
  return `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function MermaidRenderer({ chart }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const abortedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || !chart) return;
    abortedRef.current = false;

    const renderMermaid = async () => {
      const id = generateMermaidId();
      try {
        const processedChart = preprocessMermaidChart(chart);
        const { svg } = await mermaid.render(id, processedChart);
        if (abortedRef.current || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
      } catch (error) {
        console.error("Mermaid 渲染失败:", error);
        if (!abortedRef.current && containerRef.current) {
          containerRef.current.innerHTML = `<div style="color: red; padding: 10px;">Mermaid 渲染失败: ${error instanceof Error ? error.message : "未知错误"}</div>`;
        }
      } finally {
        // 清理 mermaid.render 在 body 中创建的临时容器，避免撑开页面
        document.getElementById(`d${id}`)?.remove();
      }
    };

    renderMermaid();

    return () => {
      abortedRef.current = true;
    };
  }, [chart]);

  return <div ref={containerRef} className="mermaid-container" />;
}
