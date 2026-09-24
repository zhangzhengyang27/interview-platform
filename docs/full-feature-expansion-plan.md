# 面试网全功能扩展实施方案

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有面试平台基础上，补齐 15 项缺失功能，从单用户工具升级为完整的多用户面试准备平台。

**Architecture:** 采用分层递进策略 — Phase 1 建立用户认证基础设施（所有社交功能的前置依赖）；Phase 2 修复已有功能的体验缺陷（AI 流式化、笔记持久化）；Phase 3 构建核心竞争力功能（OJ 判题、数据可视化、PWA）；Phase 4 实现增长引擎（社区排名、分享、提醒）。

**Tech Stack:** Next.js 16 (App Router) + React 19 + Prisma 7 + PostgreSQL + Tailwind CSS 4 + DeepSeek AI。新增依赖：NextAuth.js v5 (auth)、recharts (图表)、next-pwa 或手动 SW (PWA)、node-cron 或 Vercel Cron (定时任务)。

---

## 文件结构总览

### 新增文件

```
src/
├── app/
│   ├── (auth)/                          # Phase 1: 认证路由组
│   │   ├── login/page.tsx               # 登录页
│   │   ├── register/page.tsx            # 注册页
│   │   └── layout.tsx                   # 认证布局（无导航栏）
│   ├── api/auth/
│   │   └── [...nextauth]/route.ts       # NextAuth API
│   ├── api/auth/register/route.ts       # 注册 API
│   ├── api/notes/[id]/route.ts          # 笔记更新/删除 API（Phase 2）
│   ├── api/run-code/route.ts            # 代码执行 API（Phase 3）
│   ├── api/share/route.ts               # 分享卡片生成 API（Phase 4）
│   ├── api/leaderboard/route.ts         # 排行榜 API（Phase 4）
│   ├── api/reminders/route.ts           # 复习提醒 API（Phase 4）
│   ├── profile/page.tsx                 # 个人资料页（Phase 1）
│   ├── settings/page.tsx                # 设置页（Phase 1）
│   ├── companies/[company]/page.tsx     # 公司题库专题页（Phase 4）
│   └── report/page.tsx                  # 举报页（Phase 4）
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx                # 登录表单组件
│   │   ├── RegisterForm.tsx             # 注册表单组件
│   │   └── AuthGuard.tsx                # 路由守卫 HOC
│   ├── charts/
│   │   ├── RadarChart.tsx               # 能力雷达图
│   │   ├── ProgressLineChart.tsx        # 进步曲线图
│   │   └── CategoryPieChart.tsx         # 分类饼图
│   ├── CodeRunner.tsx                   # 代码运行器（含输出面板）
│   ├── ShareDialog.tsx                  # 分享弹窗
│   ├── LeaderboardWidget.tsx            # 排行榜组件
│   └── ReminderBadge.tsx                # 复习提醒徽章
├── lib/
│   ├── auth.ts                          # NextAuth 配置
│   ├── code-runner.ts                   #代码执行引擎（Docker/Piston API）
│   └── share.ts                         # 分享卡片生成逻辑
├── hooks/
│   └── useAuth.ts                       # 认证 Hook
├── middleware.ts                         # 认证中间件（保护路由）
├── public/
│   ├── manifest.json                    # PWA manifest
│   ├── sw.js                            # Service Worker
│   └── icons/                           # PWA 图标（192x192, 512x512）
prisma/
└── schema.prisma                        # 新增 User/Follow/BookmarkFolder 等模型
```

### 修改文件

| 文路径 | 改动说明 |
|--------|---------|
| `prisma/schema.prisma` | 新增 User, Follow, BookmarkFolder, BookmarkItem, Report, ShareLink, Notification 模型 |
| `src/app/layout.tsx` | 集成 SessionProvider，添加用户头像/登录按钮到 TopNav |
| `src/components/layout/TopNav.tsx` | 右侧操作区替换为：通知铃铛 + 用户头像下拉菜单（未登录显示登录按钮） |
| `src/app/globals.css` | PWA 相关样式、安全区域增强 |
| `src/app/api/ai/route.ts` | `stream: false` → `stream: true`，改用 SSE 流式返回 |
| `src/app/ai/page.tsx` | 接收 SSE 流式响应，逐字渲染 AI 回复 |
| `src/app/experiences/page.tsx` | 编辑内容调用 PUT /api/notes/[id] 持久化 |
| `src/app/questions/[id]/page.tsx` | 编辑器区域下方新增「运行代码」按钮 + 输出面板 |
| `src/app/page.tsx` (Dashboard) | 新增能力雷达图卡片、进步曲线卡片 |
| `package.json` | 新增依赖包 |
| `next.config.ts` | headers 配置（CORS for code runner）、PWA headers |
| `.env` | 新增 AUTH_SECRET, GITHUB_ID, GITHUB_SECRET 等环境变量 |

---

## Phase 1: 用户认证系统（基础设施）

> **依赖关系:** 无前置依赖。**被依赖于:** Phase 4 所有社交功能。
> **预估工作量:** 8 个 Task。

### Task 1.1: 数据库 User 模型 + 关联改造

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: 在 schema.prisma 中新增 User 模型**

在现有模型定义之前插入：

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  password      String?   // Credentials provider 时有值
  image         String?
  role          String    @default("user") // "user" | "admin"
  bio           String?
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // 关联
  practiceHistory PracticeHistory[]
  comments        Comment[]
  studyPlans      StudyPlan[]
  notes           Note[]
  mockInterviews  MockInterview[]
  followers       Follow[] @relation("Following")
  following       Follow[] @relation("Follower")
  bookmarkFolders BookmarkFolder[]
  reports         Report[]
  shares          ShareLink[]
  notifications   Notification[]

  @@map("users")
}

model Follow {
  id          String   @id @default(uuid())
  followerId  String   @map("follower_id")
  followingId String   @map("following_id")
  createdAt   DateTime @default(now()) @map("created_at")

  follower  User @relation("Following", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("Follower", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@map("follows")
}

model BookmarkFolder {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  name      String
  icon      String?
  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")

  user   User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  items  BookmarkItem[]

  @@map("bookmark_folders")
}

model BookmarkItem {
  id              String @id @default(uuid())
  folderId        String @map("folder_id")
  questionId      String @map("question_id")
  addedAt         DateTime @default(now()) @map("added_at")
  note            String?

  folder   BookmarkFolder @relation(fields: [folderId], references: [id], onDelete: Cascade)
  question Question      @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([folderId, questionId])
  @@map("bookmark_items")
}

model Report {
  id          String   @id @default(uuid())
  reporterId  String   @map("reporter_id")
  target_type String   @map("target_type") // "question" | "comment" | "note"
  targetId    String   @map("target_id")
  reason      String   // "spam" | "inappropriate" | "copyright" | "other"
  description String?
  status      String   @default("pending") // "pending" | "resolved" | "dismissed"
  createdAt   DateTime @default(now()) @map("created_at")

  reporter User @relation(fields: [reporterId], references: [id], onDelete: Cascade)

  @@map("reports")
}

model ShareLink {
  id          String   @id @default(uuid())
  creatorId   String   @map("creator_id")
  type        String   // "question" | "note" | "interview_result"
  targetId    String   @map("target_id")
  slug        String   @unique
  views       Int      @default(0)
  createdAt   DateTime @default(now()) @map("created_at")
  expiresAt   DateTime? @map("expires_at")

  creator User @relation(fields: [creatorId], references: [id], onDelete: Cascade)

  @@map("share_links")
}

model Notification {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  type      String   // "follow" | "comment_reply" | "mention" | "reminder" | "system"
  title     String
  body      String?
  link      String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, read])
  @@map("notifications")
}
```

- [ ] **Step 2: 为现有模型添加 userId 外键**

修改以下模型，添加 `userId` 字段和关联：

```prisma
// PracticeHistory — 新增：
userId      String? @map("user_id")
user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

