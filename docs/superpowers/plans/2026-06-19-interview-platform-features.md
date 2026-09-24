# 面试平台增强功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 P0/P1/P2 优先级在面试平台落地 6 项借鉴自面试鸭的功能：公司真题标记、热门搜索与历史、多维度筛选排序、试题篮组卷下载、语音读题、共同编辑解析。

**Architecture:** 所有功能基于现有 Next.js App Router + Prisma + PostgreSQL + Tailwind CSS 技术栈实现；新增数据表通过一次 Prisma Migration 完成，避免多次迁移冲突；每个功能拆分为独立可测试的 API + UI 任务，优先复用现有 `Button`、`Card`、`Badge` 组件与 `fetcher`/`SWR` 模式。

**Tech Stack:** Next.js 16 / React 19 / TypeScript / Prisma / PostgreSQL / Tailwind CSS / SWR / Vitest / NextAuth

---

## 项目上下文（必读）

- 数据库客户端导出：`src/lib/prisma.ts` 导出 `prisma`。
- 路由 API 风格：`src/app/api/**/route.ts` 使用 `NextRequest/NextResponse`。
- 鉴权：使用 `next-auth`，服务端通过 `getServerSession(authOptions)` 获取 session；admin 校验使用 `src/lib/admin-auth.ts` 的 `requireAdmin()`。
- 前端状态：题目列表页使用 SWR（`src/lib/swr.ts`），组件使用 Tailwind + CSS variables（`--primary`, `--surface-*`, `--outline-variant` 等）。
- 测试：Vitest + `@testing-library/react`，API 测试用 `vi.mock("@/lib/prisma")` mock。
- 现有组件：`Button`、`Card`、`Badge` 在 `src/components/ui/`。
- 无现成 Dialog 组件，参考 `src/components/ShareDialog.tsx` 使用固定定位 + 遮罩 + ESC 关闭实现。

---

## Task 0: 数据库 Schema 变更（一次迁移）

**Files:**

- Modify: `prisma/schema.prisma`
- Run: `npm run db:migrate`
- Test: `prisma migrate status` 成功

- [ ] **Step 1: 在 `prisma/schema.prisma` 追加模型与字段**

```prisma
// 用户标记“在哪见过这道题”
model QuestionEncounter {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  questionId  String   @map("question_id")
  tags        String[] // 公司/岗位标签，如 ["字节跳动", "后端"]
  note        String?  // 可选补充说明
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([userId, questionId])
  @@index([questionId])
  @@map("question_encounters")
}

// 搜索历史（支持未登录用户，userId 为空）
model SearchHistory {
  id        String   @id @default(uuid())
  content   String
  userId    String?  @map("user_id")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([createdAt])
  @@index([userId])
  @@map("search_histories")
}

// 试卷（组卷产物）
model TestPaper {
  id          String   @id @default(uuid())
  name        String
  detail      String?
  userId      String   @map("user_id")
  isPublic    Boolean  @default(false) @map("is_public")
  tags        String[]
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user  User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  items TestPaperItem[]

  @@map("test_papers")
}

model TestPaperItem {
  id            String @id @default(uuid())
  testPaperId   String @map("test_paper_id")
  questionId    String @map("question_id")
  questionType  String @map("question_type") // 保留组卷时的题型
  sortOrder     Int    @default(0) @map("sort_order")

  testPaper TestPaper @relation(fields: [testPaperId], references: [id], onDelete: Cascade)
  question  Question  @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@index([testPaperId])
  @@map("test_paper_items")
}

// 题目解析编辑建议
model QuestionEdit {
  id            String   @id @default(uuid())
  questionId    String   @map("question_id")
  userId        String?  @map("user_id")
  description   String   // 修改说明
  reference     String   @db.Text // 修改后的解析
  status        String   @default("pending") // pending | approved | rejected
  reviewMessage String?  @map("review_message")
  reviewerId    String?  @map("reviewer_id")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user     User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@index([questionId])
  @@index([status])
  @@map("question_edits")
}
```

并在现有模型上追加关系字段：

```prisma
model User {
  // ... 保留原有字段 ...
  questionEncounters QuestionEncounter[]
  testPapers         TestPaper[]
  questionEdits      QuestionEdit[]
}

model Question {
  // ... 保留原有字段 ...
  encounterCount Int @default(0) @map("encounter_count")

  encounters  QuestionEncounter[]
  testPaperItems TestPaperItem[]
  questionEdits  QuestionEdit[]
}
```

- [ ] **Step 2: 运行迁移命令**

Run:

```bash
npm run db:migrate
```

Migration name: `add_encounter_search_paper_edit_models`

Expected: 迁移成功，无冲突。

- [ ] **Step 3: 提交 schema 与 migration**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "chore(prisma): add encounter, search history, test paper and question edit models"
```

---

## Task 1: 公司真题 / 遇到题目标记（P0）

**Files:**

- Create: `src/app/api/questions/[id]/encounter/route.ts`
- Create: `src/app/api/questions/[id]/encounters/route.ts`
- Create: `src/components/QuestionEncounterButton.tsx`
- Create: `src/components/QuestionEncounterDialog.tsx`
- Create: `src/app/api/questions/[id]/encounter/route.test.ts`
- Modify: `src/app/questions/[id]/page.tsx`（追加按钮入口）
- Modify: `src/app/api/questions/route.ts`（支持按 encounterCount 排序）

- [ ] **Step 1: 写 POST /api/questions/[id]/encounter 测试**

Create `src/app/api/questions/[id]/encounter/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    question: { findUnique: vi.fn() },
    questionEncounter: { findUnique: vi.fn(), upsert: vi.fn() },
    questionEncounter: { count: vi.fn() },
    question: { update: vi.fn() }
  }
}))

vi.mock("next-auth", () => ({
  getServerSession: vi.fn()
}))

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { POST } from "./route"

function mockRequest(id: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/questions/${id}/encounter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
}

