# 代码库指南 (CODE_WIKI)

> 面试网 (interview-platform) 的代码库导航索引。本文件经校正，反映**当前真实代码**（多用户全栈平台，Next.js 16）。
> 架构与开发约定见 `AGENTS.md`；设计系统见 `docs/design/DESIGN.md`；快速上手见 `README.md`。

---

## 0. 关键事实速查（纠正旧版）

| 旧文档（错误） | 真实情况 |
| --- | --- |
| 单一用户、无认证 | 多用户 + NextAuth v4（Credentials 邮箱密码，JWT） |
| 13 个数据模型 | **42 个**数据模型（见 §5） |
| Next.js 15 | **Next.js 16.2.7**（App Router + Turbopack） |
| 火山方舟 / 双轨 AI | **DeepSeek**（`deepseek-chat`，SSE 流式） |
| 本地 Docker 代码沙箱 | **Piston 在线 API**（`src/lib/code-runner.ts`） |
| 数据用 Mock / 内存 | PostgreSQL + Prisma 7（生成于 `src/generated/prisma/`） |
| 暗色模式由 `next-themes` 管理 | **自写 `data-theme` + localStorage 防闪烁脚本**（`layout.tsx`） |
| GitHub OAuth 登录 | **无**（仅 CredentialsProvider；`GITHUB_*` 环境变量未被读取） |

> ⚠️ 旧版 CODE_WIKI 基于早期单用户原型，大量章节已不适用。本文件为重写版。

---

## 1. 项目结构

```
interview-platform/
├── src/
│   ├── app/                      # 页面 + API 路由（App Router）
│   │   ├── (auth)/               # 登录/注册布局分组
│   │   ├── api/                  # 后端 REST API（37 模块 / 97 个 route.ts，见 §4）
│   │   ├── ai/                   # AI 模拟面试（文本/语音/视频）
│   │   ├── questions/            # 题库
│   │   ├── contests/             # 竞赛
│   │   ├── learning-paths/       # 学习路径
│   │   ├── study-plans/          # 学习计划
│   │   ├── test-papers/          # 试卷
│   │   ├── companies/            # 公司题库
│   │   ├── experiences/          # 笔记/经验
│   │   ├── users/[id]/           # 公开用户主页
│   │   ├── profile/              # 个人主页（仅本人）
│   │   ├── admin/                # 后台管理
│   │   ├── layout.tsx            # 根布局（暗色防闪烁脚本）
│   │   └── page.tsx              # 首页
│   ├── components/               # UI 组件
│   ├── lib/                      # 后端逻辑（见 §3）
│   ├── data/                     # 题库数据（TS，`prisma/seed.ts` 的数据源）
│   └── generated/prisma/         # Prisma 生成代码（勿手改）
├── prisma/
│   ├── schema.prisma             # 数据模型（42 个）
│   ├── migrations/               # 迁移
│   └── seed.ts                   # 种子脚本（pnpm prisma db seed）
└── public/                       # 静态资源
```

> 注：早期文档提到的 `docker/`、`supabase/`、`prisma/data/`、`scripts/` 目录均已不存在。

---

## 2. 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Next.js 16 (App Router) + React 19 + TypeScript strict |
| 样式 | Tailwind CSS v4 + CSS 变量（暗色模式自写 data-theme 脚本） |
| ORM | Prisma 7（`@prisma/adapter-pg`；seed/迁移配置在 `prisma.config.ts`） |
| 数据库 | PostgreSQL（`DATABASE_URL`） |
| 认证 | NextAuth v4（CredentialsProvider，JWT） |
| AI | DeepSeek `deepseek-chat`（SSE 流式，`src/lib/deepseek.ts`） |
| 代码执行 | Piston 在线 API（`src/lib/code-runner.ts`，15s 超时） |
| 图表 | Recharts、react-markdown、Mermaid、highlight.js |
| 编辑器 | CodeMirror 6 |
| 存储 | 阿里云 OSS（可选，STS） |
| 数据获取 | SWR（客户端）+ 服务端直调；封装见 `src/lib/request.ts` |
| 测试 | Vitest + Testing Library（src/lib 覆盖率阈值 40%） |
| 校验 | zod（`src/lib/schemas.ts` + `src/lib/validate.ts`） |

---