// Comment — 新增：
userId      String? @map("user_id")
user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

// Note — 新增：
userId      String? @map("user_id")
user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

// MockInterview — 新增：
userId      String? @map("user_id")
user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

// StudyPlan — 新增：
userId      String? @map("user_id")
user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

// Question — 移除 isBookmarked 字段（改为通过 BookmarkItem 关联）
// 注意：保留 isBookmarked 作为过渡兼容字段，后续 Task 再移除
```

- [ ] **Step 3: 运行数据库迁移**

```bash
pnpm db:migrate
```

预期输出：Migration 成功创建并应用。

- [ ] **Step 4: 更新种子数据**

修改 `prisma/seed.ts`，创建一个默认测试用户：

```typescript
const testUser = await prisma.user.upsert({
  where: { email: "test@example.com" },
  update: {},
  create: {
    email: "test@example.com",
    name: "测试用户",
    role: "admin",
  },
});
```

将现有 seed 数据关联到该测试用户。

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts
git commit -m "feat: add User model and related models for auth system"
```

---

### Task 1.2: NextAuth.js v5 认证配置

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Modify: `package.json` (新增依赖)
- Modify: `.env` / `.env.local`

- [ ] **Step 1: 安装认证依赖**

```bash
pnpm add next-auth@beta @auth/prisma-adapter bcryptjs && pnpm add -D @types/bcryptjs
```

- [ ] **Step 2: 创建 auth 配置文件**

创建 `src/lib/auth.ts`：

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GitHub,
    Credentials({
      name: "密码登录",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
});
```

- [ ] **Step 3: 创建 NextAuth API 路由**

创建 `src/app/api/auth/[...nextauth]/route.ts`：

```typescript
export { handlers as GET, handlers as POST } from "@/lib/auth";
```

- [ ] **Step 4: 注册 API**

创建 `src/app/api/auth/register/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "密码至少6位" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "注册失败" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 5: 更新环境变量模板**

在 `.env` 和 `.env.local` 中追加：

```
AUTH_SECRET=your-random-secret-string-at-least-32-chars
AUTH_URL=http://localhost:3000
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/ .env .env.local package.json pnpm-lock.yaml
git commit -m "feat: add NextAuth.js v5 with credentials + GitHub OAuth"
```

---

### Task 1.3: 登录/注册页面

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/components/auth/LoginForm.tsx`
- Create: `src/components/auth/RegisterForm.tsx`

- [ ] **Step 1: 创建认证布局**

创建 `src/app/(auth)/layout.tsx`：

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: 创建登录表单组件**

创建 `src/components/auth/LoginForm.tsx`：

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, redirectTo: "/" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "登录失败");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px]">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-primary">面试网</h1>
        <p className="text-sm mt-2 text-on-surface-variant">
          登录以开启你的面试准备之旅
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-4 p-3 rounded-lg text-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--error) 10%, transparent)",
            color: "var(--error)",
            border: "1px solid var(--error)",
          }}
        >
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">
            邮箱
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-2.5 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--outline-variant)",
              color: "var(--on-surface)",
            }}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-2.5 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--outline-variant)",
              color: "var(--on-surface)",
            }}
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" variant="primary" className="w-full" size="lg" disabled={loading}>
          {loading ? "登录中..." : "登录"}
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--outline-variant)" }} />
        <span className="text-xs text-on-surface-variant">或</span>
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--outline-variant)" }} />
      </div>

      {/* GitHub OAuth */}
      <button
        onClick={() => {
          window.location.href = "/api/auth/signin?provider=github&callbackUrl=/";
        }}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-medium transition-colors hover:bg-surface-high"
        style={{
          borderColor: "var(--outline-variant)",
          color: "var(--on-surface)",
        }}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        GitHub 登录
      </button>

      {/* Register Link */}
      <p className="text-center text-sm mt-6 text-on-surface-variant">
        还没有账号？{" "}
        <Link href="/register" className="font-medium hover:text-primary transition-colors">
          注册
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: 创建注册表单组件**

创建 `src/components/auth/RegisterForm.tsx`：

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function RegisterForm() {
  const [form, setForm] = useState({ email: "", name: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "注册失败");

      // 注册成功后自动登录
      const loginRes = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          redirectTo: "/",
        }),
      });

      if (loginRes.ok) {
        router.push("/");
        router.refresh();
      } else {
        router.push("/login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-primary">注册</h1>
        <p className="text-sm mt-2 text-on-surface-variant">
          创建账号，开始系统化面试准备
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{
          backgroundColor: "color-mix(in srgb, var(--error) 10%, transparent)",
          color: "var(--error)", border: "1px solid var(--error)"
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-on-surface">昵称</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="w-full px-4 py-2.5 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--outline-variant)", color: "var(--on-surface)" }}
            placeholder="你的昵称"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-on-surface">邮箱</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            autoComplete="email"
            className="w-full px-4 py-2.5 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--outline-variant)", color: "var(--on-surface)" }}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-on-surface">密码</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required minLength={6}
            className="w-full px-4 py-2.5 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--outline-variant)", color: "var(--on-surface)" }}
            placeholder="至少6位"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-on-surface">确认密码</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            required
            className="w-full px-4 py-2.5 rounded-lg border text-base focus:outline-none focus:ring-2 focus:ring-primary"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--outline-variant)", color: "var(--on-surface)" }}
            placeholder="再次输入密码"
          />
        </div>

        <Button type="submit" variant="primary" className="w-full" size="lg" disabled={loading}>
          {loading ? "注册中..." : "注册"}
        </Button>
      </form>

      <p className="text-center text-sm mt-6 text-on-surface-variant">
        已有账号？{" "}
        <Link href="/login" className="font-medium hover:text-primary transition-colors">
          登录
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: 创建登录页面**

创建 `src/app/(auth)/login/page.tsx`：

```tsx
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return <LoginForm />;
}
```

- [ ] **Step 5: 创建注册页面**

创建 `src/app/(auth)/register/page.tsx`：

```tsx
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return <RegisterForm />;
}
```

- [ ] **Step 6: 浏览器验证**

使用 Chrome DevTools MCP 访问 `/login` 和 `/register` 页面，确认：
- 表单渲染正常
- 输入框聚焦状态正确
- 按钮可点击
- 响应式布局正常（移动端）

- [ ] **Step 7: Commit**

```bash
git add src/app/\(auth\)/ src/components/auth/
git commit -m "feat: add login and register pages with forms"
```

---

### Task 1.4: SessionProvider 集成 + TopNav 用户区改造

**Files:**
- Create: `src/hooks/useAuth.ts`
- Create: `src/components/auth/AuthGuard.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/layout/TopNav.tsx`

- [ ] **Step 1: 创建 useAuth Hook**

创建 `src/hooks/useAuth.ts`：

```tsx
"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user;
  const isLoading = status === "loading";
  const isAuthenticated = !!session;

  const logout = () => signOut({ callbackUrl: "/login" });
  const loginWithGithub = () => signIn("github", { callbackUrl: "/" });

  return { user, isLoading, isAuthenticated, logout, loginWithGithub };
}
```

- [ ] **Step 2: 修改根布局集成 SessionProvider**

修改 `src/app/layout.tsx`，在最外层 `<html>` 内包裹 `SessionProvider`：

```tsx
import { SessionProvider } from "next-auth/react";

