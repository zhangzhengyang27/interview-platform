"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { ChatMessage } from "@/types";
import { generateId } from "@/lib/utils";
import { uploadToOSS } from "@/lib/oss-upload";
import { parseSSEStream, type DeepSeekStreamEvent } from "@/lib/sse";

const SHORTCUTS = [
  {
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    label: "题目解析",
    desc: "输入题目名称，获取算法思路和代码参考",
    prompt: "请帮我解析一道算法题：",
  },
  {
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
        <path d="M11 8v6M8 11h6" />
      </svg>
    ),
    label: "语义搜索",
    desc: "用自然语言描述问题，AI 帮你找到相关题目",
    prompt: "我想找一道关于",
  },
  {
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    label: "模拟面试",
    desc: "AI 随机出题，模拟真实面试场景",
    prompt: "好，我们开始模拟面试。请出一道前端相关的算法或系统设计题。",
  },
  {
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
    label: "优化答案",
    desc: "粘贴你的回答，AI 给出改进建议",
    prompt: "请帮我优化和改进下面这个面试回答：",
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "init",
    role: "assistant",
    content: "你好！我是你的技术面试助手。我可以帮你解析复杂算法题，提供系统设计反馈，或者进行一对一的模拟面试。请问今天想从哪里开始？",
    timestamp: new Date().toISOString(),
  },
];