## 3. 核心库 (`src/lib/`)

| 文件 | 职责 |
| --- | --- |
| `prisma.ts` | Prisma 客户端单例（开发环境缓存到 `globalThis`） |
| `auth.ts` | NextAuth 配置（authOptions：仅 CredentialsProvider） |
| `session.ts` | `getServerSession()`（页面重定向）/ `requireAuth()` / `getCurrentUser()` / `optionalAuth()` |
| `admin-auth.ts` / `permission.ts` | RBAC 权限点校验（`requirePermission`，30s 内存缓存） |
| `jwt.ts` | 后台 Bearer JWT 签发/校验（jose，7 天） |
| `deepseek.ts` | `callDeepSeek` / `callDeepSeekStream` + `sseFormat` |
| `code-runner.ts` | 调用 Piston API 执行多语言代码 |
| `judge.ts` | 判题（TestCase 逐用例，竞赛含隐藏用例） |
| `review-scheduler.ts` | **艾宾浩斯固定间隔**（1/2/4/7/15/30 天）复习调度 |
| `rate-limit.ts` | 进程内滑动窗口限流（单实例适用，多实例需 Redis） |
| `validate.ts` / `schemas.ts` | zod 请求体校验（`parseBody` 统一 400 + `{error}`） |
| `api-response.ts` | `ok`/`fail`/`handleApiError` 统一响应 |
| `notify.ts` | `createNotification`（自己不通知自己，失败不阻塞） |
| `oss.ts` | 阿里云 OSS STS 临时凭证 |
| `design-tokens.ts` | 颜色 token 集中定义（`var(--primary)` 等） |

---

## 4. API 模块清单 (`src/app/api/`，37 模块)

| 模块 | 路径前缀 | 说明 |
| --- | --- | --- |
| 题目 | `/api/questions` `/api/categories` `/api/practice` | 题库 CRUD、个人状态（`[id]/state`）、练习记录 |
| 评论 | `/api/questions/[id]/comments` | 评论（需登录）、一层回复、点赞、删除 |
| 题解 | `/api/solutions` `/api/questions/[id]/solutions` | 题解、编辑、点赞、按用户查询 |
| AI | `/api/ai` `/api/ai/evaluate` `/api/ai/review-code` | 对话（SSE）、评分、代码点评（均限流） |
| 模拟面试 | `/api/mock-interview` `/api/mock-interviews` | SSE 流式多轮面试（含语音/视频模式） |
| 视频/语音 | `/api/video-interview` `/api/voice` | RTC Token/StartVoiceChat、豆包 ASR/TTS 代理（鉴权+限流） |
| 竞赛 | `/api/contests` | 竞赛列表、详情、提交（Piston 判题） |
| 学习路径 | `/api/learning-paths` | 预设路线、join 一键加入计划 |
| 学习计划 | `/api/study-plans` | 私有计划 CRUD、进度（plan+user+question 三元组） |
| 试卷 | `/api/test-papers` | 组卷、答题（默认仅公开卷+本人卷） |
| 收藏 | `/api/bookmarks` | 收藏夹与条目（按 userId 归属校验） |
| 公司 | `/api/companies` | 公司题库聚合 |
| 社区 | `/api/notifications` `/api/reports` `/api/share` `/api/notes` `/api/follow` | 通知、举报、分享、笔记、关注 |
| 复习 | `/api/review` `/api/daily-question` `/api/reminders` | 艾宾浩斯复习、每日一题、提醒 |
| 统计 | `/api/stats`（含 extended/report/streak） `/api/leaderboard` | 看板、排行榜（全 per-user） |
| 用户 | `/api/user` `/api/users/[id]/profile` `/api/auth` | 资料、公开主页、注册/验证码 |
| 其它 | `/api/search` `/api/search-history` `/api/question-edits` `/api/question-sets` `/api/upload` `/api/run-code` `/api/admin` `/api/health` | 搜索、编辑建议、题集、上传、代码执行、后台、健康检查 |

> 每个 `route.ts` 默认导出 `GET/POST/PATCH/DELETE`。写接口统一 `requireAuth()`；请求体校验用 `parseBody(request, schema)`。

---

## 5. 数据模型 (`prisma/schema.prisma`，42 个)

