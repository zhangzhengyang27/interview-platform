<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 面试网 (interview-platform) — AI 协作规范

> 本文件是项目的权威事实来源，供 AI 助手（CodeBuddy / Cursor / Claude）快速理解架构与约定。
> 详细代码导航见 `CODE_WIKI.md`，设计系统见 `docs/design/DESIGN.md`，快速上手见 `README.md`。

---

## 1. 项目本质（纠正过时认知）

这是一个 **Next.js 16 全栈单体应用**，已是从「单一用户 Mock 版」演进为 **多用户平台**：

- ✅ **有完整用户认证**：NextAuth v4（Credentials 邮箱密码 + 邮箱验证码注册，JWT 会话）。`src/lib/auth.ts`。无 GitHub OAuth。
- ✅ **有真实数据库**：PostgreSQL + Prisma 7，43 个数据模型，非 Mock。
- ✅ **有社区/社交功能**：关注、通知、举报、分享、收藏夹、题解、评论。
- ✅ **有竞赛/学习路径/试卷/间隔复习** 等完整业务模块。
- ⚠️ **代码执行走 Piston 在线 API**（`src/lib/code-runner.ts`），非本地 Docker 沙箱；根目录 `docker/` 是遗留目录、未被引用。
- ⚠️ **AI 服务是 DeepSeek**（`src/lib/deepseek.ts`，`deepseek-chat` 模型，SSE 流式），非火山方舟。

> 不要被早期文档（写「单用户、无认证、13 个模型」）误导。以本文件与 `CODE_WIKI.md` 为准，最终以 `src/` 实际代码为准。

### AI 助手快速提醒（避免被旧文档误导）

1. **这是多用户全栈平台，不是单用户 Mock 版**。有 NextAuth 认证、PostgreSQL + Prisma（43 个模型）、社区社交、竞赛、学习路径、试卷、间隔复习。
2. **代码与现实以 `src/` 为准**。`AGENTS.md` / `CODE_WIKI.md` 是经校正的文档；任何早期说「单用户、无认证、13 个模型」的描述均已过时。
3. **技术栈实际为 Next.js 16 + React 19 + Prisma 7 + DeepSeek(AI) + Piston(代码执行)**。注意 Next.js 16 已 breaking change，写代码前先读 `node_modules/next/dist/docs/`。

---

## 2. 技术栈（真实）

| 层 | 选型 | 备注 |
| --- | --- | --- |
| 框架 | Next.js 16（App Router, Turbopack） | `package.json` 中 `next: 16.2.7` |
| 前端 | React 19 + TypeScript（strict） | `useParams()` 返回 Promise，需异步解构 |
| 样式 | Tailwind CSS v4 + CSS 变量 | `@theme inline` 注册 token；暗色模式为自写 `data-theme` + localStorage 脚本（非 next-themes） |
| ORM | Prisma 7（`@prisma/adapter-pg` 连接池） | 生成代码在 `src/generated/prisma/` |
| 数据库 | PostgreSQL | `DATABASE_URL` |
| 认证 | NextAuth v4 | JWT 会话；仅 CredentialsProvider（无 GitHub OAuth） |
| AI | DeepSeek（`deepseek-chat`，SSE 流式） | `DEEPSEEK_API_KEY` |
| 代码执行 | Piston 在线 API | 多语言沙箱，15s 超时（`/api/run-code`） |
| 图表/渲染 | Recharts、react-markdown、Mermaid、highlight.js | |
| 编辑器 | CodeMirror 6（JS/TS/Python/Java/C++/SQL） | |
| 存储 | 阿里云 OSS（可选，STS 临时凭证） | 图片上传 |
| 数据获取 | SWR（客户端）+ 服务端直调 | |
| 测试 | Vitest + Testing Library（src/lib 覆盖率阈值 40%） | |

---

## 3. 架构与目录约定

- **后端 = `src/app/api/*`**（37 模块 / 97 个 route.ts，REST Route Handlers）+ `src/lib/*`（DAL、AI、prisma、oss、auth）。
- **前端 = `src/app/<page>/page.tsx`**（页面路由）+ `src/components/*`。
- **路径别名**：`@/*` → `./src/*`（`tsconfig.json`）。
- **Prisma 客户端单例**：`src/lib/prisma.ts`（开发环境缓存到 `globalThis`）。
- **会话鉴权**：`src/lib/session.ts` 的 `requireAuth()` / `getSession()` 用于 API 保护。
- **API 响应**：统一返回 JSON；模拟面试用 SSE 流式（自定义 `parseSSEStream`，非 `EventSource`）。

目录结构见 `README.md` 与 `CODE_WIKI.md` 第 3 节。

---

## 4. 数据模型（43 个，节选关键）