// 在 <html> 标签内，<body> 外层包裹：
<SessionProvider>
  <body>{children}</body>
</SessionProvider>
```

具体改动：将 `{children}` 包裹为 `<SessionProvider>{children}</SessionProvider>`。

- [ ] **Step 3: 改造 TopNav 右侧操作区**

修改 `src/components/layout/TopNav.tsx`，将右侧操作区（当前第 70-94 行）替换为：

```tsx
{/* 桌面端操作区 — lg 以上显示 */}
<div className="hidden lg:flex items-center gap-3 flex-shrink-0">
  {/* 新增题目按钮 */}
  <Link
    href="/questions/new"
    className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-container text-on-primary-container text-sm font-semibold rounded hover:brightness-110 transition-all whitespace-nowrap"
    style={{ boxShadow: "0 0 10px color-mix(in srgb, var(--primary) 15%, transparent)" }}
  >
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
    新增题目
  </Link>

  {/* 通知铃铛 */}
  <button className="relative p-2 text-on-surface-variant hover:text-primary hover:bg-surface-high rounded transition-colors flex-shrink-0">
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
    {/* 未读计数红点 — 后续接入通知 API 后动态显示 */}
    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error hidden" />
  </button>

  {/* 主题切换 */}
  <ThemeToggle />

  {/* 用户头像 / 登录按钮 */}
  <UserMenu />
</div>
```

- [ ] **Step 4: 创建 UserMenu 组件**

在同一文件 `TopNav.tsx` 中新增组件（或新建 `src/components/layout/UserMenu.tsx`）：

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="px-4 py-1.5 text-sm font-medium text-primary border border-primary rounded hover:bg-primary-container transition-all"
      >
        登录
      </Link>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full overflow-hidden border-2 border-outline-variant hover:border-primary transition-colors flex-shrink-0"
      >
        {user?.image ? (
          <img src={user.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-sm font-semibold"
            style={{ backgroundColor: "var(--primary-container)", color: "var(--on-primary-container)" }}
          >
            {(user?.name ?? "U")[0].toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 w-56 rounded-lg border shadow-lg z-50 py-1",
            "bg-surface-bright border-outline-variant"
          )}
        >
          <div className="px-4 py-3 border-b border-outline-variant">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
          </div>
          <Link
            href="/profile"
            className="block px-4 py-2.5 text-sm text-on-surface hover:bg-surface-high transition-colors"
            onClick={() => setOpen(false)}
          >
            个人资料
          </Link>
          <Link
            href="/settings"
            className="block px-4 py-2.5 text-sm text-on-surface hover:bg-surface-high transition-colors"
            onClick={() => setOpen(false)}
          >
            设置
          </Link>
          <div className="border-t border-outline-variant mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error-container transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: 同步修改 MobileDrawer 底部操作区**

修改 `MobileDrawer.tsx` 的底部区域，未登录时显示「登录/注册」按钮，已登录时显示用户信息和退出按钮。

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useAuth.ts src/components/layout/UserMenu.tsx src/components/layout/TopNav.tsx src/components/layout/MobileDrawer.tsx src/app/layout.tsx
git commit -m "feat: integrate auth into TopNav with UserMenu dropdown"
```

---

### Task 1.5: 个人资料页 + 设置页

**Files:**
- Create: `src/app/profile/page.tsx`
- Create: `src/app/settings/page.tsx`

- [ ] **Step 1: 创建个人资料页**

创建 `src/app/profile/page.tsx`：

页面包含：
- 头像展示区（大圆形头像 + 昵称 + 邮箱 + 注册时间）
- 统计卡片行（刷题总数、掌握数、连续打卡天数、获得点赞数）
- 最近练习列表（复用 Dashboard 的最近练习卡片样式）
- 我的收藏夹列表（BookmarkFolder 列表）

关键实现要点：
- 使用 `useAuth()` 获取当前用户
- `useEffect` 中 fetch `/api/stats` 和 `/api/stats/streak` 获取统计数据
- 收藏夹支持新建文件夹、重命名、删除
- 响应式适配：移动端单列、桌面端左侧固定信息栏+右侧内容区

- [ ] **Step 2: 创建设置页**

创建 `src/app/settings/page.tsx`：

页面包含：
- 账号信息修改（昵称、头像 URL）
- 密码修改（旧密码 + 新密码 + 确认新密码）
- 主题切换（复用 ThemeToggle 组件）
- 通知偏好设置（邮件通知开关、复习提醒开关）
- 危险操作区：注销账号

- [ ] **Step 3: 创建相关 API**

创建用户信息更新 API（可在现有 auth 相关 route 中扩展或新建 `src/app/api/user/route.ts`）：

```typescript
// GET /api/user — 获取当前用户详情（含统计数据）
// PATCH /api/user — 更新昵称/头像
// PATCH /api/user/password — 修改密码
// DELETE /api/user — 注销账号
```

- [ ] **Step 4: Commit**

```bash
git add src/app/profile/ src/app/settings/ src/app/api/user/
git commit -m "feat: add profile page and settings page"
```

---

### Task 1.6: API 权限中间件 + 路由保护

**Files:**
- Create: `src/middleware.ts`
- Create: `src/lib/session.ts`（服务端获取 session 工具函数）

- [ ] **Step 1: 创建服务端 session 工具函数**