**用户与认证**：`User` `Account` `Session` `VerificationToken`
**社交**：`Follow` `Notification` `Report` `ShareLink` `BookmarkFolder` `BookmarkItem`
**内容**：`Question` `Category` `QuestionTag` `TestCase` `Note` `Comment`（含 parentId 回复）`Solution` `PracticeHistory`
**个人状态（多用户隔离）**：`UserQuestionState`（掌握/收藏，userId+questionId 唯一）`UserStreak`（打卡快照，userId+date 唯一）
**面试**：`MockInterview` `MockInterviewTurn`
**学习**：`StudyPlan` `StudyPlanDay` `StudyPlanItem` `StudyPlanProgress`（三元组唯一）`LearningPath` `LearningPathItem` `QuestionEncounter`
**竞赛**：`Contest` `ContestProblem` `ContestSubmission`
**试卷**：`TestPaper` `TestPaperItem` `TestPaperSubmission`
**题集**：`QuestionSet` `QuestionSetItem`
**RBAC**：`Role` `Permission` `RolePermission`
**其他**：`SearchHistory` `QuestionEdit`

关键约定：
- **每用户状态一律走 per-user 表**（`UserQuestionState`/`UserStreak`），题目表上的全局 `mastery`/`isBookmarked` 字段已删除
- `StudyPlanProgress` 唯一键为 `(studyPlanId, userId, questionId)`，进度互不覆盖
- `User` 一对多：`comments` `studyPlans` `notes` `mockInterviews` `solutions` `bookmarkFolders` `notifications` `contestSubmissions` `questionEncounters` `testPapers` `testPaperSubmissions` `questionEdits` `questionStates` `userStreaks`

---

## 6. 前端页面路由 (`src/app/`)

| 路由 | 页面 | 关键交互 |
| --- | --- | --- |
| `/` | 首页（Dashboard） | 打卡、热力图、每日一题、待复习 |
| `/questions` | 题库列表 | 分类/难度/标签/mastery 筛选 |
| `/questions/[id]` | 题目详情 | 编辑器、判题、题解、讨论（回复）、收藏 |
| `/users/[id]` | 公开用户主页 | 统计、关注、TA 的题解 |
| `/leaderboard` `/report` | 排行榜 / 学习报告 | TopNav 与个人页侧栏可达 |
| `/ai/mock-interview` | 模拟面试 | SSE 流式多轮（文本/语音/视频） |
| `/contests` `/contests/[id]` | 竞赛 | 提交评测 |
| `/learning-paths` `/study-plans` | 学习路径/计划 | 路线、私有计划、进度 |
| `/test-papers` | 试卷 | 组卷、答题 |
| `/companies` `/experiences` | 公司/笔记 | 浏览、发布 |
| `/profile` `/settings` `/notifications` | 个人页/设置/通知 | 已读、删除 |
| `/admin` | 后台 | 内容审核、举报处理 |
| `/(auth)/login` `/(auth)/register` | 登录/注册 | NextAuth 凭证 + 邮箱验证码 |

---

## 7. 命名与约定

- **路径别名**：`@/*` → `./src/*`
- **字段映射**：`MockInterviewTurn` 的 Prisma 字段 `aiQuestion/userAnswer/aiFeedback` ⇄ 前端 `question/answer/feedback`
- **颜色**：统一用 `var(--xxx)` + `color-mix()`；token 在 `src/lib/design-tokens.ts`
- **API 响应**：JSON `{error}` 错误结构；流式用自定义 SSE 解析（`parseSSEStream`）；请求体校验 `parseBody`
- **鉴权**：写接口一律 `requireAuth()`；按用户过滤的数据一律显式 `where: { userId }`
- **提交**：约定式提交（feat/fix/docs/...）；pre-commit 钩子自动 `eslint --fix`

---

## 8. 开发流程

```bash
pnpm install
pnpm prisma generate && pnpm db:migrate   # 数据库
pnpm prisma db seed                       # （可选）填充题库/示例题集/学习路径
pnpm dev                                  # :3000
pnpm db:studio                            # 查看数据
pnpm lint / pnpm typecheck / pnpm test:run / pnpm test:coverage
```

CI（`.github/workflows/ci.yml`）：install --frozen-lockfile → lint → typecheck → test。
详细环境变量与脚本见 `README.md` 与 `AGENTS.md`。
