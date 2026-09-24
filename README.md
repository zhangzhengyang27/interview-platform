# 面试网 (interview-platform)

AI 驱动的程序员面试准备平台 —— 题库练习、AI 模拟面试、竞赛、学习路径与数据看板一体化。

一个基于 **Next.js 16（App Router）** 的全栈单体应用：前端页面、REST API、AI 服务、数据访问层全部运行在同一个 Next.js 工程内，后端通过 Prisma 直连 PostgreSQL。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Next.js 16 (App Router) + React 19 + TypeScript（strict） |
| 样式 | Tailwind CSS v4 + 设计令牌（CSS 变量）+ 暗色模式（自写 data-theme 脚本） |
| 数据库 | PostgreSQL + Prisma 7（`@prisma/adapter-pg` 连接池） |
| 认证 | NextAuth v4（Credentials 邮箱密码 + 邮箱验证码注册，JWT 会话） |
| AI | DeepSeek（`deepseek-chat`，支持 SSE 流式输出） |
| 代码执行 | Piston 在线执行 API（多语言沙箱，15s 超时） |
| 图表/渲染 | Recharts、react-markdown、Mermaid、highlight.js |
| 编辑器 | CodeMirror（多语言） |
| 数据获取 | SWR（客户端）、直接调用（服务端） |
| 存储 | 阿里云 OSS（可选，图片上传） |
| 测试 | Vitest + Testing Library（lib 覆盖率阈值 40%） |
| 其他 | PWA Service Worker（离线支持） |

## 功能模块

- **题库练习**：分类、难度、标签筛选；支持后端/前端/算法/系统设计/软技能等方向。
- **AI 模拟面试**：基于 DeepSeek 的多轮对话模拟面试，SSE 流式回复。
- **竞赛 (Contests)**：题目提交与评测排行。
- **学习路径 / 学习计划**：结构化学习路线与个性化计划。
- **试卷 (Test Papers)**：自定义组卷练习。
- **数据看板 (Dashboard)**：连续打卡、能力雷达、练习热力图、薄弱点分析、间隔复习（艾宾浩斯遗忘曲线）。
- **每日一题 / 复习提醒**：基于艾宾浩斯遗忘曲线的到期复习。
- **社区**：题解、评论、经验分享、公司面经、收藏、通知。
- **后台管理**：内容审核与举报管理。

## 目录结构

```
interview-platform/
├── src/
│   ├── app/                  # 页面路由 + API 路由处理器
│   │   ├── (auth)/           # 登录/注册的布局分组
│   │   ├── api/              # 后端 API（30+ 模块）
│   │   ├── ai/               # AI 模拟面试页面
│   │   ├── questions/        # 题库页面
│   │   ├── contests/         # 竞赛页面
│   │   ├── dashboard/        # 数据看板
│   │   ├── learning-paths/   # 学习路径
│   │   ├── study-plans/      # 学习计划
│   │   ├── test-papers/      # 试卷
│   │   ├── companies/        # 公司面经
│   │   ├── experiences/      # 经验分享
│   │   ├── profile/          # 个人主页
│   │   ├── admin/            # 后台管理
│   │   ├── layout.tsx        # 根布局（暗色模式脚本）
│   │   └── page.tsx          # 首页（Dashboard）
│   ├── components/           # UI 组件
│   │   ├── ui/               # 基础组件 Button/Card/Input/Badge...
│   │   ├── layout/           # TopNav 等布局组件
│   │   ├── charts/           # 图表组件
│   │   └── auth/             # 认证相关组件
│   ├── lib/                  # 后端逻辑
│   │   ├── prisma.ts         # Prisma 客户端单例
│   │   ├── auth.ts           # NextAuth 配置
│   │   ├── deepseek.ts       # DeepSeek AI 服务
│   │   ├── code-runner.ts    # Piston 代码执行
│   │   ├── review-scheduler.ts  # 艾宾浩斯间隔复习
│   │   ├── session.ts        # 会话/鉴权工具
│   │   └── oss.ts            # 阿里云 OSS
│   └── data/                 # 题库种子数据（TS）
├── prisma/
│   ├── schema.prisma         # 数据模型定义
│   ├── migrations/           # 数据库迁移
│   └── data/                 # 种子脚本
├── public/                   # 静态资源
├── scripts/                  # 工具脚本
├── docs/                     # 项目文档
```

## 环境要求

- Node.js 20+
- PostgreSQL 数据库
- pnpm（推荐）

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量（复制示例并填写）
cp .env.example .env.local   # 若无示例，手动创建，见下

# 3. 生成 Prisma Client 并执行迁移
pnpm prisma generate
pnpm db:migrate

# 4. （可选）填充种子数据
pnpm prisma db seed

# 5. 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

## 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `DATABASE_URL` | 是 | PostgreSQL 连接串 |
| `DEEPSEEK_API_KEY` | 是 | AI 功能所需（模拟面试、智能出题等） |
| `AUTH_SECRET` | 是 | NextAuth JWT 签名密钥 |
| `NEXT_PUBLIC_APP_URL` | 否 | 分享链接等的站点地址，默认 `http://localhost:3000` |
| `OSS_REGION` / `OSS_BUCKET` / `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET` | 否 | 阿里云 OSS 图片上传 |

## 常用脚本

```bash
pnpm dev          # 开发服务器
pnpm build        # 生产构建
pnpm start        # 启动生产服务
pnpm lint         # ESLint
pnpm test         # Vitest（监听）
pnpm test:run     # Vitest（单次）
pnpm db:studio    # Prisma Studio
pnpm db:migrate   # Prisma 迁移
```

## 相关文档

- `docs/` —— 功能规划与设计文档
- `AGENTS.md` —— AI 协作规范（架构、约定、开发流程）
- `CODE_WIKI.md` —— 代码库导航索引
- `docs/design/DESIGN.md` —— 设计系统（令牌、组件规范）