创建 `src/lib/session.ts`：

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getServerSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function optionalAuth() {
  return auth();
}
```

- [ ] **Step 2: 创建中间件**

创建 `src/middleware.ts`：

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // 公开路由白名单
  const publicPaths = ["/login", "/register", "/api/auth", "/api/questions", "/api/categories", "/api/companies", "/api/daily-question"];
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  if (!isPublic && !isAuthenticated && pathname.startsWith("/api")) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  return;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
```

注意：此中间件仅对 API 路由做基本的认证检查，页面级守卫由客户端 AuthGuard 组件处理。

- [ ] **Step 3: 创建 AuthGuard 客户端组件**

创建 `src/components/auth/AuthGuard.tsx`：

```tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
```

- [ ] **Step 4: 对需要保护的页面应用 AuthGuard**

在以下页面外层包裹 `<AuthGuard>`：
- `src/app/experiences/page.tsx`（笔记编辑需要身份）
- `src/app/study-plans/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/settings/page.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/middleware.ts src/lib/session.ts src/components/auth/AuthGuard.tsx
git commit -m "feat: add auth middleware and AuthGuard component"
```

---

## Phase 2: 已有功能修复与增强

> **依赖关系:** 依赖 Phase 1（用户系统）的部分功能（如笔记持久化关联用户ID）。
> **预估工作量:** 3 个 Task。

### Task 2.1: AI 对话流式化改造

**Files:**
- Modify: `src/app/api/ai/route.ts`
- Modify: `src/app/ai/page.tsx`

- [ ] **Step 1: 改造 AI API 为 SSE 流式响应**

修改 `src/app/api/ai/route.ts`，核心变更：

```typescript
// 将 stream: false 改为 stream: true
// 将 response.json() 改为 ReadableStream 流式传输

export async function POST(request: NextRequest) {
  // ... 验证逻辑不变 ...

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: `...（原有 system prompt 不变）...` },
        ...messages,
      ],
      stream: true,  // ← 关键改动：启用流式
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json(
      { error: `DeepSeek API 返回错误: ${response.status}` },
      { status: response.status }
    );
  }

  // 返回 SSE 流
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 2: 改造前端接收 SSE 流**

修改 `src/app/ai/page.tsx` 的 `callAI` 函数：

```typescript
const callAI = async (userContent: string) => {
  setIsTyping(true);
  setApiError(null);

  const updatedHistory: ChatMessage[] = [
    ...historyMessages,
    { id: generateId(), role: "user", content: userContent, timestamp: new Date().toISOString() },
  ];
  setHistoryMessages(updatedHistory);

  // 创建临时 AI 消息用于流式更新
  const aiMsgId = generateId();
  const aiMsg: ChatMessage = {
    id: aiMsgId,
    role: "assistant",
    content: "",
    timestamp: new Date().toISOString(),
  };
  setHistoryMessages((prev) => [...prev, aiMsg]);

  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: updatedHistory.map(({ role, content }) => ({ role, content })),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? `HTTP ${res.status}`);
    }

    // 解析 SSE 流
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (trimmed.startsWith("data: ")) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              setHistoryMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMsgId ? { ...msg, content: fullContent } : msg
                )
              );
            }
          } catch {
            // 忽略解析错误，继续处理下一行
          }
        }
      }
    }

    // 最终确认消息
    setHistoryMessages((prev) =>
      prev.map((msg) =>
        msg.id === aiMsgId ? { ...msg, content: fullContent || "(无回复)" } : msg
      )
    );
  } catch (err) {
    setApiError(err instanceof Error ? err.message : "请求失败");
    // 移除空的 AI 消息
    setHistoryMessages((prev) => prev.filter((msg) => msg.id !== aiMsgId));
  } finally {
    setIsTyping(false);
  }
};
```

- [ ] **Step 3: 浏览器验证**

使用 Chrome DevTools MCP：
1. 打开 `/ai` 页面
2. 输入任意问题发送
3. 验证 AI 回复是否逐字/逐句流式出现（而非等待完成后一次性显示）
4. 检查 Network 面板确认 Content-Type 为 `text/event-stream`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/ai/route.ts src/app/ai/page.tsx
git commit -m "feat: upgrade AI chat to SSE streaming"
```

---

### Task 2.2: 笔记持久化（CRUD API + 自动保存）

**Files:**
- Create: `src/app/api/notes/[id]/route.ts`
- Modify: `src/app/experiences/page.tsx`

- [ ] **Step 1: 创建笔记 CRUD API**

创建 `src/app/api/notes/[id]/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/notes/[id] — 获取单篇笔记
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
    }
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/notes/[id] — 更新笔记
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, company, questionIds } = body;

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(company !== undefined && { company }),
        ...(questionIds !== undefined && { questionIds }),
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("PUT /api/notes/[id] error:", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

// DELETE /api/notes/[id] — 删除笔记
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.note.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
```

- [ ] **Step 2: 修改面经笔记页面，集成自动保存**

修改 `src/app/experiences/page.tsx`，核心改动：

a) 新增自动保存 hook（debounced save）：

```typescript
import { useEffect, useRef, useCallback } from "react";

// 在组件内部
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const lastSavedRef = useRef<string>("");

const debouncedSave = useCallback(async (noteId: string, title: string, content: string) => {
  // 内容未变化则跳过
  const signature = `${title}::${content}`;
  if (signature === lastSavedRef.current) return;

  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  saveTimeoutRef.current = setTimeout(async () => {
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        lastSavedRef.current = signature;
        // 可选：显示「已保存」提示
      }
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }, 1000); // 1秒防抖
}, []);
```

b) 替换原有的纯本地 state 更新为「本地更新 + 触发保存」：

在 `selectedNote.content` 的 `onChange` 中增加：

```typescript
onChange={(e) => {
  const newContent = e.target.value;
  setSelectedNote((prev) => prev ? { ...prev, content: newContent } : prev);
  setNotes((prev) =>
    prev.map((n) => n.id === selectedNote.id ? { ...n, content: newContent } : n)
  );
  // 新增：触发自动保存
  if (selectedNote) debouncedSave(selectedNote.id, selectedNote.title, newContent);
}}
```

c) 同样对 title 的 onChange 做相同处理。

d) 将标题旁的「Unsaved」badge 改为动态状态：「已保存」/「保存中...」/「未保存」。

- [ ] **Step 3: 新增笔记创建功能**

将「新增笔记」按钮从静态变为功能性：
- 点击后创建新笔记（POST /api/notes）
- 新笔记出现在列表顶部并被选中
- 标题默认为「未命名笔记」，光标聚焦到标题输入框

- [ ] **Step 4: 新增笔记删除功能**

将右上角垃圾桶图标从静态变为功能性：
- 点击弹出确认对话框
- 确认后调用 DELETE /api/notes/[id]
- 从列表中移除，选中相邻笔记