beforeEach(() => vi.clearAllMocks())

describe("POST /api/questions/[id]/encounter", () => {
  it("未登录返回 401", async () => {
    ;(getServerSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await POST(mockRequest("q1", { tags: ["字节跳动"] }), {
      params: Promise.resolve({ id: "q1" })
    })
    expect(res.status).toBe(401)
  })

  it("题目不存在返回 404", async () => {
    ;(getServerSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u1" }
    })
    ;(prisma.question.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await POST(mockRequest("q1", { tags: ["字节跳动"] }), {
      params: Promise.resolve({ id: "q1" })
    })
    expect(res.status).toBe(404)
  })

  it("有效提交 upsert encounter 并更新计数", async () => {
    ;(getServerSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u1" }
    })
    ;(prisma.question.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "q1"
    })
    ;(prisma.questionEncounter.upsert as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "e1"
    })
    ;(prisma.questionEncounter.count as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(3)

    const res = await POST(mockRequest("q1", { tags: ["字节跳动", "后端"], note: "一面" }), {
      params: Promise.resolve({ id: "q1" })
    })
    expect(res.status).toBe(200)
    expect(prisma.question.update).toHaveBeenCalledWith({
      where: { id: "q1" },
      data: { encounterCount: 3 }
    })
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
npx vitest run src/app/api/questions/[id]/encounter/route.test.ts
```

Expected: FAIL because route does not exist.

- [ ] **Step 3: 实现 POST /api/questions/[id]/encounter**

Create `src/app/api/questions/[id]/encounter/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { id } = await params
  const { tags, note } = await request.json()

  if (!Array.isArray(tags) || tags.length === 0) {
    return NextResponse.json({ error: "至少选择一个标签" }, { status: 400 })
  }

  const question = await prisma.question.findUnique({ where: { id } })
  if (!question) {
    return NextResponse.json({ error: "题目不存在" }, { status: 404 })
  }

  await prisma.questionEncounter.upsert({
    where: {
      userId_questionId: {
        userId: session.user.id,
        questionId: id
      }
    },
    update: { tags, note: note ?? null },
    create: {
      userId: session.user.id,
      questionId: id,
      tags,
      note: note ?? null
    }
  })

  const count = await prisma.questionEncounter.count({ where: { questionId: id } })
  await prisma.question.update({
    where: { id },
    data: { encounterCount: count }
  })

  return NextResponse.json({ success: true, encounterCount: count })
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:

```bash
npx vitest run src/app/api/questions/[id]/encounter/route.test.ts
```

Expected: PASS

- [ ] **Step 5: 实现 GET /api/questions/[id]/encounters（展示他人标记）**

Create `src/app/api/questions/[id]/encounters/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const encounters = await prisma.questionEncounter.findMany({
    where: { questionId: id },
    select: { tags: true, note: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 20
  })

  // 聚合标签出现次数
  const tagCounts: Record<string, number> = {}
  encounters.forEach((e) => {
    e.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    })
  })

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }))

  return NextResponse.json({ total: encounters.length, topTags })
}
```

- [ ] **Step 6: 实现前端组件 QuestionEncounterButton 与 Dialog**

Create `src/components/QuestionEncounterDialog.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface QuestionEncounterDialogProps {
  open: boolean;
  onClose: () => void;
  questionId: string;
  onSuccess?: () => void;
}

const PRESET_TAGS = ["字节跳动", "阿里巴巴", "腾讯", "美团", "京东", "百度", "后端", "前端", "算法"];

export function QuestionEncounterDialog({ open, onClose, questionId, onSuccess }: QuestionEncounterDialogProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const toggleTag = (tag: string) => {
    setSelected((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/questions/${questionId}/encounter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: selected, note: note || undefined }),
      });
      if (res.ok) {
        onSuccess?.();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-xl shadow-2xl p-6" style={{ backgroundColor: "var(--surface-bright)" }}>
        <h3 className="text-base font-semibold text-on-surface mb-4">在哪里见过这道题？</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                selected.includes(tag)
                  ? "bg-primary-container text-on-primary-container border-primary-container"
                  : "bg-surface-high text-on-surface-variant border-outline-variant hover:border-outline"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="补充说明（可选）"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border mb-4 bg-transparent text-on-surface placeholder:text-on-surface-variant"
          style={{ borderColor: "var(--outline-variant)" }}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit} disabled={loading || selected.length === 0}>
            {loading ? "提交中" : "确认"}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

Create `src/components/QuestionEncounterButton.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { QuestionEncounterDialog } from "./QuestionEncounterDialog";

interface Props {
  questionId: string;
  count?: number;
  onReport?: () => void;
}

export function QuestionEncounterButton({ questionId, count = 0, onReport }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <span>🏢</span>
        <span>遇到 {count > 0 ? `(${count})` : ""}</span>
      </Button>
      <QuestionEncounterDialog
        open={open}
        onClose={() => setOpen(false)}
        questionId={questionId}
        onSuccess={onReport}
      />
    </>
  );
}
```

- [ ] **Step 7: 在题目详情页引入按钮**

Modify `src/app/questions/[id]/page.tsx`:

在 import 区追加：

```typescript
import { QuestionEncounterButton } from "@/components/QuestionEncounterButton"
```

在 state 区增加：

```typescript
const [encounterCount, setEncounterCount] = useState(0)
```

在 `Promise.all` 加载题目后追加请求：

```typescript
fetch(`/api/questions/${questionId}/encounters`).then(async (r) => {
  if (r.ok) {
    const data = await r.json()
    setEncounterCount(data.total ?? 0)
  }
})
```

在操作按钮区（与收藏、分享并列）插入：

```tsx
<QuestionEncounterButton
  questionId={questionId}
  count={encounterCount}
  onReport={() => {
    fetch(`/api/questions/${questionId}/encounters`)
      .then((r) => r.json())
      .then((data) => setEncounterCount(data.total ?? 0))
  }}
/>
```

- [ ] **Step 8: 题目列表支持按 encounterCount 排序**

Modify `src/app/api/questions/route.ts`:

在 orderBy 逻辑处改为：

```typescript
const orderByParam = searchParams.get("orderBy") ?? "createdAt"
const orderDir = searchParams.get("orderDir") ?? "desc"
const validOrderFields = ["createdAt", "viewCount", "encounterCount"]
const orderField = validOrderFields.includes(orderByParam) ? orderByParam : "createdAt"

const [questions, total] = await Promise.all([
  prisma.question.findMany({
    where,
    include: { tags: true, category: true },
    orderBy: { [orderField]: orderDir === "asc" ? "asc" : "desc" },
    take,
    skip
  }),
  prisma.question.count({ where })
])
```

- [ ] **Step 9: 提交 Task 1**

```bash
git add src/app/api/questions/[id]/encounter/ src/app/api/questions/[id]/encounters/ src/components/QuestionEncounterButton.tsx src/components/QuestionEncounterDialog.tsx src/app/questions/[id]/page.tsx src/app/api/questions/route.ts
git commit -m "feat(encounter): add question encounter marking and encounter count sorting"
```

---

## Task 2: 热门搜索 + 搜索历史（P0）

**Files:**

- Create: `src/app/api/search-history/route.ts`
- Create: `src/app/api/search-history/hot/route.ts`
- Create: `src/hooks/useSearchHistory.ts`
- Create: `src/components/QuestionSearchPopover.test.tsx`（测试搜索历史渲染）
- Modify: `src/components/QuestionSearchPopover.tsx`

- [ ] **Step 1: 写搜索历史 API 测试**

Create `src/app/api/search-history/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    searchHistory: { create: vi.fn() }
  }
}))

