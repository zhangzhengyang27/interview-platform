"use client"

import { useState, useEffect, useMemo, useRef, Suspense } from "react"
import useSWR from "swr"
import { fetcher } from "@/lib/swr"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import {
  PAGE_SIZE,
  CATEGORY_TO_LANG,
  JOB_ROLE_OPTIONS,
  DIFFICULTY_OPTIONS,
  QUESTION_TYPE_OPTIONS,
  type DbQuestion,
  type CategoryWithCount,
  type QuestionBank,
  type CategoriesResponse,
  type QuestionsResponse
} from "./types"
import { QuestionBankSidebar } from "./QuestionBankSidebar"
import {
  MobileQuestionBankDrawer,
  MobileQuestionBankDrawerTrigger,
} from "./MobileQuestionBankDrawer"
import { QuestionGrid } from "./QuestionGrid"
import { QuestionBasketButton } from "@/components/QuestionBasketButton"
import { useQuestionBasket } from "@/hooks/useQuestionBasket"

function QuestionsPageInner() {
  // UI state
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  // 初始化即读取 URL 的 ?lang，作为唯一进入来源；后续切换仅由 handleLangChange 单点更新
  const [selectedLang, setSelectedLang] = useState(() => searchParams.get("lang") ?? "all")
  const [selectedBank, setSelectedBank] = useState<string | null>(() => searchParams.get("bank"))
  const [expandedBank, setExpandedBank] = useState<string | null>(null)
  const [page, setPage] = useState(() => {
    const p = Number(searchParams.get("page"))
    return Number.isInteger(p) && p > 0 ? p : 1
  })
  const { count: basketCount } = useQuestionBasket()

  const scrollRef = useRef<HTMLDivElement>(null)

  // 搜索与筛选状态（初始值从 URL 恢复，返回时可保持进入详情页前的状态）
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "")
  const [selectedDifficulty, setSelectedDifficulty] = useState(() => searchParams.get("difficulty") ?? "")
  const [selectedQuestionType, setSelectedQuestionType] = useState(() => searchParams.get("type") ?? "")
  const [selectedJobRole, setSelectedJobRole] = useState(() => searchParams.get("jobRole") ?? "")
  const [orderBy, setOrderBy] = useState<"createdAt" | "viewCount" | "encounterCount">(
    () => (searchParams.get("sort") as "createdAt" | "viewCount" | "encounterCount") || "createdAt"
  )
  const [mobileBankDrawerOpen, setMobileBankDrawerOpen] = useState(false)
  const [filterExpanded, setFilterExpanded] = useState(false)

  // 计算当前过滤条件数（用于筛选按钮徽章）
  const activeFilterCount =
    (selectedBank ? 1 : 0) +
    (search ? 1 : 0) +
    (selectedDifficulty ? 1 : 0) +
    (selectedQuestionType ? 1 : 0) +
    (selectedJobRole ? 1 : 0) +
    (orderBy !== "createdAt" ? 1 : 0)

  // 使用 SWR 获取分类数据
  const { data: categoriesData, error: categoriesError } = useSWR<CategoriesResponse>(
    "/api/categories?includeStats=true",
    fetcher
  )
  const categories: CategoryWithCount[] = useMemo(
    () => categoriesData?.categories ?? [],
    [categoriesData]
  )

  // 构建 API URL（需要在 categories 声明之后）
  const params = useMemo(() => {
    const p = new URLSearchParams()
    p.set("take", String(PAGE_SIZE))
    p.set("skip", String((page - 1) * PAGE_SIZE))
    if (search) p.set("search", search)
    if (selectedDifficulty) p.set("difficulty", selectedDifficulty)
    if (selectedQuestionType) p.set("questionType", selectedQuestionType)
    if (selectedJobRole) p.set("jobRole", selectedJobRole)
    if (orderBy !== "createdAt") {
      p.set("orderBy", orderBy)
      p.set("orderDir", "desc")
    }
    if (selectedBank) {
      if (selectedBank.startsWith("_other-")) {
        const lang = selectedBank.replace("_other-", "")
        const techIds = categories
          .filter((c) => c.type === "tech" && CATEGORY_TO_LANG[c.id] === lang)
          .map((c) => c.id)
        p.set("categoryIds", techIds.join(","))
      } else {
        p.set("categoryId", selectedBank)
      }
    } else if (selectedLang !== "all") {
      const langIds = categories
        .filter((c) => CATEGORY_TO_LANG[c.id] === selectedLang)
        .map((c) => c.id)
      if (langIds.length > 0) {
        p.set("categoryIds", langIds.join(","))
      }
    }
    return p
  }, [page, search, selectedDifficulty, selectedQuestionType, selectedJobRole, orderBy, selectedBank, selectedLang, categories])

  // 把用户可见的筛选/搜索/页码/排序状态同步到 URL 查询参数。
  // 进入详情页时这些参数随 URL 保留，返回后可从 URL 恢复，避免丢失列表状态。
  const listQuery = useMemo(() => {
    const p = new URLSearchParams()
    if (selectedLang !== "all") p.set("lang", selectedLang)
    if (selectedBank) p.set("bank", selectedBank)
    if (search) p.set("q", search)
    if (selectedDifficulty) p.set("difficulty", selectedDifficulty)
    if (selectedQuestionType) p.set("type", selectedQuestionType)
    if (selectedJobRole) p.set("jobRole", selectedJobRole)
    if (orderBy !== "createdAt") p.set("sort", orderBy)
    if (page > 1) p.set("page", String(page))
    return p.toString()
  }, [selectedLang, selectedBank, search, selectedDifficulty, selectedQuestionType, selectedJobRole, orderBy, page])

  // 同步到 URL（replace 不产生历史记录，避免污染返回栈）
  const prevListQuery = useRef(listQuery)
  useEffect(() => {
    if (prevListQuery.current === listQuery) return
    prevListQuery.current = listQuery
    router.replace(`${pathname}?${listQuery}`, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listQuery])

  // 滚动位置保存/恢复：key 含当前筛选状态，避免串列表
  const scrollKey = useMemo(() => `qs-scroll-${listQuery}`, [listQuery])

  // 滚动时记录位置（节流，用 rAF 避免高频写）
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const save = () => {
      try {
        sessionStorage.setItem(scrollKey, String(el.scrollTop))
      } catch {
        // ignore private mode
      }
    }
    const onScroll = () => {
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(save)
      } else {
        save()
      }
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [scrollKey])

  // 使用 SWR 获取题目数据
  const questionsUrl = `/api/questions?${params.toString()}`
  const {
    data: questionsData,
    error: questionsError,
    isLoading: questionsLoading
  } = useSWR<QuestionsResponse>(
    selectedBank || selectedLang === "all" ? questionsUrl : null,
    fetcher
  )
  const questions: DbQuestion[] = questionsData?.questions ?? []
  const total: number = questionsData?.total ?? 0

  const loading = !categoriesData && !categoriesError
  const fetching = questionsLoading
  const fetchError = categoriesError || questionsError ? "数据加载失败，请检查网络后重试" : null

  // 数据加载完成后恢复上次滚动位置
  useEffect(() => {
    if (!questionsData) return
    const el = scrollRef.current
    if (!el) return
    let saved = 0
    try {
      saved = Number(sessionStorage.getItem(scrollKey)) || 0
    } catch {
      // ignore
    }
    if (saved > 0) {
      // 延迟到列表渲染完成后滚动，避免布局未稳定
      requestAnimationFrame(() => requestAnimationFrame(() => el.scrollTo({ top: saved })))
    }
  }, [questionsData, scrollKey])

  // 同步 URL 搜索参数到本地状态：顶部下拉通过 <Link> 切换 ?lang=xxx 时，驱动左侧菜单切换
  useEffect(() => {
    const lang = searchParams.get("lang") ?? "all"
    if (lang !== selectedLang) {
      setSelectedLang(lang)
      setSelectedBank(null)
      setExpandedBank(null)
      setPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Build question banks for selected language — show subdomain level only
  const questionBanks = useMemo<QuestionBank[]>(() => {
    if (selectedLang === "all") {
      // 全部：显示所有 tech 类型的顶级分类
      return categories
        .filter((c) => c.type === "tech")
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description ?? "",
          questionCount: c.questionCount
        }))
    }

    // 按语言筛选：展示该语言下所有 subdomain 级别的分类
    const techParentIds = categories
      .filter((c) => c.type === "tech" && CATEGORY_TO_LANG[c.id] === selectedLang)
      .map((c) => c.id)

    const subdomains = categories.filter(
      (c) => c.type === "subdomain" && c.parentId && techParentIds.includes(c.parentId)
    )

    // 计算 tech 分类总题目数 vs subdomain 总和，差值 = 直接关联到 tech 的题目
    const techTotal = categories
      .filter((c) => c.type === "tech" && CATEGORY_TO_LANG[c.id] === selectedLang)
      .reduce((sum, c) => sum + c.questionCount, 0)
    const subdomainTotal = subdomains.reduce((sum, s) => sum + s.questionCount, 0)
    const uncategorized = techTotal - subdomainTotal

    const banks = [...subdomains]

    // 如果有直接关联到 tech 分类的题目，添加"其他"bank
    if (uncategorized > 0) {
      banks.push({
        id: `_other-${selectedLang}`,
        name: "其他",
        type: "other",
        description: "未分配到子分类的题目",
        questionCount: uncategorized
      })
    }

    return banks
      .sort((a, b) => {
        // 把"其他"始终放到列表末尾
        if (a.name === "其他") return 1
        if (b.name === "其他") return -1
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      })
      .map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description ?? "",
        questionCount: c.questionCount
      }))
  }, [categories, selectedLang])

  // Reset bank when language tab switches so the new language's first bank is auto-selected
  useEffect(() => {
    setSelectedBank(null)
  }, [selectedLang])

  // Auto-select first bank when banks list changes
  useEffect(() => {
    if (questionBanks.length > 0 && !selectedBank) {
      setSelectedBank(questionBanks[0].id)
    } else if (questionBanks.length === 0) {
      setSelectedBank(null)
    }
  }, [questionBanks, selectedBank])

  // Reset page on filter change (intentionally setting state in effect)
  useEffect(() => {
    setPage(1)
  }, [selectedLang, selectedBank, search, selectedDifficulty, selectedQuestionType, selectedJobRole, orderBy])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-56px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant">加载中...</span>
        </div>
      </div>
    )
  }

  // Mark loading done after first render with data
  // (no-op: SWR handles loading state automatically)

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)] overflow-hidden">
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Question Bank List */}
        <QuestionBankSidebar
          questionBanks={questionBanks}
          selectedBank={selectedBank}
          expandedBank={expandedBank}
          categories={categories}
          onSelectBank={setSelectedBank}
          onToggleExpand={setExpandedBank}
        />

        {/* Mobile: Question Bank Drawer */}
        <MobileQuestionBankDrawer
          questionBanks={questionBanks}
          selectedBank={selectedBank}
          expandedBank={expandedBank}
          categories={categories}
          onSelectBank={setSelectedBank}
          onToggleExpand={setExpandedBank}
          open={mobileBankDrawerOpen}
          onClose={() => setMobileBankDrawerOpen(false)}
        />

        {/* Right: Questions Area */}
        <main
          className="flex-1 flex flex-col overflow-hidden"
          style={{ backgroundColor: "var(--background)" }}>
          {/* Toolbar */}
          <div
            className="shrink-0 px-4 py-3 flex flex-col gap-3 border-b"
            style={{ borderColor: "var(--outline-variant)" }}>
            {/* 移动端顶部：题库选择 + 筛选按钮（始终可见） */}
            <div className="flex md:hidden items-center gap-2">
              <MobileQuestionBankDrawerTrigger
                onClick={() => setMobileBankDrawerOpen(true)}
                selectedBankName={
                  selectedBank
                    ? (questionBanks.find((b) => b.id === selectedBank)?.name ?? "选择题库")
                    : "选择题库"
                }
              />
              <button
                type="button"
                onClick={() => setFilterExpanded((v) => !v)}
                data-skip-touch-min-height
                className="ml-auto flex items-center gap-1.5 px-3 h-9 rounded-md border text-sm font-medium"
                style={{
                  backgroundColor: filterExpanded ? "var(--primary-container)" : "var(--surface-container)",
                  borderColor: "var(--outline-variant)",
                  color: "var(--on-surface)",
                }}
                aria-expanded={filterExpanded}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>筛选</span>
                {activeFilterCount > 0 && (
                  <span
                    className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold"
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "var(--on-primary)",
                    }}>
                    {activeFilterCount}
                  </span>
                )}
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${filterExpanded ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {/* 折叠区：移动端默认隐藏，桌面端始终显示 */}
            <div className={`${filterExpanded ? "flex" : "hidden"} md:flex flex-col gap-3`}>
              {/* Top row: bank label + sort + actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                {/* Current bank label — desktop */}
                {selectedBank && (
                  <div className="hidden sm:flex items-center gap-2 text-sm text-on-surface-variant">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5">
                      <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2z" />
                    </svg>
                    <span className="font-medium text-on-surface">
                      {questionBanks.find((b) => b.id === selectedBank)?.name ?? ""}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between sm:ml-auto w-full sm:w-auto gap-2">
                  <span className="text-xs sm:text-sm text-on-surface-variant shrink-0">
                    共 <span className="font-mono text-on-surface">{total}</span> 题
                  </span>
                  <Select
                    value={orderBy}
                    onChange={(e) => setOrderBy(e.target.value as typeof orderBy)}
                    className="shrink-0">
                    <option value="createdAt">最新发布</option>
                    <option value="viewCount">最多浏览</option>
                    <option value="encounterCount">高频真题</option>
                  </Select>
                  <QuestionBasketButton count={basketCount} />
                  <Link href="/questions/new">
                    <Button variant="secondary" size="sm">
                      添加题目
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Filter row: search + difficulty + type + direction */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <Input
                    type="text"
                    placeholder="搜索题目标题、内容或公司..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-8 py-1.5 text-sm"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                      aria-label="清除搜索">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
                  <Select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full sm:w-auto sm:shrink-0">
                    {DIFFICULTY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>

                  <Select
                    value={selectedQuestionType}
                    onChange={(e) => setSelectedQuestionType(e.target.value)}
                    className="w-full sm:w-auto sm:shrink-0">
                    {QUESTION_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>

                  <Select
                    value={selectedJobRole}
                    onChange={(e) => setSelectedJobRole(e.target.value)}
                    className="w-full sm:w-auto sm:shrink-0">
                    {JOB_ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </div>

                {(search || selectedDifficulty || selectedQuestionType || selectedJobRole) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearch("")
                      setSelectedDifficulty("")
                      setSelectedQuestionType("")
                      setSelectedJobRole("")
                    }}
                    className="shrink-0">
                    清除筛选
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Questions Grid */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6">
            <QuestionGrid
              questions={questions}
              fetching={fetching}
              fetchError={fetchError}
              total={total}
              page={page}
              totalPages={totalPages}
              search={search}
              listQuery={listQuery}
              onPageChange={setPage}
              onClearSearch={() => {
                setSearch("")
              }}
              onRetry={() => {
                // SWR will automatically retry on revalidation
              }}
            />
          </div>
        </main>
      </div>
    </div>
  )
}

// 用 Suspense 包裹以满足 Next.js 对 useSearchParams 的预渲染要求
export default function QuestionsPage() {
  return (
    <Suspense fallback={null}>
      <QuestionsPageInner />
    </Suspense>
  )
}