- [ ] **Step 5: 浏览器验证**

1. 打开 `/experiences` 页面
2. 选择一篇笔记，修改内容
3. 等待 ~1 秒，刷新页面确认内容已保存
4. 测试新建、删除功能
5. 移动端验证 MobileNoteDetail 的返回导航正常

- [ ] **Step 6: Commit**

```bash
git add src/app/api/notes/\[id\]/route.ts src/app/experiences/page.tsx
git commit -m "feat: add note persistence with auto-save and CRUD"
```

---

### Task 2.3: 代码在线运行（OJ 判题）

**Files:**
- Create: `src/lib/code-runner.ts`
- Create: `src/app/api/run-code/route.ts`
- Create: `src/components/CodeRunner.tsx`
- Modify: `src/app/questions/[id]/page.tsx`
- Modify: `package.json` (新增依赖)

- [ ] **Step 1: 选定代码执行方案并安装依赖**

推荐方案：使用 Piston API（免费开源的代码执行 API），无需自建 Docker。

```bash
# 无需额外 SDK 依赖，仅需 HTTP 调用 Piston API
# Piston API endpoint: https://emkc.org/api/v2/piston/execute
```

如果希望自建执行环境，则需 Docker 方案（此处以 Piston API 为例）。

- [ ] **Step 2: 创建代码执行引擎**

创建 `src/lib/code-runner.ts`：

```typescript
const PISTON_API = "https://emkc.org/api/v2/piston/execute";

// 语言映射：项目语言标识 → Piston language + version
const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  javascript: { language: "javascript", version: "18.15.0" },
  typescript: { language: "typescript", version: "5.0.3" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  cpp: { language: "c++", version: "10.2.0" },
};

export interface RunResult {
  stdout: string;
  stderr: string;
  code: number;
  output: string; // 格式化后的输出
  duration: number; // ms
}

export async function runCode(
  sourceCode: string,
  language: string,
  stdin?: string
): Promise<RunResult> {
  const config = LANGUAGE_MAP[language];
  if (!config) {
    throw new Error(`不支持的语言: ${language}`);
  }

  const startTime = Date.now();

  const response = await fetch(PISTON_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: config.language,
      version: config.version,
      files: [{ content: sourceCode }],
      stdin: stdin || "",
    }),
  });

  if (!response.ok) {
    throw new Error(`代码执行服务错误: ${response.status}`);
  }

  const data = await response.json();
  const duration = Date.now() - startTime;

  return {
    stdout: data.run?.stdout || "",
    stderr: data.run?.stderr || "",
    code: data.run?.code || 1,
    output: data.run?.stdout || data.run?.stderr || "(无输出)",
    duration,
  };
}

// 获取支持的编程语言列表
export function getSupportedLanguages(): string[] {
  return Object.keys(LANGUAGE_MAP);
}
```

- [ ] **Step 3: 创建代码执行 API**

创建 `src/app/api/run-code/route.ts`：

```typescript
import { NextRequest, NextResponse } from "next/server";
import { runCode } from "@/lib/code-runner";

export async function POST(request: NextRequest) {
  try {
    const { code, language, stdin } = await request.json();

    if (!code || !language) {
      return NextResponse.json(
        { error: "缺少必要参数: code, language" },
        { status: 400 }
      );
    }

    // 设置超时：代码执行最多 15 秒
    const result = await Promise.race([
      runCode(code, language, stdin),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("执行超时 (15s)")), 15000)
      ),
    ]);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "执行失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 4: 创建 CodeRunner 组件**

创建 `src/components/CodeRunner.tsx`：

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface CodeRunnerProps {
  code: string;
  language: string;
}

export function CodeRunner({ code, language }: CodeRunnerProps) {
  const [output, setOutput] = useState("");
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setOutput("");
    setDuration(null);

    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, stdin }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "执行失败");

      setOutput(data.output);
      setDuration(data.duration);
      if (data.stderr) {
        setOutput((prev) => prev + "\n--- stderr ---\n" + data.stderr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "执行失败");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="border-t" style={{ borderTopColor: "var(--outline-variant)" }}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: "var(--surface-container)" }}>
        <span className="text-xs font-mono text-on-surface-variant">
          {language.toUpperCase()} 执行器
        </span>
        <div className="flex items-center gap-2">
          {duration !== null && (
            <span className="text-[11px] font-mono text-on-surface-variant">
              {duration}ms
            </span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleRun}
            disabled={running}
          >
            {running ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                运行中...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                运行
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stdin 输入（可折叠） */}
      <details className="border-b" style={{ borderColor: "var(--outline-variant)" }}>
        <summary className="px-4 py-1.5 text-xs cursor-pointer text-on-surface-variant hover:text-on-surface">
          标准输入 (stdin)
        </summary>
        <div className="px-4 pb-2">
          <textarea
            className="w-full bg-surface-lowest border border-outline-variant rounded p-2 text-xs font-mono resize-y"
            rows={2}
            placeholder="程序需要输入时在此填写..."
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
          />
        </div>
      </details>

      {/* 输出区域 */}
      <div className="p-4 min-h-[80px] max-h-[300px] overflow-auto">
        {error ? (
          <div className="text-error text-sm font-mono">{error}</div>
        ) : running ? (
          <div className="text-on-surface-variant text-sm animate-pulse">正在执行...</div>
        ) : output ? (
          <pre className="text-sm font-mono whitespace-pre-wrap text-on-surface">
            {output}
          </pre>
        ) : (
          <div className="text-on-surface-variant text-sm">点击「运行」执行代码</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 集成到题目详情页**

修改 `src/app/questions/[id]/page.tsx`，在 CodeEditor 区域下方（桌面端分屏的编辑器底部、移动端的编辑器底部）嵌入 `<CodeRunner>`：

```tsx
import { CodeRunner } from "@/components/CodeRunner";