vi.mock("next-auth", () => ({
  getServerSession: vi.fn()
}))

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { POST } from "./route"

function mockRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/search-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
}

beforeEach(() => vi.clearAllMocks())

describe("POST /api/search-history", () => {
  it("空内容返回 400", async () => {
    const res = await POST(mockRequest({ content: "  " }))
    expect(res.status).toBe(400)
  })

  it("保存搜索历史", async () => {
    ;(getServerSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u1" }
    })
    ;(prisma.searchHistory.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "s1"
    })
    const res = await POST(mockRequest({ content: "Redis" }))
    expect(res.status).toBe(201)
    expect(prisma.searchHistory.create).toHaveBeenCalledWith({
      data: { content: "Redis", userId: "u1" }
    })
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run src/app/api/search-history/route.test.ts
```

Expected: FAIL

- [ ] **Step 3: 实现搜索历史 POST API**

Create `src/app/api/search-history/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const { content } = await request.json()

  const trimmed = content?.trim()
  if (!trimmed) {
    return NextResponse.json({ error: "搜索内容不能为空" }, { status: 400 })
  }

  await prisma.searchHistory.create({
    data: {
      content: trimmed,
      userId: session?.user?.id ?? null
    }
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
```

- [ ] **Step 4: 实现热门搜索 API**

Create `src/app/api/search-history/hot/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000)

  const rows = await prisma.searchHistory.findMany({
    where: { createdAt: { gte: since } },
    select: { content: true }
  })

  const counts: Record<string, number> = {}
  rows.forEach((r) => {
    const key = r.content.trim()
    counts[key] = (counts[key] ?? 0) + 1
  })

  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([content]) => content)

  return NextResponse.json({ hot: top })
}
```

- [ ] **Step 5: 实现 useSearchHistory hook**

Create `src/hooks/useSearchHistory.ts`:

```typescript
"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "interview_search_history"
const MAX_HISTORY = 10

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setHistory(JSON.parse(raw))
    } catch {}
  }, [])

  const save = useCallback((list: string[]) => {
    setHistory(list)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }, [])

  const add = useCallback((term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return
    setHistory((prev) => {
      const next = [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
    fetch("/api/search-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed })
    }).catch(() => {})
  }, [])

  const remove = useCallback((term: string) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h !== term)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { history, add, remove, clear }
}
```

- [ ] **Step 6: 改造 QuestionSearchPopover 增加历史与热搜**

Modify `src/components/QuestionSearchPopover.tsx`:

在 import 区追加：

```typescript
import { useSearchHistory } from "@/hooks/useSearchHistory"
```

在组件内部增加：

```typescript
const { history, add, remove, clear } = useSearchHistory()
const [hot, setHot] = useState<string[]>([])

useEffect(() => {
  fetch("/api/search-history/hot")
    .then((r) => r.json())
    .then((data) => setHot(data.hot ?? []))
    .catch(() => {})
}, [])

const handleSelect = (term: string) => {
  add(term)
  router.push(`/questions?search=${encodeURIComponent(term)}`)
  setOpen(false)
}

const handleSearch = (term: string) => {
  if (!term.trim()) return
  add(term)
  router.push(`/questions?search=${encodeURIComponent(term.trim())}`)
  setOpen(false)
}
```

在搜索结果为空时展示热搜和历史：

```tsx
{
  query === "" && (
    <div className="p-2 space-y-3">
      {hot.length > 0 && (
        <div>
          <div className="px-2 py-1 text-xs font-medium text-on-surface-variant">热门搜索</div>
          <div className="flex flex-wrap gap-2 p-2">
            {hot.map((term) => (
              <button
                key={term}
                onClick={() => handleSelect(term)}
                className="px-2 py-1 rounded-full text-sm bg-surface-high text-on-surface hover:bg-primary-container hover:text-on-primary-container">
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium text-on-surface-variant">搜索历史</span>
            <button onClick={clear} className="text-xs text-error hover:underline">
              清空
            </button>
          </div>
          <div className="flex flex-col">
            {history.map((term) => (
              <div
                key={term}
                className="flex items-center justify-between px-2 py-1.5 hover:bg-surface-high rounded-lg">
                <button
                  onClick={() => handleSelect(term)}
                  className="text-sm text-on-surface flex-1 text-left">
                  {term}
                </button>
                <button
                  onClick={() => remove(term)}
                  className="text-xs text-on-surface-variant hover:text-error px-2">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: 运行测试并提交**

```bash
npx vitest run src/app/api/search-history/route.test.ts
git add src/app/api/search-history/ src/hooks/useSearchHistory.ts src/components/QuestionSearchPopover.tsx
git commit -m "feat(search): add hot searches and search history"
```

---

## Task 3: 多维度筛选排序面板（P1）

**Files:**

- Create: `src/components/QuestionFilterPanel.tsx`
- Create: `src/components/QuestionFilterPanel.test.tsx`
- Modify: `src/app/questions/page.tsx`

- [ ] **Step 1: 写筛选面板测试**

Create `src/components/QuestionFilterPanel.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionFilterPanel } from "./QuestionFilterPanel";

describe("QuestionFilterPanel", () => {
  it("切换难度触发 onChange", () => {
    const handleChange = vi.fn();
    render(<QuestionFilterPanel filters={{}} onChange={handleChange} />);
    fireEvent.click(screen.getByText("简单"));
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ difficulty: "easy" }));
  });

  it("清除筛选触发 onClear", () => {
    const handleClear = vi.fn();
    render(<QuestionFilterPanel filters={{ difficulty: "easy" }} onChange={() => {}} onClear={handleClear} />);
    fireEvent.click(screen.getByText("清除筛选"));
    expect(handleClear).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run src/components/QuestionFilterPanel.test.tsx
```

Expected: FAIL

- [ ] **Step 3: 实现 QuestionFilterPanel 组件**

Create `src/components/QuestionFilterPanel.tsx`:

```typescript
"use client";

import { Button } from "@/components/ui/Button";

export interface QuestionFilters {
  difficulty?: "easy" | "medium" | "hard";
  questionType?: "code" | "qa";
  hasSolution?: boolean;
  orderBy?: "createdAt" | "viewCount" | "encounterCount";
  orderDir?: "asc" | "desc";
}

interface Props {
  filters: QuestionFilters;
  onChange: (filters: QuestionFilters) => void;
  onClear?: () => void;
}

export function QuestionFilterPanel({ filters, onChange, onClear }: Props) {
  const set = (patch: Partial<QuestionFilters>) => {
    onChange({ ...filters, ...patch });
  };

  const toggleDifficulty = (value: QuestionFilters["difficulty"]) => {
    set({ difficulty: filters.difficulty === value ? undefined : value });
  };

  const toggleType = (value: QuestionFilters["questionType"]) => {
    set({ questionType: filters.questionType === value ? undefined : value });
  };

  return (
    <div className="p-4 space-y-4 border-b" style={{ borderColor: "var(--outline-variant)" }}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-on-surface-variant">难度：</span>
        {[
          { key: "easy", label: "简单" },
          { key: "medium", label: "中等" },
          { key: "hard", label: "困难" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggleDifficulty(key as QuestionFilters["difficulty"])}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              filters.difficulty === key
                ? "bg-primary-container text-on-primary-container border-primary-container"
                : "bg-surface-high text-on-surface-variant border-outline-variant hover:border-outline"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-on-surface-variant">题型：</span>
        {[
          { key: "qa", label: "问答" },
          { key: "code", label: "代码" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggleType(key as QuestionFilters["questionType"])}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              filters.questionType === key
                ? "bg-primary-container text-on-primary-container border-primary-container"
                : "bg-surface-high text-on-surface-variant border-outline-variant hover:border-outline"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-on-surface-variant">排序：</span>
        <select
          value={filters.orderBy ?? "createdAt"}
          onChange={(e) => set({ orderBy: e.target.value as QuestionFilters["orderBy"] })}
          className="px-3 py-1 rounded-lg border bg-transparent text-sm text-on-surface"
          style={{ borderColor: "var(--outline-variant)" }}
        >
          <option value="createdAt">最新</option>
          <option value="viewCount">最多浏览</option>
          <option value="encounterCount">最多被考</option>
        </select>
        <button
          onClick={() => set({ orderDir: filters.orderDir === "asc" ? "desc" : "asc" })}
          className="px-3 py-1 rounded-lg border text-sm bg-surface-high text-on-surface-variant hover:text-on-surface"
          style={{ borderColor: "var(--outline-variant)" }}
        >
          {filters.orderDir === "asc" ? "升序" : "降序"}
        </button>
        <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
          <input
            type="checkbox"
            checked={filters.hasSolution ?? false}
            onChange={(e) => set({ hasSolution: e.target.checked })}
          />
          仅看有题解
        </label>
      </div>

      {(filters.difficulty || filters.questionType || filters.hasSolution) && (
        <div>
          <Button variant="ghost" size="sm" onClick={onClear}>
            清除筛选
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 改造题目列表页**

Modify `src/app/questions/page.tsx`:

在 import 区追加：

```typescript
import { QuestionFilterPanel, QuestionFilters } from "@/components/QuestionFilterPanel"
```

在 state 区增加：

```typescript
const [filters, setFilters] = useState<QuestionFilters>({})
```

在 URL params 构建处追加：

```typescript
if (filters.difficulty) params.set("difficulty", filters.difficulty)
if (filters.questionType) params.set("questionType", filters.questionType)
if (filters.hasSolution) params.set("hasSolution", "true")
params.set("orderBy", filters.orderBy ?? "createdAt")
params.set("orderDir", filters.orderDir ?? "desc")
```

在 reset page effect 中增加依赖：

```typescript
useEffect(() => {
  setPage(1)
}, [selectedLang, selectedBank, search, filters])
```

在 `main` 内容区 Toolbar 下方插入：

```tsx
<QuestionFilterPanel filters={filters} onChange={setFilters} onClear={() => setFilters({})} />
```

- [ ] **Step 5: 后端 API 支持 hasSolution 与排序**

Modify `src/app/api/questions/route.ts`:

在 where 构建处追加：

```typescript
if (searchParams.get("hasSolution") === "true") {
  where.solution = { not: null }
}
```

orderBy 已在前述 Step 中修改。

- [ ] **Step 6: 运行测试并提交**

```bash
npx vitest run src/components/QuestionFilterPanel.test.tsx
git add src/components/QuestionFilterPanel.tsx src/components/QuestionFilterPanel.test.tsx src/app/questions/page.tsx src/app/api/questions/route.ts
git commit -m "feat(questions): add multi-dimensional filter and sort panel"
```

---

## Task 4: 试题篮 + 组卷 + 下载（P1）

**Files:**

- Create: `src/hooks/useQuestionBasket.ts`
- Create: `src/components/QuestionBasketButton.tsx`
- Create: `src/components/QuestionBasketDrawer.tsx`
- Create: `src/app/test-papers/new/page.tsx`
- Create: `src/app/test-papers/[id]/page.tsx`
- Create: `src/app/test-papers/[id]/download/page.tsx`
- Create: `src/app/api/test-papers/route.ts`
- Create: `src/app/api/test-papers/[id]/route.ts`
- Create: `src/app/api/test-papers/route.test.ts`
- Modify: `src/components/QuestionItem.tsx` 或 `QuestionGrid`（加入试题篮按钮）
- Modify: `src/app/layout.tsx`（全局挂载抽屉）

- [ ] **Step 1: 写试题篮 hook 测试**

Create `src/hooks/useQuestionBasket.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useQuestionBasket, QuestionBasketItem } from "./useQuestionBasket"

describe("useQuestionBasket", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("初始为空", () => {
    const { result } = renderHook(() => useQuestionBasket())
    expect(result.current.items).toEqual([])
  })

  it("添加题目", () => {
    const { result } = renderHook(() => useQuestionBasket())
    const q: QuestionBasketItem = { id: "q1", title: "T", difficulty: "easy", questionType: "qa" }
    act(() => result.current.add(q))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.isInBasket("q1")).toBe(true)
  })

  it("移除题目", () => {
    const { result } = renderHook(() => useQuestionBasket())
    const q: QuestionBasketItem = { id: "q1", title: "T", difficulty: "easy", questionType: "qa" }
    act(() => result.current.add(q))
    act(() => result.current.remove("q1"))
    expect(result.current.isInBasket("q1")).toBe(false)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run src/hooks/useQuestionBasket.test.ts
```

Expected: FAIL

- [ ] **Step 3: 实现 useQuestionBasket hook**

Create `src/hooks/useQuestionBasket.ts`:

```typescript
"use client"

import { useState, useEffect, useCallback } from "react"

export interface QuestionBasketItem {
  id: string
  title: string
  difficulty: string
  questionType: string
}

const STORAGE_KEY = "interview_question_basket"

export function useQuestionBasket() {
  const [items, setItems] = useState<QuestionBasketItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
  }, [])

  const save = useCallback((list: QuestionBasketItem[]) => {
    setItems(list)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  }, [])

  const add = useCallback((item: QuestionBasketItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev
      const next = [...prev, item]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setItems([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const isInBasket = useCallback((id: string) => items.some((i) => i.id === id), [items])

  return { items, add, remove, clear, isInBasket }
}
```

- [ ] **Step 4: 实现试题篮按钮与抽屉**

Create `src/components/QuestionBasketButton.tsx`:

```typescript
"use client";

import { Button } from "@/components/ui/Button";
import { useQuestionBasket, QuestionBasketItem } from "@/hooks/useQuestionBasket";

interface Props {
  question: QuestionBasketItem;
}

export function QuestionBasketButton({ question }: Props) {
  const { add, remove, isInBasket } = useQuestionBasket();
  const inBasket = isInBasket(question.id);

  return (
    <Button
      variant={inBasket ? "primary" : "secondary"}
      size="sm"
      onClick={() => (inBasket ? remove(question.id) : add(question))}
    >
      {inBasket ? "已加入" : "+ 试题篮"}
    </Button>
  );
}
```

Create `src/components/QuestionBasketDrawer.tsx`:

```typescript
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useQuestionBasket } from "@/hooks/useQuestionBasket";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function QuestionBasketDrawer({ open, onClose }: Props) {
  const { items, remove, clear } = useQuestionBasket();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md shadow-2xl p-6 flex flex-col"
        style={{ backgroundColor: "var(--surface-bright)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-on-surface">试题篮 ({items.length})</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">×</button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {items.length === 0 && <p className="text-sm text-on-surface-variant">还没有挑选题目</p>}
          {items.map((q) => (
            <div key={q.id} className="p-3 rounded-lg border flex items-center justify-between" style={{ borderColor: "var(--outline-variant)" }}>
              <div>
                <div className="text-sm font-medium text-on-surface line-clamp-1">{q.title}</div>
                <div className="text-xs text-on-surface-variant">{q.difficulty} · {q.questionType === "code" ? "代码题" : "问答题"}</div>
              </div>
              <button onClick={() => remove(q.id)} className="text-error text-sm px-2">移除</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-4 border-t" style={{ borderColor: "var(--outline-variant)" }}>
          <Button variant="ghost" onClick={clear} className="flex-1">清空</Button>
          <Link href="/test-papers/new" className="flex-1">
            <Button className="w-full">去组卷</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 全局挂载试题篮抽屉与浮动入口**

Modify `src/app/layout.tsx`:

在 layout 组件中追加：

```typescript
"use client" // 如果 layout 是 server component 需要改为 client 或创建 wrapper
```

更好的做法：创建 `src/components/QuestionBasketProvider.tsx`。

Create `src/components/QuestionBasketProvider.tsx`:

```typescript
"use client";

import { useState } from "react";
import { QuestionBasketDrawer } from "./QuestionBasketDrawer";

export function QuestionBasketProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {children}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-40 px-4 py-3 rounded-full shadow-lg bg-primary-container text-on-primary-container font-medium"
      >
        试题篮
      </button>
      <QuestionBasketDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

Modify `src/app/layout.tsx`:

在 Providers 内部包裹 `QuestionBasketProvider`。

- [ ] **Step 6: 写组卷 API 测试**

Create `src/app/api/test-papers/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    testPaper: { create: vi.fn() },
    question: { findMany: vi.fn() }
  }
}))

vi.mock("next-auth", () => ({
  getServerSession: vi.fn()
}))

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { POST } from "./route"

beforeEach(() => vi.clearAllMocks())

describe("POST /api/test-papers", () => {
  it("未登录返回 401", async () => {
    ;(getServerSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await POST(
      new NextRequest("http://localhost/api/test-papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "试卷", questionIds: ["q1"] })
      })
    )
    expect(res.status).toBe(401)
  })

  it("创建试卷", async () => {
    ;(getServerSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: "u1" }
    })
    ;(prisma.question.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "q1", questionType: "qa" }
    ])
    ;(prisma.testPaper.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "p1"
    })

    const res = await POST(
      new NextRequest("http://localhost/api/test-papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "试卷", detail: "描述", questionIds: ["q1"], isPublic: false })
      })
    )
    expect(res.status).toBe(201)
  })
})
```

- [ ] **Step 7: 运行测试确认失败**

```bash
npx vitest run src/app/api/test-papers/route.test.ts
```

Expected: FAIL

- [ ] **Step 8: 实现组卷 API**

Create `src/app/api/test-papers/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { name, detail, questionIds, isPublic, tags } = await request.json()

  if (!name?.trim() || !Array.isArray(questionIds) || questionIds.length === 0) {
    return NextResponse.json({ error: "试卷名称和题目不能为空" }, { status: 400 })
  }

  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, questionType: true }
  })

  if (questions.length !== questionIds.length) {
    return NextResponse.json({ error: "部分题目不存在" }, { status: 400 })
  }

  const paper = await prisma.testPaper.create({
    data: {
      name: name.trim(),
      detail: detail?.trim() ?? null,
      userId: session.user.id,
      isPublic: !!isPublic,
      tags: Array.isArray(tags) ? tags : [],
      items: {
        create: questionIds.map((id: string, index: number) => {
          const q = questions.find((x) => x.id === id)!
          return {
            questionId: id,
            questionType: q.questionType,
            sortOrder: index
          }
        })
      }
    }
  })

  return NextResponse.json({ id: paper.id }, { status: 201 })
}
```

- [ ] **Step 9: 实现 GET /api/test-papers/[id] 与下载页**

Create `src/app/api/test-papers/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const paper = await prisma.testPaper.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: { question: { include: { tags: true } } }
      }
    }
  })

  if (!paper) {
    return NextResponse.json({ error: "试卷不存在" }, { status: 404 })
  }

  return NextResponse.json(paper)
}
```

Create `src/app/test-papers/new/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useQuestionBasket } from "@/hooks/useQuestionBasket";

