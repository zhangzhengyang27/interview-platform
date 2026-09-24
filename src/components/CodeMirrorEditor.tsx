"use client";

import { useEffect, useRef, useState } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import type { LanguageSupport } from "@codemirror/language";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/useMounted";

// Statically import javascript (most common), lazy-load the rest
const languageLoaders: Record<string, () => Promise<LanguageSupport>> = {
  typescript: () => Promise.resolve(javascript({ typescript: true })),
  python: () => import("@codemirror/lang-python").then((m) => m.python()),
  java: () => import("@codemirror/lang-java").then((m) => m.java()),
  cpp: () => import("@codemirror/lang-cpp").then((m) => m.cpp()),
  sql: () => import("@codemirror/lang-sql").then((m) => m.sql()),
};

function getLanguageExtension(lang: string): LanguageSupport | Promise<LanguageSupport> {
  if (lang === "javascript" || !languageLoaders[lang]) {
    return javascript();
  }
  return languageLoaders[lang]();
}

interface CodeMirrorEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
}

export default function CodeMirrorEditor({
  value,
  onChange,
  language = "javascript",
  readOnly = false,
  className,
}: CodeMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const mounted = useMounted();
  const [langExtension, setLangExtension] = useState<LanguageSupport>(javascript());
  const [langReady, setLangReady] = useState(language === "javascript");
  // 追踪编辑器当前文档，供语言切换重建时保留用户输入
  const docRef = useRef<string>(value);

  // Load language extension when language changes
  useEffect(() => {
    const extOrPromise = getLanguageExtension(language);
    if (extOrPromise instanceof Promise) {
      setLangReady(false);
      extOrPromise.then((ext) => {
        setLangExtension(ext);
        setLangReady(true);
      });
    } else {
      setLangExtension(extOrPromise);
      setLangReady(true);
    }
  }, [language]);

  // 统一管理编辑器生命周期：挂载、语言切换、只读切换都走这里，
  // 每次先销毁旧实例再创建，避免语言切换时重复挂载导致编辑器重叠与泄漏。
  useEffect(() => {
    if (!mounted || !editorRef.current || !langReady) return;

    // 保留当前文档（用户输入在语言切换重建时不被清空）
    const currentDoc = viewRef.current
      ? viewRef.current.state.doc.toString()
      : docRef.current;

    // 先销毁旧实例，确保不重复挂载
    viewRef.current?.destroy();
    viewRef.current = null;

    const state = EditorState.create({
      doc: currentDoc,
      extensions: [
        basicSetup,
        langExtension,
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "13px",
            fontFamily: "'JetBrains Mono', monospace",
            backgroundColor: "var(--code-bg)",
          },
          ".cm-scroller": { overflow: "auto" },
          ".cm-content": { caretColor: "var(--code-caret)", color: "var(--code-text)" },
          ".cm-gutters": {
            backgroundColor: "var(--code-gutter-bg)",
            borderRight: "1px solid var(--code-gutter-border)",
            color: "var(--code-gutter-text)",
          },
          ".cm-activeLineGutter": { backgroundColor: "var(--code-bg)" },
          ".cm-activeLine": { backgroundColor: "var(--code-active-line)" },
          ".cm-selectionBackground": { backgroundColor: "var(--code-selection)" },
          ".cm-cursor": { borderLeftColor: "var(--code-caret)" },
          ".cm-focused .cm-selectionBackground": {
            backgroundColor: "var(--code-selection)",
          },
        }),
        ...(readOnly ? [EditorState.readOnly.of(true)] : []),
        ...(onChange
          ? [
              EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                  docRef.current = update.state.doc.toString();
                  onChange(update.state.doc.toString());
                }
              }),
            ]
          : []),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      if (viewRef.current === view) viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, langReady, langExtension, readOnly]);

  if (!mounted || !langReady) {
    return (
      <div
        className={cn(
          "rounded border border-outline-variant flex-1 flex",
          className
        )}
        style={{ backgroundColor: "var(--code-bg)" }}
      >
        <div
          className="w-10 bg-surface-low text-on-surface-variant/50 font-mono text-[13px] text-right py-3 pr-2 select-none border-r border-outline-variant/30 flex flex-col"
          style={{ color: "var(--code-gutter-text)" }}
        >
          {value.split("\n").map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <textarea
          className="flex-1 bg-transparent font-mono text-[13px] leading-[22px] p-3 focus:outline-none resize-none"
          style={{ color: "var(--code-text)" }}
          value={value}
          onChange={(e) => {
            docRef.current = e.target.value;
            onChange?.(e.target.value);
          }}
          readOnly={readOnly}
          spellCheck={false}
        />
      </div>
    );
  }

  return (
    <div
      ref={editorRef}
      className={cn(
        "rounded border border-outline-variant overflow-hidden w-full min-h-[200px] max-h-[50vh] md:max-h-none",
        className
      )}
      style={{ backgroundColor: "var(--code-bg)" }}
    />
  );
}