{/* 在 CodeEditor 后添加 */}
<CodeRunner code={currentCode} language={currentLanguage} />
```

注意：需要从 CodeEditor 的 state 中提取当前的 code 和 language，可能需要提升 state 或通过 ref 获取。

- [ ] **Step 6: 浏览器验证**

1. 打开一道代码类题目（如 Two Sum）
2. 在编辑器中编写/粘贴代码
3. 点击「运行」按钮
4. 验证输出区域正确显示结果和耗时
5. 测试标准输入功能
6. 测试错误代码的 stderr 输出
7. 移动端验证 CodeRunner 布局不溢出

- [ ] **Step 7: Commit**

```bash
git add src/lib/code-runner.ts src/app/api/run-code/route.ts src/components/CodeRunner.tsx src/app/questions/\[id\]/page.tsx
git commit -m "feat: add online code runner with Piston API integration"
```

---

## Phase 3: 数据可视化 + PWA 离线支持

> **依赖关系:** 依赖 Phase 1（用户数据关联）。
> **预估工作量:** 4 个 Task。

### Task 3.1: 图表库集成 + 能力雷达图

**Files:**
- Modify: `package.json` (新增 recharts)
- Create: `src/components/charts/RadarChart.tsx`
- Create: `src/components/charts/ProgressLineChart.tsx`
- Create: `src/components/charts/CategoryPieChart.tsx`
- Modify: `src/app/page.tsx` (Dashboard)
- Create: `src/app/api/stats/ability/route.ts`（能力评估 API）

- [ ] **Step 1: 安装 recharts**

```bash
pnpm add recharts
```

- [ ] **Step 2: 创建能力评估 API**

创建 `src/app/api/stats/ability/route.ts`：

根据用户的练习记录，按分类统计掌握程度：

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  // 获取各分类的练习统计
  const categoryStats = await prisma.question.groupBy({
    by: ["categoryId"],
    _count: { id: true },
    where: {
      practiceHistory: userId
        ? { some: { /* TODO: 关联 userId */ } }
        : { /* 单用户模式：全部 */ },
    },
  });

  // 获取各难度级别的掌握情况
  const difficultyStats = await prisma.question.groupBy({
    by: ["difficulty"],
    _count: { id: true },
    where: { mastery: "mastered" },
  });

  // 返回雷达图数据：5 个维度
  // 算法、前端、后端、数据库、系统设计（基于分类映射）
  const abilityData = [
    { subject: "算法", score: calcScore(categoryStats, "algorithm"), fullMark: 100 },
    { subject: "前端", score: calcScore(categoryStats, "frontend"), fullMark: 100 },
    { subject: "后端", score: calcScore(categoryStats, "backend"), fullMark: 100 },
    { subject: "数据库", score: calcScore(categoryStats, "database"), fullMark: 100 },
    { subject: "系统设计", score: calcScore(categoryStats, "system-design"), fullMark: 100 },
  ];

  return NextResponse.json(abilityData);
}
```

- [ ] **Step 3: 创建能力雷达图组件**

创建 `src/components/charts/RadarChart.tsx`：

```tsx
"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

interface RadarDataItem {
  subject: string;
  score: number;
  fullMark: number;
}

interface AbilityRadarProps {
  data: RadarDataItem[];
}

export function AbilityRadar({ data }: AbilityRadarProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="var(--outline-variant)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "var(--on-surface-variant)", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={{ fill: "var(--on-surface-variant)", fontSize: 10 }}
        />
        <Radar
          name="能力值"
          dataKey="score"
          stroke="var(--primary)"
          fill="color-mix(in srgb, var(--primary) 20%, transparent)"
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 4: 创建进步曲线图组件**

创建 `src/components/charts/ProgressLineChart.tsx`：

基于最近 30 天的每日练习数量绘制折线图，含 7 日移动平均线。

- [ ] **Step 5: 创建分类饼图组件**

创建 `src/components/charts/CategoryPieChart.tsx`：

基于 `extendedStats.categoryDistribution` 数据绘制环形图。

- [ ] **Step 6: 集成到 Dashboard**

修改 `src/app/page.tsx`，在 Bento Grid Row 1 下方新增一行图表区域：

```
Row 2: [能力雷达图 (col-6)] [进步曲线 (col-6)]
Row 3: [分类分布饼图 (col-4)] [错题热力图 (col-8)] （原内容重新编排）
```

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml src/components/charts/ src/app/api/stats/ability/ src/app/page.tsx
git commit -m "feat: add data visualization charts (radar, line, pie)"
```

---

### Task 3.2: 学习报告页

**Files:**
- Create: `src/app/report/page.tsx`
- Create: `src/app/api/stats/report/route.ts`

- [ ] **Step 1: 创建学习报告 API**

聚合以下数据：
- 总练习时长、平均每题用时
- 正确率趋势（最近 30 天）
- 最薄弱的分类 TOP 3
- 最强分类 TOP 3
- 连续打卡 vs 目标完成率
- 本周/本月 vs 上周/上月对比（环比增长率）
- 学习建议（基于数据生成的文本描述）

- [ ] **Step 2: 创建学习报告页面**

页面结构：
- 顶栏：报告周期选择（本周 / 本月 / 本季度 / 全部）
- 第一行：总览数字卡片（总刷题数、总时长、正确率、连续天数）
- 第二行：能力雷达图 + 进步曲线
- 第三行：分类热度条形图（横向排序）
- 第四行：薄弱点分析 + AI 学习建议
- 底部：分享报告按钮（复用 Phase 4 的分享功能）

- [ ] **Step 3: Commit**

```bash
git add src/app/report/ src/app/api/stats/report/
git commit -m "feat: add learning report page with analytics"
```

---

### Task 3.3: PWA 支持（Service Worker + Manifest）

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Create: `public/icons/icon-192x192.png`
- Create: `public/icons/icon-512x512.png`
- Modify: `src/app/layout.tsx`（添加 manifest meta）
- Modify: `src/app/globals.css`（PWA 样式增强）

- [ ] **Step 1: 创建 PWA Manifest**

创建 `public/manifest.json`：

```json
{
  "name": "面试网 - 程序员面试准备平台",
  "short_name": "面试网",
  "description": "AI 驱动的程序员面试准备平台，提供题库、模拟面试、学习计划等功能",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1e100b",
  "theme_color": "#f54e00",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["education", "productivity"],
  "lang": "zh-CN"
}
```

- [ ] **Step 2: 创建 Service Worker**

创建 `public/sw.js`：

```javascript
const CACHE_NAME = "interview-platform-v1";
const STATIC_ASSETS = [
  "/",
  "/questions",
  "/login",
  "/manifest.json",
];

// 安装：缓存核心资源
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 请求拦截：Cache First 策略（API 请求走 Network）
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 请求不走缓存
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // 静态资源 Cache First
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
```

- [ ] **Step 3: 生成 PWA 图标**

使用项目内置的图片生成方式创建两个尺寸的图标（品牌色背景 + 白色「面」字）。

- [ ] **Step 4: 注册 Service Worker**

修改 `src/app/layout.tsx` 的 `<head>` 中添加：

```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#f54e00" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="面试网" />
```

并在客户端组件中注册 SW：

```tsx
// 创建 src/hooks/useServiceWorker.ts
"use client";

import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("SW registration failed:", err);
      });
    }
  }, []);
}
```

在根布局或 Dashboard 页面中调用 `useServiceWorker()`。

- [ ] **Step 5: 添加离线提示 UI**

在 `globals.css` 中添加：

```css
/* 离线状态指示 */
.offline-indicator {
  position: fixed;
  top: 56px; /* nav height */
  left: 0;
  right: 0;
  background: var(--warning);
  color: var(--on-surface);
  text-align: center;
  padding: 6px;
  font-size: 13px;
  font-weight: 500;
  z-index: 40;
  transform: translateY(-100%);
  transition: transform 0.3s ease;
}

.offline-indicator.visible {
  transform: translateY(0);
}
```