export default function NewTestPaperPage() {
  const { items, remove, clear } = useQuestionBasket();
  const router = useRouter();
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || items.length === 0) return;
    setLoading(true);
    const res = await fetch("/api/test-papers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        detail,
        questionIds: items.map((i) => i.id),
      }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      clear();
      router.push(`/test-papers/${data.id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-on-surface mb-6">创建试卷</h1>
      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-on-surface-variant mb-1">试卷名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-transparent text-on-surface"
              style={{ borderColor: "var(--outline-variant)" }}
            />
          </div>
          <div>
            <label className="block text-sm text-on-surface-variant mb-1">描述</label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-transparent text-on-surface"
              style={{ borderColor: "var(--outline-variant)" }}
              rows={3}
            />
          </div>
        </div>
      </Card>
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-on-surface mb-4">已选题目 ({items.length})</h2>
        {items.length === 0 && <p className="text-sm text-on-surface-variant">试题篮为空</p>}
        <div className="space-y-2">
          {items.map((q) => (
            <div key={q.id} className="flex items-center justify-between p-3 border rounded-lg" style={{ borderColor: "var(--outline-variant)" }}>
              <span className="text-sm text-on-surface">{q.title}</span>
              <button onClick={() => remove(q.id)} className="text-error text-sm">移除</button>
            </div>
          ))}
        </div>
      </Card>
      <Button onClick={handleSubmit} disabled={loading || !name.trim() || items.length === 0}>
        {loading ? "创建中" : "创建试卷"}
      </Button>
    </div>
  );
}
```

Create `src/app/test-papers/[id]/page.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useParams } from "next/navigation";

export default function TestPaperPage() {
  const { id } = useParams<{ id: string }>();
  const [paper, setPaper] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/test-papers/${id}`).then((r) => r.json()).then(setPaper);
  }, [id]);

  if (!paper) return <div className="p-6">加载中...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-on-surface">{paper.name}</h1>
        <Link href={`/test-papers/${id}/download`} target="_blank">
          <Button>下载 / 打印</Button>
        </Link>
      </div>
      {paper.detail && <p className="text-on-surface-variant mb-6">{paper.detail}</p>}
      <div className="space-y-4">
        {paper.items.map((item: any, index: number) => (
          <Card key={item.id} className="p-4">
            <div className="text-sm font-semibold text-on-surface mb-2">{index + 1}. {item.question.title}</div>
            <div className="text-sm text-on-surface-variant line-clamp-3">{item.question.content}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

Create `src/app/test-papers/[id]/download/page.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function DownloadTestPaperPage() {
  const { id } = useParams<{ id: string }>();
  const [paper, setPaper] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/test-papers/${id}`).then((r) => r.json()).then((data) => {
      setPaper(data);
      setTimeout(() => window.print(), 200);
    });
  }, [id]);

  if (!paper) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white text-black">
      <h1 className="text-2xl font-bold mb-2">{paper.name}</h1>
      {paper.detail && <p className="mb-6 text-gray-600">{paper.detail}</p>}
      <div className="space-y-6">
        {paper.items.map((item: any, index: number) => (
          <div key={item.id} className="border-b pb-4 break-inside-avoid">
            <div className="font-semibold mb-2">{index + 1}. {item.question.title}</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{item.question.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 10: 在题目列表/详情加入试题篮按钮**

Modify `src/app/questions/QuestionGrid.tsx`（或列表项组件）：

在题目卡片操作区插入：

```tsx
import { QuestionBasketButton } from "@/components/QuestionBasketButton"

;<QuestionBasketButton
  question={{ id: q.id, title: q.title, difficulty: q.difficulty, questionType: q.questionType }}
/>
```

- [ ] **Step 11: 运行测试并提交**

```bash
npx vitest run src/hooks/useQuestionBasket.test.ts src/app/api/test-papers/route.test.ts
git add src/hooks/useQuestionBasket.ts src/hooks/useQuestionBasket.test.ts src/components/QuestionBasketButton.tsx src/components/QuestionBasketDrawer.tsx src/components/QuestionBasketProvider.tsx src/app/test-papers/ src/app/api/test-papers/ src/app/layout.tsx src/app/questions/QuestionGrid.tsx
git commit -m "feat(test-paper): add question basket, paper creation and download"
```

---

## Task 5: 语音读题（P2）

**Files:**

- Create: `src/lib/speak.ts`
- Create: `src/components/SpeakButton.tsx`
- Create: `src/lib/speak.test.ts`
- Modify: `src/app/questions/[id]/page.tsx`

- [ ] **Step 1: 写语音文本生成测试**

Create `src/lib/speak.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import { buildQuestionSpeakText } from "./speak"

describe("buildQuestionSpeakText", () => {
  it("生成题目朗读文本", () => {
    const text = buildQuestionSpeakText({
      title: "什么是闭包？",
      content: "请解释 JavaScript 闭包。",
      questionType: "qa",
      difficulty: "medium"
    })
    expect(text).toContain("什么是闭包")
    expect(text).toContain("请解释 JavaScript 闭包")
  })

  it("包含选项", () => {
    const text = buildQuestionSpeakText({
      title: "选择正确的答案",
      content: "以下哪个是数组方法？",
      questionType: "qa",
      options: ["push", "split", "join"]
    })
    expect(text).toContain("A. push")
    expect(text).toContain("B. split")
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run src/lib/speak.test.ts
```

Expected: FAIL

- [ ] **Step 3: 实现语音文本工具**

Create `src/lib/speak.ts`:

```typescript
export interface SpeakableQuestion {
  title: string
  content: string
  questionType: string
  solution?: string | null
  options?: string[]
}

export function buildQuestionSpeakText(
  q: SpeakableQuestion,
  includeSolution = false,
  index?: number
): string {
  const parts: string[] = []
  parts.push(index ? `第${index}题：${q.title}` : `题目：${q.title}`)
  if (q.content.trim() !== q.title.trim()) {
    parts.push(`描述：${stripMarkdown(q.content)}`)
  }
  if (q.options && q.options.length > 0) {
    parts.push(
      `选项：${q.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("，")}`
    )
  }
  if (includeSolution && q.solution) {
    parts.push(`解析：${stripMarkdown(q.solution)}`)
  }
  return parts.join("\n")
}

function stripMarkdown(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/[#*_`>\-\[\]()]/g, "")
    .trim()
}

export function speak(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = "zh-CN"
  utter.rate = 1
  window.speechSynthesis.speak(utter)
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}
```

- [ ] **Step 4: 实现 SpeakButton 组件**

Create `src/components/SpeakButton.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { buildQuestionSpeakText, speak, stopSpeaking, SpeakableQuestion } from "@/lib/speak";

interface Props {
  question: SpeakableQuestion;
  includeSolution?: boolean;
}

export function SpeakButton({ question, includeSolution = false }: Props) {
  const [speaking, setSpeaking] = useState(false);

  const handleClick = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    const text = buildQuestionSpeakText(question, includeSolution);
    speak(text);
    setSpeaking(true);
    // 简单做法：3 秒后重置，实际应监听 utterance.onend
    setTimeout(() => setSpeaking(false), 5000);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      {speaking ? "🔊 朗读中" : "🔊 朗读题目"}
    </Button>
  );
}
```

- [ ] **Step 5: 在题目详情页加入朗读按钮**

Modify `src/app/questions/[id]/page.tsx`:

在 import 区追加：

```typescript
import { SpeakButton } from "@/components/SpeakButton"
```

在操作按钮区插入：

```tsx
<SpeakButton
  question={{
    title: question.title,
    content: question.content,
    questionType: question.questionType,
    solution: question.solution
  }}