export default function AIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [historyMessages, setHistoryMessages] = useState<ChatMessage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // AbortController 用于中止流式请求
  const abortControllerRef = useRef<AbortController | null>(null);

  // 自动滚动到底部
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [historyMessages, isTyping]);

  const callAI = async (userContent: string) => {
    setIsTyping(true);
    setApiError(null);

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: userContent,
      timestamp: new Date().toISOString(),
    };

    const aiMsgId = generateId();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };

    const updatedHistory: ChatMessage[] = [...historyMessages, userMsg, aiMsg];
    setHistoryMessages(updatedHistory);

    // 创建新的 AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [...historyMessages, userMsg].map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      // 使用公共的 parseSSEStream 解析流式响应
      let fullContent = "";
      await parseSSEStream(res, (event) => {
        const chunk = event as unknown as DeepSeekStreamEvent;
        // DeepSeek 流式响应格式：{ choices: [{ delta: { content: "..." } }] }
        if (chunk.choices?.[0]?.delta?.content) {
          fullContent += chunk.choices[0].delta.content;
          setHistoryMessages((prev) =>
            prev.map((m) => (m.id === aiMsgId ? { ...m, content: fullContent } : m))
          );
        }
      });

      // 确保最终内容被设置（处理边界情况）
      if (fullContent) {
        setHistoryMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, content: fullContent } : m))
        );
      }
    } catch (err) {
      // 如果是用户主动中止，不显示错误
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setApiError(err instanceof Error ? err.message : "请求失败");
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  // 中止当前生成
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsTyping(false);
  };

  // 重试最后一次失败的请求
  const retryLastRequest = () => {
    if (historyMessages.length >= 2) {
      const lastUserMsg = [...historyMessages].reverse().find((m) => m.role === "user");
      if (lastUserMsg) {
        // 移除最后一条空的 AI 消息（如果有）
        setHistoryMessages((prev) => {
          const filtered = [...prev];
          if (filtered.length > 0 && filtered[filtered.length - 1].role === "assistant" && !filtered[filtered.length - 1].content) {
            filtered.pop();
          }
          return filtered;
        });
        setApiError(null);
        callAI(lastUserMsg.content);
      }
    }
  };

  const sendMessage = () => {
    if (!input.trim() || isTyping) return;
    const userContent = input.trim();
    setInput("");
    callAI(userContent);
  };

  const handleShortcut = (prompt: string) => {
    setInput(prompt);
  };

  const clearChat = () => {
    // 中止正在进行的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setHistoryMessages([]);
    setApiError(null);
    setMessages(INITIAL_MESSAGES);
    setIsTyping(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setApiError("只支持上传图片文件");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setApiError("图片大小不能超过 10MB");
      return;
    }

    setApiError(null);
    setUploading(true);
    try {
      const url = await uploadToOSS(file);
      setInput((prev) => `${prev}\n![${file.name}](${url})\n`.trimStart());
    } catch {
      setApiError("图片上传失败，请重试");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const allMessages = [...messages, ...historyMessages];

  // 获取最后一条 AI 消息的内容（用于判断是否显示停止按钮）
  const lastAIMessage = historyMessages.filter((m) => m.role === "assistant").pop();

  return (
    <div
      className="flex flex-col h-[calc(100dvh-56px)]"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="max-w-5xl mx-auto w-full flex flex-col px-4 md:px-6 py-6 gap-4 h-full">
        {/* Header */}
        <div className="flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-3xl font-semibold text-on-surface" style={{ letterSpacing: "-0.02em" }}>
              AI Assistant
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              DeepSeek 驱动 · 技术面试 copilot · 流式输出
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded border"
            style={{
              backgroundColor: "var(--surface-low)",
              borderColor: "var(--outline-variant)",
            }}
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--primary)", boxShadow: "0 0 8px color-mix(in srgb, var(--primary) 60%, transparent)" }}
            />
            <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-on-surface-variant">
              DeepSeek
            </span>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
          {SHORTCUTS.map((shortcut) => (
            <button
              key={shortcut.label}
              className="flex flex-col items-center justify-center p-4 rounded-lg border transition-all duration-200 hover:border-primary group cursor-pointer"
              style={{
                backgroundColor: "var(--surface-container)",
                borderColor: "var(--outline-variant)",
              }}
              onClick={() => handleShortcut(shortcut.prompt)}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--primary)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-high)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--outline-variant)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-container)";
              }}
            >
              <span
                className="mb-2 transition-transform duration-200 group-hover:scale-110"
                style={{ color: "var(--primary)" }}
              >
                {shortcut.icon}
              </span>
              <span className="font-semibold text-sm text-on-surface">{shortcut.label}</span>
            </button>
          ))}
        </div>

        {/* Chat */}
        <div
          className="flex-1 flex flex-col rounded-lg overflow-hidden border min-h-0"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--outline-variant)",
          }}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 pb-20 md:pb-0">
            {allMessages.map((msg) =>
              msg.role === "assistant" ? (
                <div key={msg.id} className="flex gap-4 max-w-[85%]">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "var(--surface-high)", border: "1px solid var(--outline-variant)" }}
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{ color: "var(--primary)" }}
                    >
                      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                      <circle cx="7.5" cy="14.5" r="1.5" fill="currentColor" />
                      <circle cx="16.5" cy="14.5" r="1.5" fill="currentColor" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-on-surface-variant">
                      DeepSeek
                    </span>
                    <div
                      className="p-3 rounded-lg relative overflow-hidden"
                      style={{
                        backgroundColor: "var(--surface-container)",
                        border: "1px solid var(--outline-variant)",
                        color: "var(--on-surface)",
                      }}
                    >
                      {/* 流式输出时的脉冲动画指示器 */}
                      {isTyping && msg.id === lastAIMessage?.id && msg.content && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1">
                          <div
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ backgroundColor: "var(--primary)" }}
                          />
                          <div
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ backgroundColor: "var(--primary)", animationDelay: "0.2s" }}
                          />
                          <div
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ backgroundColor: "var(--primary)", animationDelay: "0.4s" }}
                          />
                        </div>
                      )}
                      <MarkdownRenderer content={msg.content} />
                    </div>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex gap-4 max-w-[85%] self-end flex-row-reverse">
                  <div className="flex flex-col gap-1 items-end">
                    <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-on-surface-variant">
                      YOU
                    </span>
                    <div
                      className="p-3 rounded-lg"
                      style={{
                        backgroundColor: "var(--primary-container)",
                        color: "var(--on-primary-container)",
                        border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
                      }}
                    >
                      <p className="text-base leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* 正在思考状态（首次显示，有内容后隐藏） */}
            {isTyping && (!lastAIMessage || !lastAIMessage.content) && (
              <div className="flex gap-4 max-w-[85%]">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--surface-high)", border: "1px solid var(--outline-variant)" }}
                >
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--primary)" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                </div>
                <div>
                  <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-on-surface-variant">DeepSeek</span>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--surface-container)", border: "1px solid var(--outline-variant)" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-on-surface-variant">思考中</span>
                      <div className="flex items-center gap-1">
                        <div
                          className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ backgroundColor: "var(--primary)" }}
                        />
                        <div
                          className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ backgroundColor: "var(--primary)", animationDelay: "0.15s" }}
                        />
                        <div
                          className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ backgroundColor: "var(--primary)", animationDelay: "0.3s" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 错误提示 + 重试按钮 */}
            {apiError && (
              <div
                className="p-3 rounded-lg border"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--error) 10%, transparent)",
                  borderColor: "var(--error)",
                  color: "var(--error)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">请求失败：{apiError}</p>
                    <p className="text-xs mt-1 opacity-70">请检查 .env.local 中的 DEEPSEEK_API_KEY 是否配置正确</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={retryLastRequest}>
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 4v6h6M23 20v-6h-6" />
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                    </svg>
                    重试
                  </Button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="p-4 border-t shrink-0 fixed bottom-0 left-0 right-0 md:relative bg-surface-bright md:bg-transparent border-t md:border-t border-outline-variant md:border-outline-variant z-10 pb-[calc(1rem+env(safe-area-inset-bottom))]"
            style={{ backgroundColor: "var(--surface-container)", borderColor: "var(--outline-variant)" }}
          >
            <div className="max-w-5xl mx-auto flex flex-col gap-2">
              <textarea
                className="w-full rounded p-3 text-base resize-none focus:outline-none transition-colors"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--outline-variant)",
                  color: "var(--on-surface)",
                }}
                placeholder="输入你的问题或粘贴代码... (支持 Markdown)"
                rows={3}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={isTyping}
              />
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || isTyping}
                    className="p-1.5 text-on-surface-variant hover:text-primary rounded hover:bg-surface-high transition-colors disabled:opacity-50"
                    title="上传图片"
                  >
                    {uploading ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={clearChat} disabled={isTyping}>
                    Clear
                  </Button>
                  {isTyping ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={stopGeneration}
                      className="gap-1.5"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                      停止生成
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" onClick={sendMessage} disabled={!input.trim()}>
                      <span>Send</span>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 全局 CSS 动画注入 */}
      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce {
          animation: bounce 1.4s infinite ease-in-out both;
        }
      `}</style>
    </div>
  );
}