创建一个轻量的 `OfflineIndicator` 组件监听 `navigator.onLine`。

- [ ] **Step 6: Commit**

```bash
git add public/manifest.json public/sw.js public/icons/ src/hooks/useServiceWorker.ts src/components/OfflineIndicator.tsx src/app/layout.tsx src/app/globals.css
git commit -m "feat: add PWA support with service worker and manifest"
```

---

### Task 3.4: 收藏夹分组管理

**Files:**
- Create: `src/app/bookmarks/page.tsx`（收藏夹管理页）
- Create: `src/app/api/bookmarks/route.ts`
- Create: `src/app/api/bookmarks/folders/route.ts`
- Modify: `src/components/layout/TopNav.tsx`（收藏按钮改为多级菜单）

- [ ] **Step 1: 创建收藏夹 CRUD API**

- [ ] **Step 2: 创建收藏夹管理页面**

支持：
- 左侧：收藏夹列表（默认收藏夹 + 自定义文件夹）
- 右侧：选中文件夹内的题目卡片列表
- 拖拽排序（可选，先不做）
- 批量操作（移除、移动到其他文件夹）
- 题目卡片右键/长按菜单：「移除收藏」「移动到...」

- [ ] **Step 3: 改造题目详情页的收藏按钮**

点击收藏时弹出文件夹选择浮层（而非简单的 toggle boolean）。

- [ ] **Step 4: Commit**

```bash
git add src/app/bookmarks/ src/app/api/bookmarks/
git commit -m "feat: add bookmark folder management system"
```

---

## Phase 4: 社交与增长功能

> **依赖关系:** 依赖 Phase 1（用户系统必须就绪）。
> **预估工作量:** 6 个 Task。

### Task 4.1: 社区排行榜

**Files:**
- Create: `src/app/api/leaderboard/route.ts`
- Create: `src/components/LeaderboardWidget.tsx`
- Create: `src/app/leaderboard/page.tsx`
- Modify: `src/app/page.tsx`（Dashboard 嵌入迷你排行）

- [ ] **Step 1: 创建排行榜 API**

创建 `src/app/api/leaderboard/route.ts`：

支持三种榜单类型（query parameter）：
- `type=streak` — 连续打卡榜（取 Streak 表数据，按 currentStreak 排序）
- `type=practice` — 刷题量榜（按 PracticeHistory count 排序）
- `type=mastery` — 掌握榜（按 mastery='mastered' 的题目数排序）

每个接口返回 TOP 20 用户，包含排名、头像、昵称、数值。

```typescript
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") || "practice";

  // 根据不同类型查询不同的聚合数据
  // 使用 prisma.$queryRaw 进行复杂聚合查询
}
```

- [ ] **Step 2: 创建排行榜组件**

创建 `src/components/LeaderboardWidget.tsx`：

- Tab 切换三种榜单
- 金银铜牌图标（TOP 3）
- 当前用户高亮（如果在榜单中）
- 「查看完整榜单」链接

- [ ] **Step 3: 创建排行榜独立页面**

`/leaderboard` 页面包含完整的三个 Tab + 用户搜索功能。

- [ ] **Step 4: Dashboard 集成迷你排行**

在 Dashboard 的 Stats Cards 区域旁边或下方嵌入一个折叠式的 `LeaderBoardWidget`（只显示 TOP 5）。

- [ ] **Step 5: Commit**

```bash
git add src/app/api/leaderboard/ src/components/LeaderboardWidget.tsx src/app/leaderboard/page.tsx src/app/page.tsx
git commit -m "feat: add community leaderboard with streak/practice/mastery rankings"
```

---

### Task 4.2: 分享功能

**Files:**
- Create: `src/app/api/share/route.ts`
- Create: `src/components/ShareDialog.tsx`
- Modify: `src/app/questions/[id]/page.tsx`（添加分享按钮）
- Modify: `src/app/experiences/page.tsx`（笔记分享按钮）

- [ ] **Step 1: 创建分享 API**

创建 `src/app/api/share/route.ts`：

```typescript
// POST /api/share — 创建分享链接
// GET /api/share/:slug — 获取分享内容（含 view count +1）

export async function POST(request: NextRequest) {
  const { type, targetId } = await request.json();
  const slug = generateSlug(8); // 随机短链

  const share = await prisma.shareLink.create({
    data: {
      creatorId: currentUser.id,
      type,
      targetId,
      slug,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天过期
    },
  });

  return NextResponse.json({ url: `${process.env.AUTH_URL}/s/${share.slug}` });
}
```

- [ ] **Step 2: 创建分享弹窗组件**

创建 `src/components/ShareDialog.tsx`：

功能：
- 显示生成的短链接
- 一键复制链接
- 生成分享卡片预览（题目标题 + 难度 + 平台 Logo）
- 微博/ Twitter 分享按钮（打开对应分享窗口）
- 二维码展示（可选，使用 qrcode 库或直接用 API 生成图片）

- [ ] **Step 3: 创建分享落地页**

创建 `src/app/s/[slug]/page.tsx`：

公开访问（无需登录），展示分享的内容（题目/笔记/面试结果的只读渲染）。

- [ ] **Step 4: 在题目详情和笔记页添加分享按钮**

- [ ] **Step 5: Commit**

```bash
git add src/app/api/share/ src/components/ShareDialog.tsx src/app/s/\[slug\]/page.tsx
git commit -m "feat: add share functionality with short links and social sharing"
```

---

### Task 4.3: 复习提醒系统

**Files:**
- Create: `src/app/api/reminders/route.ts`
- Create: `src/components/ReminderBadge.tsx`
- Create: `src/app/api/notifications/route.ts`
- Modify: `src/app/study-plans/[id]/page.tsx`（到期提醒标记）

- [ ] **Step 1: 创建复习提醒 API**

基于艾宾浩斯遗忘曲线计算复习日期：

```
1天后 → 3天后 → 7天后 → 15天后 → 30天后
```

API 功能：
- `GET /api/reminders` — 获取待复习题目列表
- `POST /api/reminders/:questionId/complete` — 标记本次复习完成，计算下一次复习日期
- `POST /api/reminders/generate` — 根据已完成练习批量生成复习计划

- [ ] **Step 2: 创建提醒徽章组件**

在 TopNav 的通知铃铛上显示待复习数量红点。

在 Dashboard 的今日目标卡片中叠加显示「X 道待复习」。

- [ ] **Step 3: 创建通知中心 API**

`GET /api/notifications` — 返回当前用户的通知列表（关注、评论回复、@提及、系统通知、复习提醒）。

`PATCH /api/notifications/:id/read` — 标记已读。

`PATCH /api/notifications/read-all` — 全部已读。

- [ ] **Step 4: 创建通知中心下拉面板**