用户与认证：`User` `Account` `Session` `VerificationToken`
社交：`Follow` `Notification` `Report` `ShareLink` `BookmarkFolder` `BookmarkItem`
内容：`Question` `Category` `QuestionTag` `TestCase` `Note` `Comment` `Solution` `PracticeHistory`
个人状态：`UserQuestionState`（掌握/收藏）`UserStreak`（打卡）
面试：`MockInterview` `MockInterviewTurn`
学习：`StudyPlan` `StudyPlanDay` `StudyPlanItem` `StudyPlanProgress` `LearningPath` `LearningPathItem` `QuestionEncounter`
竞赛：`Contest` `ContestProblem` `ContestSubmission`
试卷：`TestPaper` `TestPaperItem`
其他：`SearchHistory` `QuestionEdit`

完整字段见 `prisma/schema.prisma` 与 `CODE_WIKI.md` 第 5 节。

---

## 5. API 模块（真实清单，`src/app/api/`）

| 模块 | 路径前缀 | 说明 |
| --- | --- | --- |
| 题目 | `/api/questions` `/api/categories` `/api/companies` `/api/practice` | 题库 CRUD、筛选、评论、练习记录 |
| 题解 | `/api/solutions` | 用户题解、点赞 |
| AI | `/api/ai` `/api/ai/generate` `/api/ai/evaluate` | 对话、批量出题、评分 |
| 模拟面试 | `/api/mock-interview` `/api/mock-interviews` | SSE 流式多轮面试 |
| 竞赛 | `/api/contests` | 竞赛列表/详情/提交评测 |
| 学习路径 | `/api/learning-paths` | 预设/自定义学习路线 |
| 学习计划 | `/api/study-plans` | 计划 CRUD、进度（upsert 幂等） |
| 试卷 | `/api/test-papers` | 组卷、答题 |
| 收藏 | `/api/bookmarks` | 收藏夹与条目 |
| 公司/面经 | `/api/companies` `/api/experiences` | 公司面经 |
| 社区 | `/api/comments` `/api/notifications` `/api/reports` `/api/share` `/api/notes` | 评论、通知、举报、分享 |
| 复习 | `/api/review` `/api/daily-question` `/api/reminders` | 艾宾浩斯间隔复习、每日一题、提醒 |
| 统计 | `/api/stats` `/api/leaderboard` | 看板数据、排行榜 |
| 用户 | `/api/user` `/api/users` `/api/auth` | 个人资料、认证回调 |
| 其它 | `/api/search` `/api/search-history` `/api/question-edits` `/api/upload` `/api/run-code` `/api/admin` | 搜索、题目编辑建议、上传、代码执行、后台 |

详细端点见 `CODE_WIKI.md` 附录。

---

## 6. 开发约定（必须遵守）

1. **始终先读真实代码**，不要依赖过时文档的字段/路径。
2. **新增 API**：在 `src/app/api/<module>/route.ts` 写 `GET/POST`；需要鉴权时调用 `requireAuth()`。
3. **数据库变更**：改 `prisma/schema.prisma` 后必须 `pnpm db:migrate`；不要手改迁移。
4. **前端字段映射**：模拟面试回合的 Prisma 字段 `aiQuestion/userAnswer/aiFeedback` 在前端映射为 `question/answer/feedback`（见 `src/app/ai/mock-interview/page.tsx`）。
5. **主题色**：用 CSS 变量（`var(--primary)` 等），透明色用 `color-mix()`，勿硬编码 rgba。颜色 token 集中在 `src/lib/design-tokens.ts`。
6. **提交**：遵循约定式提交（feat/fix/docs/...），一次提交一件事。
7. **暗色模式**：自写 `data-theme` + localStorage 防闪烁脚本（`layout.tsx`），非 next-themes。
8. **请求体校验**：写接口用 `parseBody(request, schema)`（zod，schema 集中在 `src/lib/schemas.ts`）。
9. **每用户状态**：掌握/收藏走 `UserQuestionState`，打卡走 `UserStreak`（题目级全局字段已删除），查询必须显式 `where: { userId }`。

---

## 7. 常用命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 开发服务器（:3000）
pnpm build / start    # 生产构建/启动
pnpm lint             # ESLint
pnpm test:run         # Vitest 单次
pnpm db:migrate       # Prisma 迁移
pnpm db:studio        # Prisma Studio
pnpm prisma generate  # 重新生成 client
```

---

## 8. 环境变量（`.env.local`，不入库）

`DATABASE_URL`（必）· `DEEPSEEK_API_KEY`（必）· `AUTH_SECRET`（必）·
`NEXT_PUBLIC_APP_URL`（可选）·
`OSS_REGION`/`OSS_BUCKET`/`OSS_ACCESS_KEY`/`OSS_SECRET`（可选，图片上传）
