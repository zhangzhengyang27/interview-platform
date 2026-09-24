# 代码库指南 (CODE_WIKI)

> 面试网 (interview-platform) 的代码库导航索引。本文件经校正，反映**当前真实代码**（多用户全栈平台，Next.js 16）。
> 架构与开发约定见 `AGENTS.md`；设计系统见 `DESIGN.md`；快速上手见 `README.md`。

---

## 0. 关键事实速查（纠正旧版）

| 旧文档（错误） | 真实情况 |
| --- | --- |
| 单一用户、无认证 | 多用户 + NextAuth v4（Credentials/GitHub，JWT） |
| 13 个数据模型 | **35 个**数据模型（见 §5） |
| Next.js 15 | **Next.js 16.2.7**（App Router + Turbopack） |
| 火山方舟 / 双轨 AI | **DeepSeek**（`deepseek-chat`，SSE 流式） |
| 本地 Docker 代码沙箱 | **Piston 在线 API**（`src/lib/code-runner.ts`） |
| 数据用 Mock / 内存 | PostgreSQL + Prisma 7（生成于 `src/generated/prisma/`） |
| 暗色模式用 `data-theme` 属性 | `next-themes` 管理 + `layout.tsx` 防闪烁脚本 |

> ⚠️ 旧版 CODE_WIKI 基于早期单用户原型，大量章节已不适用。本文件为重写版。

---

## 1. 项目结构

```
interview-platform/
├── src/
│   ├── app/                      # 页面 + API 路由（App Router）
│   │   ├── (auth)/               # 登录/注册布局分组
│   │   ├── api/                  # 后端 REST API（30+ 模块，见 §4）
│   │   ├── ai/                   # AI 模拟面试
│   │   ├── questions/            # 题库
│   │   ├── contests/             # 竞赛
│   │   ├── dashboard/            # 数据看板（首页内容）
│   │   ├── learning-paths/       # 学习路径
│   │   ├── study-plans/          # 学习计划
│   │   ├── test-papers/          # 试卷
│   │   ├── companies/            # 公司面经
│   │   ├── experiences/          # 经验分享
│   │   ├── profile/              # 个人主页
│   │   ├── admin/                # 后台管理
│   │   ├── layout.tsx            # 根布局（暗色防闪烁脚本）
│   │   └── page.tsx              # 首页
│   ├── components/               # UI 组件
│   │   ├── ui/                   # 基础组件（Button/Card/Input/Badge...）
│   │   ├── layout/               # TopNav 等布局组件
│   │   ├── charts/               # 图表组件（Recharts 封装）
│   │   └── auth/                 # 认证相关组件
│   ├── lib/                      # 后端逻辑（见 §3）
│   ├── data/                     # 题库种子数据（TS）
│   └── generated/prisma/         # Prisma 生成代码（勿手改）
├── prisma/
│   ├── schema.prisma             # 数据模型（35 个）
│   ├── migrations/               # 迁移
│   └── data/                     # 种子脚本
├── public/                       # 静态资源
├── scripts/                      # 工具脚本
├── docker/                       # ⚠️ 遗留目录，未被代码引用（实际走 Piston）
└── supabase/                     # ⚠️ 早期方案遗留（seed.sql），未启用
```

---

## 2. 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Next.js 16 (App Router) + React 19 + TypeScript strict |
| 样式 | Tailwind CSS v4 + CSS 变量 + next-themes |
| ORM | Prisma 7（`@prisma/adapter-pg`） |
| 数据库 | PostgreSQL（`DATABASE_URL`） |
| 认证 | NextAuth v4（Credentials + GitHub OAuth，JWT） |
| AI | DeepSeek `deepseek-chat`（SSE 流式，`src/lib/deepseek.ts`） |
| 代码执行 | Piston 在线 API（`src/lib/code-runner.ts`，15s 超时） |
| 图表 | Recharts、react-markdown、Mermaid、highlight.js |
| 编辑器 | CodeMirror 6 |
| 存储 | 阿里云 OSS（可选，STS） |
| 数据获取 | SWR（客户端）+ 服务端直调 |
| 测试 | Vitest + Testing Library + Playwright |

---

## 3. 核心库 (`src/lib/`)

| 文件 | 职责 |
| --- | --- |
| `prisma.ts` | Prisma 客户端单例（开发环境缓存到 `globalThis`） |
| `auth.ts` | NextAuth 配置（authOptions：Credentials + GitHub） |
| `session.ts` | `getSession()` / `requireAuth()` —— API 鉴权工具 |
| `deepseek.ts` | DeepSeek 客户端 + `streamChat()` SSE 流式 |
| `code-runner.ts` | 调用 Piston API 执行多语言代码 |
| `review-scheduler.ts` | SM-2 间隔重复算法（复习调度） |
| `oss.ts` | 阿里云 OSS STS 临时凭证 |
| `design-tokens.ts` | 颜色 token 集中定义（`var(--primary)` 等） |

---

## 4. API 模块清单 (`src/app/api/`)