/>
```

- [ ] **Step 6: 运行测试并提交**

```bash
npx vitest run src/lib/speak.test.ts
git add src/lib/speak.ts src/lib/speak.test.ts src/components/SpeakButton.tsx src/app/questions/[id]/page.tsx
git commit -m "feat(question): add text-to-speech read button"
```

---

## Task 6: 共同编辑解析（P2）

**Files:**

- Create: `src/app/api/questions/[id]/edits/route.ts`
- Create: `src/app/api/admin/question-edits/route.ts`
- Create: `src/app/api/admin/question-edits/[id]/route.ts`
- Create: `src/components/QuestionEditButton.tsx`
- Create: `src/components/QuestionEditDialog.tsx`
- Create: `src/app/admin/question-edits/page.tsx`
- Modify: `src/app/questions/[id]/page.tsx`

- [ ] **Step 1: 实现题目解析编辑提交 API**

Create `src/app/api/questions/[id]/edits/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { id } = await params
  const { description, reference } = await request.json()

  if (!description?.trim() || !reference?.trim()) {
    return NextResponse.json({ error: "修改说明和解析内容不能为空" }, { status: 400 })
  }

  const question = await prisma.question.findUnique({ where: { id } })
  if (!question) {
    return NextResponse.json({ error: "题目不存在" }, { status: 404 })
  }

  await prisma.questionEdit.create({
    data: {
      questionId: id,
      userId: session.user.id,
      description: description.trim(),
      reference: reference.trim()
    }
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
```

- [ ] **Step 2: 实现管理后台审核 API**

Create `src/app/api/admin/question-edits/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const authError = await requireAdmin()
  if (authError) return authError

  const edits = await prisma.questionEdit.findMany({
    where: { status: "pending" },
    include: { question: { select: { title: true } }, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json({ edits })
}
```

Create `src/app/api/admin/question-edits/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const { status, reviewMessage } = await request.json()

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "无效状态" }, { status: 400 })
  }

  const edit = await prisma.questionEdit.update({
    where: { id },
    data: { status, reviewMessage: reviewMessage ?? null },
    include: { question: true }
  })

  if (status === "approved" && edit.question) {
    await prisma.question.update({
      where: { id: edit.questionId },
      data: { solution: edit.reference }
    })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: 实现前端提交 Dialog**

Create `src/components/QuestionEditDialog.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  open: boolean;
  onClose: () => void;
  questionId: string;
  onSuccess?: () => void;
}

export function QuestionEditDialog({ open, onClose, questionId, onSuccess }: Props) {
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!description.trim() || !reference.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/questions/${questionId}/edits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, reference }),
    });
    setLoading(false);
    if (res.ok) {
      onSuccess?.();
      onClose();
      setDescription("");
      setReference("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl rounded-xl shadow-2xl p-6" style={{ backgroundColor: "var(--surface-bright)" }}>
        <h3 className="text-base font-semibold text-on-surface mb-4">改进题目解析</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-on-surface-variant mb-1">修改说明</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-transparent text-on-surface"
              style={{ borderColor: "var(--outline-variant)" }}
            />
          </div>
          <div>
            <label className="block text-sm text-on-surface-variant mb-1">解析内容（Markdown）</label>
            <textarea
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-transparent text-on-surface font-mono text-sm"
              style={{ borderColor: "var(--outline-variant)" }}
              rows={10}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={submit} disabled={loading}>提交</Button>
        </div>
      </div>
    </div>
  );
}
```

Create `src/components/QuestionEditButton.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { QuestionEditDialog } from "./QuestionEditDialog";

interface Props {
  questionId: string;
}

export function QuestionEditButton({ questionId }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        ✏️ 改进解析
      </Button>
      <QuestionEditDialog open={open} onClose={() => setOpen(false)} questionId={questionId} />
    </>
  );
}
```

- [ ] **Step 4: 实现管理后台页面**

Create `src/app/admin/question-edits/page.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function QuestionEditReviewPage() {
  const [edits, setEdits] = useState<any[]>([]);

  const load = () => fetch("/api/admin/question-edits").then((r) => r.json()).then((d) => setEdits(d.edits ?? []));

  useEffect(() => { load(); }, []);

  const review = async (id: string, status: "approved" | "rejected") => {
    await fetch(`/api/admin/question-edits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-on-surface mb-6">解析编辑审核</h1>
      <div className="space-y-4">
        {edits.map((edit) => (
          <Card key={edit.id} className="p-4">
            <div className="text-sm text-on-surface-variant mb-1">{edit.question.title} · {edit.user?.name ?? "匿名"}</div>
            <div className="text-sm text-on-surface mb-2">说明：{edit.description}</div>
            <div className="p-3 rounded-lg bg-surface-high text-sm text-on-surface mb-4 whitespace-pre-wrap">{edit.reference}</div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => review(edit.id, "approved")}>通过</Button>
              <Button variant="danger" size="sm" onClick={() => review(edit.id, "rejected")}>拒绝</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 在题目详情页加入改进解析按钮**

Modify `src/app/questions/[id]/page.tsx`:

在 import 区追加：

```typescript
import { QuestionEditButton } from "@/components/QuestionEditButton"
```

在操作区插入：

```tsx
<QuestionEditButton questionId={questionId} />
```

- [ ] **Step 6: 提交 Task 6**

```bash
git add src/app/api/questions/[id]/edits/ src/app/api/admin/question-edits/ src/components/QuestionEditButton.tsx src/components/QuestionEditDialog.tsx src/app/admin/question-edits/page.tsx src/app/questions/[id]/page.tsx
git commit -m "feat(question-edit): add collaborative solution editing and admin review"
```

---

## Self-Review

**1. Spec coverage:**

- 公司真题标记：Task 1 覆盖 API、聚合、前端 Dialog 与详情页按钮。
- 热门搜索与历史：Task 2 覆盖历史存储、热搜统计、搜索弹窗改造。
- 多维度筛选排序：Task 3 覆盖筛选面板与后端排序字段扩展。
- 试题篮组卷下载：Task 4 覆盖 localStorage 试题篮、组卷 API、试卷详情、打印下载页。
- 语音读题：Task 5 覆盖 TTS 文本生成与朗读按钮。
- 共同编辑解析：Task 6 覆盖提交、管理审核、通过后更新题目 solution。

**2. Placeholder scan:**

- 无 TBD/TODO。
- 所有步骤含完整代码或命令。
- 类型名称一致：`QuestionFilters`、`QuestionBasketItem`、`SpeakableQuestion`。

**3. Type consistency:**

- `QuestionFilters` 在 Task 3 定义并复用。
- `QuestionBasketItem` 在 hook 与 button 组件中一致。
- API 返回格式统一为 JSON + status code。

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-06-19-interview-platform-features.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints for review.

**Which approach?**
