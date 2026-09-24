"use client"

import { useState, useEffect, useMemo } from "react"
import { DifficultyBadge, TagBadge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import { ShareDialog } from "@/components/ShareDialog"
import { ReportButton } from "@/components/ReportButton"
import { Select } from "@/components/ui/Select"
import { QuestionEditDialog } from "@/components/QuestionEditDialog"
import { QuestionEditList } from "@/components/QuestionEditList"
import { SpeakButton } from "@/components/SpeakButton"
import { SolutionList } from "@/components/SolutionList"
import { SolutionEditor } from "@/components/SolutionEditor"
import { SolutionDetail } from "@/components/SolutionDetail"
import { getQuestionTypeMeta, normalizeQuestionType } from "@/lib/question-types"
import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import type {
  ActiveTab,
  DbQuestion,
  DbQuestionList,
  Comment,
  Solution,
  SolutionView
} from "./types"
import { LANGUAGES } from "./types"
import CodeTabContent from "./tabs/CodeTabContent"
import SolutionContent from "./tabs/SolutionContent"
import AnswerContent from "./tabs/AnswerContent"
import InterviewContent from "./tabs/InterviewContent"
import DiscussionContent from "./tabs/DiscussionContent"

export default function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { isAuthenticated } = useAuth()
  const [questionId, setQuestionId] = useState<string>("")
  const [allQuestions, setAllQuestions] = useState<DbQuestionList[]>([])
  const [question, setQuestion] = useState<DbQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>("answer")
  const [language, setLanguage] = useState("javascript")
  const [code, setCode] = useState("")
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState("")
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [isImmersive, setIsImmersive] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [edits, setEdits] = useState<
    {
      id: string
      description: string
      reference: string
      status: "pending" | "approved" | "rejected"
      reviewMessage: string | null
      createdAt: string
      user: { name: string | null }
    }[]
  >([])

  // Solution states
  const [solutionView, setSolutionView] = useState<SolutionView>("list")
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null)
  const [solutionCount, setSolutionCount] = useState(0)

  const router = useRouter()
  const searchParams = useSearchParams()
  // 返回题库链接：保留进入详情页前的列表筛选状态（q/difficulty/type/jobRole/sort/page/bank/lang）
  const backHref = useMemo(
    () => `/questions${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
    [searchParams]
  )

  useEffect(() => {
    params.then((p) => setQuestionId(p.id))
  }, [params])

  useEffect(() => {
    if (!questionId) return
    setLoading(true)
    // 题目切换时重置代码与语言，避免显示上一题的代码
    setLanguage("javascript")
    setCode("")

    Promise.all([
      fetch(`/api/questions/${questionId}`).then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}))
          throw new Error(err.error ?? `HTTP ${r.status}`)
        }
        return r.json()
      })
    ])
      .then(async ([qData]) => {
        setQuestion(qData)
        setIsBookmarked(qData.isBookmarked ?? false)

        fetch(`/api/questions/${questionId}/edits`)
          .then(async (r) => {
            if (r.ok) {
              const data = await r.json()
              setEdits(data.edits ?? [])
            }
          })
          .catch(() => {})

        setActiveTab(getQuestionTypeMeta(qData.questionType).defaultTab)

        // 按当前语言（已重置为 javascript）取模板；找不到则用第一个可用语言
        const template = qData.codeTemplate as Record<string, string> | null | undefined
        const langs = template && typeof template === "object" ? Object.keys(template) : []
        if (langs.length > 0) {
          const chosenLang = langs.includes("javascript") ? "javascript" : langs[0]
          setLanguage(chosenLang)
          setCode(template![chosenLang] ?? "")
        } else if (qData.questionType === "code") {
          // 代码题但未配置模板：给一个友好的占位注释，而非空白或错误示例
          setCode("// 在此编写你的实现\n// 参考题目要求，完成函数或逻辑\n")
        }

        // Load sibling questions in the same category for navigation
        const catId = qData.categoryId
        const listParams = new URLSearchParams({ take: "500" })
        if (catId) listParams.set("categoryId", catId)
        try {
          const listRes = await fetch(`/api/questions?${listParams}`)
          if (listRes.ok) {
            const listData = await listRes.json()
            setAllQuestions(listData.questions ?? [])
          }
        } catch {
          // ignore
        }
      })
      .catch((err) => {
        console.error("Failed to load question:", err)
        setQuestion(null)
      })
      .finally(() => setLoading(false))
  }, [questionId])

  // Toggle immersive mode body class
  useEffect(() => {
    if (isImmersive) {
      document.body.classList.add("immersive-mode")
    } else {
      document.body.classList.remove("immersive-mode")
    }
    return () => {
      document.body.classList.remove("immersive-mode")
    }
  }, [isImmersive])

  // Keyboard shortcuts: arrows for nav, Esc to exit, F to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.target instanceof HTMLElement && e.target.isContentEditable) return

      const idx = allQuestions.findIndex((q) => q.id === question?.id)
      const prev = idx > 0 ? allQuestions[idx - 1] : null
      const next = idx < allQuestions.length - 1 ? allQuestions[idx + 1] : null

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault()
          if (prev) {
            router.push(`/questions/${prev.id}`)
          }
          break
        case "ArrowRight":
          e.preventDefault()
          if (next) {
            router.push(`/questions/${next.id}`)
          }
          break
        case "Escape":
          if (isImmersive) {
            setIsImmersive(false)
          }
          break
        case "f":
        case "F":
          setIsImmersive((v) => !v)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [allQuestions, question, isImmersive, router])

  const flashMsg = (msg: string) => {
    setActionMsg(msg)
    setTimeout(() => setActionMsg(""), 2000)
  }

  // 获取或创建默认收藏夹，然后添加/移除收藏
  const syncBookmarkToFolder = async (questionId: string, add: boolean) => {
    try {
      // 获取用户的收藏夹列表
      const foldersRes = await fetch("/api/bookmarks/folders")
      if (!foldersRes.ok) return

      const { folders } = await foldersRes.json()

      // 查找名为"默认收藏"的文件夹
      let defaultFolder = folders?.find((f: { name: string }) => f.name === "默认收藏")

      if (add) {
        // 需要添加收藏
        if (!defaultFolder) {
          // 不存在默认收藏夹，创建一个
          const createRes = await fetch("/api/bookmarks/folders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "默认收藏", icon: "⭐" })
          })
          if (!createRes.ok) return
          defaultFolder = await createRes.json()
        }

        // 添加到默认收藏夹
        await fetch("/api/bookmarks/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folderId: defaultFolder.id,
            questionId
          })
        })
      } else {
        // 需要移除收藏 - 从所有收藏夹中移除该题目
        if (defaultFolder) {
          await fetch(
            `/api/bookmarks/items?folderId=${defaultFolder.id}&questionId=${questionId}`,
            { method: "DELETE" }
          )
        }
      }
    } catch (error) {
      console.error("同步收藏到文件夹失败:", error)
    }
  }

  const toggleBookmark = async () => {
    if (!questionId || actionLoading) return
    // 收藏状态属于当前用户（UserQuestionState），此前误调 admin 权限的
    // PATCH /api/questions/[id] 导致普通用户 403 静默失败
    if (!requireLogin()) return
    setActionLoading(true)
    try {
      const next = !isBookmarked
      const res = await fetch(`/api/questions/${questionId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBookmarked: next })
      })
      if (res.ok) {
        setIsBookmarked(next)
        flashMsg(next ? "已收藏" : "已取消收藏")
        // 同步到 BookmarkItem 表
        await syncBookmarkToFolder(questionId, next)
      }
    } catch {
      flashMsg("操作失败")
    } finally {
      setActionLoading(false)
    }
  }

  // 评论/题解/点赞需要登录（后端已同步收紧），未登录引导去登录页
  const requireLogin = () => {
    if (isAuthenticated) return true
    flashMsg("请先登录后再操作")
    router.push(`/login?callbackUrl=${encodeURIComponent(`/questions/${questionId}`)}`)
    return false
  }

  const submitInterviewAnswer = async (text: string) => {
    if (!questionId) return
    if (!requireLogin()) return
    setInterviewLoading(true)
    try {
      const res = await fetch(`/api/questions/${questionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `[面试回答] ${text}` })
      })
      if (res.ok) {
        const newComment: Comment = await res.json()
        setQuestion((prev) => (prev ? { ...prev, comments: [newComment, ...prev.comments] } : prev))
        flashMsg("回答已提交")
      }
    } catch {
      flashMsg("提交失败")
    } finally {
      setInterviewLoading(false)
    }
  }

  const upvoteComment = async (commentId: string) => {
    if (!questionId) return
    if (!requireLogin()) return
    try {
      const res = await fetch(`/api/questions/${questionId}/comments/${commentId}`, {
        method: "PATCH"
      })
      if (res.ok) {
        const updated: Comment = await res.json()
        setQuestion((prev) =>
          prev
            ? {
                ...prev,
                comments: prev.comments.map((c) => (c.id === commentId ? updated : c))
              }
            : prev
        )
      }
    } catch {
      // silently fail
    }
  }

  // Solution handlers
  const handleSolutionClick = (solution: Solution) => {
    setSelectedSolution(solution)
    setSolutionView("detail")
  }

  const handleWriteSolution = () => {
    if (!requireLogin()) return
    setSolutionView("editor")
  }

  const handleSubmitSolution = async (content: string, language?: string) => {
    if (!questionId) return
    if (!requireLogin()) return
    try {
      const res = await fetch(`/api/questions/${questionId}/solutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, language })
      })
      if (res.ok) {
        flashMsg("题解发布成功！")
        setSolutionView("list")
        setSolutionCount((prev) => prev + 1)
      }
    } catch {
      flashMsg("发布失败")
    }
  }

  const handleEditSolution = (solution: Solution) => {
    setSelectedSolution(solution)
    setSolutionView("editor")
  }

  const handleDeleteSolution = async (solutionId: string) => {
    try {
      const res = await fetch(`/api/solutions/${solutionId}`, {
        method: "DELETE"
      })
      if (res.ok) {
        flashMsg("题解已删除")
        setSolutionCount((prev) => Math.max(0, prev - 1))
        setSolutionView("list")
        setSelectedSolution(null)
      }
    } catch {
      flashMsg("删除失败")
    }
  }

  const handleUpvoteSolution = async (solutionId: string) => {
    try {
      await fetch(`/api/solutions/${solutionId}/upvote`, {
        method: "PATCH"
      })
    } catch {
      // silently fail
    }
  }

  if (!questionId || loading) {
    return (
      <div
        className={`flex items-center justify-center ${isImmersive ? "h-screen" : "h-[calc(100dvh-56px)]"}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant">加载中...</span>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div
        className={`flex items-center justify-center ${isImmersive ? "h-screen" : "h-[calc(100dvh-56px)]"}`}>
        <div className="text-center">
          <p className="text-on-surface-variant mb-4">题目不存在</p>
          <Link href={backHref}>
            <Button variant="secondary">返回题库</Button>
          </Link>
        </div>
      </div>
    )
  }

  const questionType = normalizeQuestionType(question.questionType)
  const { tabs } = getQuestionTypeMeta(questionType)

  const currentIndex = allQuestions.findIndex((q) => q.id === question.id)
  const prevQuestion = currentIndex > 0 ? allQuestions[currentIndex - 1] : null
  const nextQuestion =
    currentIndex < allQuestions.length - 1 ? allQuestions[currentIndex + 1] : null

  return (
    <div
      className={`flex flex-col overflow-hidden p-4 md:p-0 ${isImmersive ? "h-dvh" : "h-[calc(100dvh-56px)]"}`}>
      {/* 移动端顶栏 — 返回按钮 + 题目标题 */}
      <div className="lg:hidden flex items-center gap-3 mb-4">
        <Link
          href={backHref}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-high">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-base font-semibold text-on-surface truncate">
          {question?.title ?? "加载中..."}
        </h1>
      </div>

      {isImmersive && (
        <div
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2"
          style={{
            backgroundColor: "var(--surface-high)",
            color: "var(--on-surface-variant)",
            border: "1px solid var(--outline-variant)"
          }}>
          <span>沉浸模式</span>
          <span style={{ color: "var(--outline)" }}>|</span>
          <span>← → 切题</span>
          <span style={{ color: "var(--outline)" }}>|</span>
          <span>Esc 退出</span>
          <button
            onClick={() => setIsImmersive(false)}
            className="ml-1 text-on-surface-variant hover:text-primary"
            aria-label="退出沉浸模式">
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {/* 桌面端分屏布局 */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left Pane: Question */}
        <section
          className="w-[45%] flex flex-col border-r overflow-hidden"
          style={{ backgroundColor: "var(--surface-low)", borderColor: "var(--outline-variant)" }}>
          <header
            className="h-12 flex items-center justify-between px-4 border-b shrink-0"
            style={{
              backgroundColor: "var(--surface-high)",
              borderColor: "var(--outline-variant)"
            }}>
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href={backHref}
                className="text-on-surface-variant hover:text-primary flex items-center shrink-0">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="font-semibold text-on-surface truncate">
                {currentIndex + 1}. {question.title}
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-[11px] px-2 py-0.5 rounded font-mono"
                style={{
                  backgroundColor: getQuestionTypeMeta(questionType).color.bg,
                  color: getQuestionTypeMeta(questionType).color.text
                }}>
                {getQuestionTypeMeta(questionType).label}
              </span>
              <DifficultyBadge difficulty={question.difficulty as "easy" | "medium" | "hard"} />
              <button
                onClick={() => setIsImmersive(!isImmersive)}
                className={`p-1.5 rounded transition-colors ${
                  isImmersive
                    ? "text-primary bg-surface-high"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-high"
                }`}
                title={isImmersive ? "退出沉浸模式 (Esc)" : "沉浸模式 (F)"}>
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              </button>
            </div>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            <div className="flex gap-2 mb-6 flex-wrap">
              {question.tags.map((t) => (
                <TagBadge key={t.tag} tag={t.tag} />
              ))}
              {question.company && <TagBadge tag={question.company} />}
            </div>
            <MarkdownRenderer content={question.content} />
          </div>

          <footer
            className="min-h-14 border-t flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between px-4 py-2 gap-y-2 shrink-0"
            style={{
              backgroundColor: "var(--surface-container)",
              borderColor: "var(--outline-variant)"
            }}>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={toggleBookmark}
                disabled={actionLoading}
                title="收藏"
                aria-label="收藏"
                className={`flex items-center gap-1 transition-colors text-sm whitespace-nowrap ${
                  isBookmarked ? "text-primary" : "text-on-surface-variant hover:text-primary"
                }`}>
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill={isBookmarked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
              <ReportButton targetType="question" targetId={question.id} />
              <SpeakButton text={`${question.title}。${question.content.replace(/[#*`]/g, "")}`} />
              <button
                onClick={() => setEditDialogOpen(true)}
                title="改解析"
                aria-label="改解析"
                className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap">
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                onClick={() => setActiveTab(questionType === "code" ? "solution" : "answer")}
                title={questionType === "code" ? "题解" : "答案"}
                aria-label={questionType === "code" ? "题解" : "答案"}
                className={`flex items-center gap-1 transition-colors text-sm whitespace-nowrap ${
                  (questionType === "code" ? activeTab === "solution" : activeTab === "answer")
                    ? "text-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}>
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5">
                  {questionType === "code" ? (
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  ) : (
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  )}
                </svg>
              </button>
              <button
                onClick={() => setActiveTab("discussion")}
                title={`讨论 (${question.comments?.length ?? 0})`}
                aria-label="讨论"
                className={`flex items-center gap-1 transition-colors text-sm whitespace-nowrap ${
                    activeTab === "discussion"
                      ? "text-primary"
                      : "text-on-surface-variant hover:text-primary"
                  }`}>
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5">
                  <path d="M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v4l-4-4H9a1.994 1.994 0 0 1-1.414-.586m0 0L11 14h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2v4l.586-.586z" />
                </svg>
              </button>
              <button
                onClick={() => setShareOpen(true)}
                title="分享"
                aria-label="分享"
                className="flex items-center gap-1 transition-colors text-sm text-on-surface-variant hover:text-primary whitespace-nowrap">
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            </div>
          </footer>

          {actionMsg && (
            <div
              className="text-center py-1 text-xs font-medium animate-pulse"
              style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
              {actionMsg}
            </div>
          )}
        </section>

        {/* Right Pane */}
        <section
          className="flex-1 flex flex-col overflow-hidden"
          style={{ backgroundColor: "var(--background)" }}>
          {/* Tab Bar */}
          <div
            className="shrink-0"
            style={{
              backgroundColor: "var(--surface-high)",
              borderBottom: "1px solid var(--outline-variant)"
            }}>
            <div className="flex h-10 overflow-x-auto mobile-scroll">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-primary text-primary bg-surface-container"
                      : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant"
                  }`}>
                  {tab.key === "editor" && (
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                  )}
                  {tab.key === "solution" && (
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  )}
                  {tab.key === "answer" && (
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </svg>
                  )}
                  {tab.key === "interview" && (
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5">
                      <path d="M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v4l-4-4H9a1.994 1.994 0 0 1-1.414-.586m0 0L11 14h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2v4l.586-.586z" />
                    </svg>
                  )}
                  {tab.key === "discussion" && (
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5">
                      <path d="M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v4l-4-4H9a1.994 1.994 0 0 1-1.414-.586m0 0L11 14h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2v4l.586-.586z" />
                    </svg>
                  )}
                  {tab.label}
                  {tab.key === "discussion" && (
                    <span className="text-[11px] opacity-60">
                      ({question.comments?.length ?? 0})
                    </span>
                  )}
                  {tab.key === "user_solutions" && (
                    <span className="text-[11px] opacity-60">({solutionCount})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Toolbar for code editor */}
            {activeTab === "editor" && (
              <div
                className="h-10 flex items-center justify-between px-4 border-t"
                style={{
                  backgroundColor: "var(--surface-container)",
                  borderColor: "var(--outline-variant)"
                }}>
                <div className="flex items-center gap-3">
                  <Select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="font-mono cursor-pointer">
                    {LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </Select>
                  <span className="text-xs text-on-surface-variant">
                    运行与提交操作在编辑器下方
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === "editor" && (
              <CodeTabContent
                code={code}
                setCode={setCode}
                language={language}
                questionId={question.id}
              />
            )}
            {activeTab === "solution" && <SolutionContent solution={question.solution} />}
            {activeTab === "answer" && (
              <AnswerContent solution={question.solution} answer={question.answer} questionType={questionType} />
            )}
            {activeTab === "interview" && (
              <InterviewContent
                questionTitle={question.title}
                questionContent={question.content}
                recommendedAnswer={question.solution}
                onSubmit={submitInterviewAnswer}
                loading={interviewLoading}
              />
            )}
            {activeTab === "discussion" && (
              <DiscussionContent
                questionId={question.id}
                comments={question.comments ?? []}
                onUpvote={upvoteComment}
              />
            )}
            {activeTab === "user_solutions" && (
              <div className="h-full flex flex-col">
                {solutionView === "list" && (
                  <SolutionList
                    questionId={question.id}
                    onSolutionClick={handleSolutionClick}
                    onWriteClick={handleWriteSolution}
                  />
                )}
                {solutionView === "detail" && selectedSolution && (
                  <SolutionDetail
                    solution={selectedSolution}
                    onBack={() => {
                      setSolutionView("list")
                      setSelectedSolution(null)
                    }}
                    onEdit={handleEditSolution}
                    onDelete={handleDeleteSolution}
                    onUpvote={handleUpvoteSolution}
                  />
                )}
                {solutionView === "editor" && (
                  <div className="p-4 overflow-y-auto">
                    <SolutionEditor
                      questionId={question.id}
                      onSubmit={handleSubmitSolution}
                      onCancel={() => setSolutionView("list")}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Nav */}
          <div
            className="h-14 border-t flex items-center justify-between px-4 shrink-0"
            style={{
              backgroundColor: "var(--surface-bright)",
              borderColor: "var(--outline-variant)"
            }}>
            <Link
              href={prevQuestion ? `/questions/${prevQuestion.id}` : "#"}
              className={`flex items-center gap-1 text-sm transition-colors ${
                prevQuestion
                  ? "text-on-surface-variant hover:text-primary"
                  : "text-on-surface-variant/30 cursor-not-allowed"
              }`}>
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              ← 上一题
            </Link>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-mono font-semibold tracking-widest uppercase text-on-surface-variant">
                进度: {currentIndex + 1} / {allQuestions.length}
              </span>
              <span className="text-[10px] text-on-surface-variant/50 font-mono">
                快捷键: ← → F Esc
              </span>
            </div>
            <Link
              href={nextQuestion ? `/questions/${nextQuestion.id}` : "#"}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                nextQuestion
                  ? "text-primary hover:text-primary-fixed"
                  : "text-on-surface-variant/30 cursor-not-allowed"
              }`}>
              下一题 →
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </div>

      {/* 移动端单列布局 */}
      <div className="md:hidden flex flex-col gap-4 overflow-y-auto pb-20">
        {/* 元信息：标签 + 右侧操作按钮 */}
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={question.difficulty as "easy" | "medium" | "hard"} />
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: getQuestionTypeMeta(questionType).color.bg,
              color: getQuestionTypeMeta(questionType).color.text
            }}>
            {getQuestionTypeMeta(questionType).label}
          </span>
          {question.tags.slice(0, 4).map((t) => (
            <TagBadge key={t.tag} tag={t.tag} />
          ))}
          {question.company && <TagBadge tag={question.company} />}
        </div>

        {/* 题目内容 */}
        <div className="prose-sm max-w-none">
          <MarkdownRenderer content={question.content} />
        </div>

        {/* 移动端隐藏 Tab 栏，只展示推荐答案 */}
        <div
          className="hidden"
          style={{
            backgroundColor: "var(--surface-bright)",
            borderTop: "1px solid var(--outline-variant)"
          }}>
          <div className="flex gap-1 overflow-x-auto mobile-scroll">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  activeTab === tab.key
                    ? "text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-high"
                }`}
                style={
                  activeTab === tab.key
                    ? { backgroundColor: "var(--primary-container)" }
                    : undefined
                }>
                {tab.label}
                {tab.key === "discussion" && (
                  <span className="text-[11px] opacity-60 ml-1">
                    ({question.comments?.length ?? 0})
                  </span>
                )}
                {tab.key === "user_solutions" && (
                  <span className="text-[11px] opacity-60 ml-1">({solutionCount})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 内容区 */}
        <div className="min-h-[200px]">
          {activeTab === "editor" && (
            <div className="w-full">
              {/* 语言选择工具栏 */}
              <div
                className="h-10 flex items-center justify-between px-3 border-b mb-2 rounded-t"
                style={{
                  backgroundColor: "var(--surface-container)",
                  borderColor: "var(--outline-variant)"
                }}>
                <Select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="font-mono cursor-pointer">
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </Select>
              </div>
              <CodeTabContent
                code={code}
                setCode={setCode}
                language={language}
                questionId={question.id}
              />
            </div>
          )}
          {activeTab === "solution" && (
            <div
              className="rounded-lg overflow-hidden border p-4"
              style={{ borderColor: "var(--outline-variant)" }}>
              <MarkdownRenderer content={question.solution ?? "暂无题解"} />
            </div>
          )}
          {activeTab === "answer" && (
            <AnswerContent
              solution={question.solution}
              answer={question.answer}
              questionType={questionType}
              isBookmarked={isBookmarked}
              onToggleBookmark={toggleBookmark}
              onShare={() => setShareOpen(true)}
            />
          )}
          {activeTab === "interview" && (
            <InterviewContent
              questionTitle={question.title}
              questionContent={question.content}
              recommendedAnswer={question.solution}
              onSubmit={submitInterviewAnswer}
              loading={interviewLoading}
            />
          )}
          {activeTab === "discussion" && (
            <DiscussionContent
              questionId={question.id}
              comments={question.comments ?? []}
              onUpvote={upvoteComment}
            />
          )}
          {activeTab === "user_solutions" && (
            <div className="min-h-[200px]">
              {solutionView === "list" && (
                <SolutionList
                  questionId={question.id}
                  onSolutionClick={handleSolutionClick}
                  onWriteClick={handleWriteSolution}
                />
              )}
              {solutionView === "detail" && selectedSolution && (
                <SolutionDetail
                  solution={selectedSolution}
                  onBack={() => {
                    setSolutionView("list")
                    setSelectedSolution(null)
                  }}
                  onEdit={handleEditSolution}
                  onDelete={handleDeleteSolution}
                  onUpvote={handleUpvoteSolution}
                />
              )}
              {solutionView === "editor" && (
                <div className="p-4">
                  <SolutionEditor
                    questionId={question.id}
                    onSubmit={handleSubmitSolution}
                    onCancel={() => setSolutionView("list")}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 分享弹窗 */}
      {question && (
        <ShareDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          type="question"
          targetId={question.id}
        />
      )}

      {/* 解析编辑弹窗 */}
      {question && (
        <QuestionEditDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          questionId={question.id}
          onSuccess={() => {
            fetch(`/api/questions/${questionId}/edits`)
              .then((r) => r.json())
              .then((data) => setEdits(data.edits ?? []))
              .catch(() => {})
          }}
        />
      )}

      {/* 解析编辑建议列表 */}
      {question && edits.length > 0 && (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <h3 className="text-base font-semibold text-on-surface mb-3">解析修改建议</h3>
          <QuestionEditList edits={edits} isAdmin={false} onReview={undefined} />
        </div>
      )}
    </div>
  )
}