| 模块 | 路径前缀 | 说明 |
| --- | --- | --- |
| 题目 | `/api/questions` `/api/categories` `/api/practice` | 题库 CRUD、筛选、练习记录 |
| 评论 | `/api/comments` | 题目评论、点赞 |
| 题解 | `/api/solutions` | 用户题解、编辑、点赞 |
| AI 出题/评分 | `/api/ai` `/api/ai/generate` `/api/ai/evaluate` | 对话、批量出题、评分 |
| 模拟面试 | `/api/mock-interview` `/api/mock-interviews` | SSE 流式多轮面试 |
| 竞赛 | `/api/contests` | 已结束竞赛列表、详情、提交（评测走 Piston） |
| 学习路径 | `/api/learning-paths` | 预设/自定义学习路线 |
| 学习计划 | `/api/study-plans` | CRUD、进度（upsert 幂等） |
| 试卷 | `/api/test-papers` | 组卷、答题 |
| 收藏 | `/api/bookmarks` | 收藏夹与条目 |
| 公司/面经 | `/api/companies` `/api/experiences` | 公司、经验分享 |
| 社区 | `/api/notifications` `/api/reports` `/api/share` `/api/notes` | 通知、举报、分享、笔记 |
| 复习 | `/api/review` `/api/daily-question` `/api/reminders` | SM-2、每日一题、提醒 |
| 统计 | `/api/stats` `/api/leaderboard` | 看板、排行榜 |
| 用户 | `/api/user` `/api/users` `/api/auth` | 资料、认证回调 |
| 其它 | `/api/search` `/api/search-history` `/api/question-edits` `/api/upload` `/api/run-code` `/api/admin` | 搜索、题目编辑建议、上传、代码执行、后台 |

> 每个 `route.ts` 默认导出 `GET/POST/PATCH/DELETE`。鉴权端点通常首行调用 `await requireAuth()`。

---

## 5. 数据模型 (`prisma/schema.prisma`，35 个)

**用户与认证**：`User` `Account` `Session` `VerificationToken`
**社交**：`Follow` `Notification` `Report` `ShareLink` `BookmarkFolder` `BookmarkItem`
**内容**：`Question` `Category` `QuestionTag` `TestCase` `Note` `Comment` `Solution` `PracticeHistory` `Streak`
**面试**：`MockInterview` `MockInterviewTurn`
**学习**：`StudyPlan` `StudyPlanDay` `StudyPlanItem` `StudyPlanProgress` `LearningPath` `LearningPathItem` `QuestionEncounter`
**竞赛**：`Contest` `ContestProblem` `ContestSubmission`
**试卷**：`TestPaper` `TestPaperItem`
**其他**：`SearchHistory` `QuestionEdit`

关键关系：
- `User` 一对多：`comments` `studyPlans` `notes` `mockInterviews` `solutions` `bookmarkFolders` `notifications` `contestSubmissions` `questionEncounters` `testPapers` `questionEdits`
- `Question` 多对一：`category` `tags`；一对多：`testCases` `solutions` `comments` `bookmarkItems` `contestProblems` `learningPathItems`
- `Follow` 自关联（`follower`/`following`）
- NextAuth 模型 `Account`/`Session`/`VerificationToken` 通过 `userId` 关联 `User`

---

## 6. 前端页面路由 (`src/app/`)

| 路由 | 页面 | 关键交互 |
| --- | --- | --- |
| `/` | 首页（Dashboard） | 连续打卡、能力雷达、热力图、薄弱点 |
| `/questions` | 题库列表 | 分类/难度/标签筛选 |
| `/questions/[id]` | 题目详情 | AI 对话、代码编辑器、打卡 |
| `/ai/mock-interview` | 模拟面试 | SSE 流式多轮 |
| `/contests` `/contests/[id]` | 竞赛 | 提交评测 |
| `/learning-paths` | 学习路径 | 路线列表/详情 |
| `/study-plans` | 学习计划 | 计划 CRUD、进度 |
| `/test-papers` | 试卷 | 组卷、答题 |
| `/companies` `/experiences` | 公司/面经 | 浏览、发布 |
| `/profile/[id]` | 个人主页 | 用户统计、收藏、关注 |
| `/admin` | 后台 | 内容审核、举报处理 |
| `/(auth)/login` `/(auth)/register` | 登录/注册 | NextAuth 凭证 |

---

## 7. 命名与约定

- **路径别名**：`@/*` → `./src/*`
- **字段映射**：`MockInterviewTurn` 的 Prisma 字段 `aiQuestion/userAnswer/aiFeedback` ⇄ 前端 `question/answer/feedback`
- **颜色**：统一用 `var(--xxx)` + `color-mix()`；token 在 `src/lib/design-tokens.ts`
- **API 响应**：JSON；流式用自定义 SSE 解析（`parseSSEStream`）
- **提交**：约定式提交（feat/fix/docs/...）

---

## 8. 开发流程

```bash
pnpm install
pnpm prisma generate && pnpm db:migrate   # 数据库
pnpm dev                                  # :3000
pnpm db:studio                            # 查看数据
pnpm lint / pnpm test:run
```

详细环境变量与脚本见 `README.md` 与 `AGENTS.md`。