点击 TopNav 铃铛图标展开通知列表（替代当前的红点占位）。

- [ ] **Step 5: Commit**

```bash
git add src/app/api/reminders/ src/app/api/notifications/ src/components/ReminderBadge.tsx
git commit -m "feat: add spaced repetition reminder system and notification center"
```

---

### Task 4.4: 公司题库专题页

**Files:**
- Create: `src/app/companies/page.tsx`（公司列表页）
- Create: `src/app/companies/[company]/page.tsx`（公司题库详情页）
- Modify: `src/app/questions/page.tsx`（添加公司筛选入口）

- [ ] **Step 1: 创建公司列表页**

展示所有有题目关联的公司：
- 公司 Logo 占位（首字头像）/ 名称
- 关联题目数量
- 按题目数量排序
- 搜索过滤

- [ ] **Step 2: 创建公司题库详情页**

URL: `/companies/byte-dance`

页面内容：
- 公司名称 + 题目总数 + 分类分布
- 题目列表（复用题目卡片组件）
- 难度分布柱状图
- 面经标签（如果有对应的面经笔记）

- [ ] **Step 3: Commit**

```bash
git add src/app/companies/
git commit -m "feat: add company-specific question bank pages"
```

---

### Task 4.5: 举报系统 + 内容审核

**Files:**
- Create: `src/app/api/reports/route.ts`
- Create: `src/app/report/page.tsx`（举报提交页）
- Create: `src/components/ReportButton.tsx`（举报按钮组件）
- Modify: `src/app/questions/[id]/page.tsx`（添加举报按钮）
- Modify: `src/app/questions/[id]/comments/`（评论举报）

- [ ] **Step 1: 创建举报 API**

- [ ] **Step 2: 创建举报按钮和弹窗**

在题目详情页、评论区、笔记页添加「...」菜单，其中包含「举报」选项。

举报理由选项：
- 垃圾广告
- 不当内容
- 版权问题
- 错误/过时
- 其他（附文字说明）

- [ ] **Step 3: 创建管理员审核后台（简易版）**

`/admin/reports` 页面（仅 role=admin 可访问）：
- 待处理举报列表
- 查看目标内容
- 操作：忽略 / 删除内容 / 封禁用户

- [ ] **Step 4: Commit**

```bash
git add src/app/api/reports/ src/app/report/page.tsx src/components/ReportButton.tsx src/app/admin/
git commit -m "feat: add report and content moderation system"
```

---

### Task 4.6: SEO 优化 + 性能监控

**Files:**
- Modify: `src/app/layout.tsx`（全局 Metadata）
- Modify: 各页面 `page.tsx`（页面级别 Metadata + JSON-LD）
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Modify: `package.json` (可选：添加 Sentry)

- [ ] **Step 1: 添加全局 Metadata**

修改 `src/app/layout.tsx`，导出 metadata/generateMetadata：

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "面试网 - AI 驱动的程序员面试准备平台",
    template: "%s | 面试网",
  },
  description: "智能题库、AI 模拟面试、学习计划、社区交流，一站式面试准备。",
  keywords: ["面试", "算法题", "LeetCode", "模拟面试", "前端面试", "Java面试"],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "面试网",
  },
};
```

- [ ] **Step 2: 为每个页面添加 generateMetadata**

重点页面：题目详情、公司专题、面经笔记。

- [ ] **Step 3: 创建 Sitemap + Robots**

- [ ] **Step 4: 可选：集成 Sentry 错误监控**

```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/sitemap.ts src/app/robots.ts
git commit -m "feat: add SEO optimization with metadata, sitemap, and robots"
```

---

### Task 4.7: 无障碍访问 (A11y) 基础优化

**Files:**
- Modify: `src/app/globals.css`（focus-visible 样式、skip-nav）
- Modify: `src/components/layout/TopNav.tsx`（skip-navigation 链接）
- Modify: 所有交互组件（aria-label、keyboard navigation）

- [ ] **Step 1: 添加 skip-navigation 链接**

- [ ] **Step 2: 添加 focus-visible 焦点环样式**

- [ ] **Step 3: 为所有交互元素补充 aria 属性**

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/components/
git commit -m "a11y: add basic accessibility improvements"
```

---

## 实施总览

| Phase | 名称 | Task 数 | 核心交付物 | 前置依赖 |
|-------|------|---------|-----------|---------|
| **1** | 用户认证系统 | 6 | 登录/注册/用户资料/权限守卫 | 无 |
| **2** | 功能修复增强 | 3 | AI 流式化、笔记持久化、OJ 判题 | Task 1.1-1.3 |
| **3** | 数据可视化 + PWA | 4 | 图表、学习报告、PWA、收藏夹 | Task 1.1 |
| **4** | 社交与增长 | 7 | 排行榜、分享、提醒、公司题库、举报、SEO、A11y | Phase 1 完成 |
| **总计** | | **20** | | |

### 并行策略

```
Week 1:
├─ Phase 1 (Task 1.1→1.2→1.3→1.4→1.5→1.6) 串行执行（每步依赖上一步）
│
Week 2:
├─ Phase 2 三路并行:
│   ├─ Task 2.1 (AI 流式化)
│   ├─ Task 2.2 (笔记持久化)
│   └─ Task 2.3 (OJ 判题)
│
Week 3:
├─ Phase 3 两路并行:
│   ├─ Task 3.1+3.2 (图表 + 报告)
│   └─ Task 3.3+3.4 (PWA + 收藏夹)
│
Week 4:
├─ Phase 4 多路并行:
│   ├─ Task 4.1 (排行榜)
│   ├─ Task 4.2 (分享)
│   ├─ Task 4.3 (提醒)
│   ├─ Task 4.4 (公司题库)
│   ├─ Task 4.5 (举报)
│   ├─ Task 4.6+4.7 (SEO + A11y)
```

### 新增依赖汇总

| 包名 | 用途 | 版本建议 |
|------|------|---------|
| `next-auth@beta` | 用户认证 | latest beta |
| `@auth/prisma-adapter` | NextAuth Prisma 适配器 | 匹配 next-auth |
| `bcryptjs` | 密码哈希 | ^2.4.3 |
| `@types/bcryptjs` | TypeScript 类型 | ^2.4.x |
| `recharts` | 数据可视化图表 | ^2.x |
| `@sentry/nextjs` | 性能错误监控（可选） | latest |

### 数据库迁移影响

新增 8 个数据表：
- `users` — 用户主表
- `follows` — 关注关系
- `bookmark_folders` — 收藏夹
- `bookmark_items` — 收藏项
- `reports` — 举报记录
- `share_links` — 分享短链
- `notifications` — 通知消息

修改 6 个现有表（添加 `userId` 外键字段）：
- `practice_history`
- `comments`
- `notes`
- `mock_interviews`
- `study_plans`
- `questions`（移除 `isBookmarked`，改用关联）
