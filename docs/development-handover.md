# 开发交接文档

> 用途：换电脑继续开发面试网（interview-platform）项目的完整交接说明。
> 更新日期：2026-08-15

---

## 一、项目概览

面试网是一个 AI 面试平台，包含题库、AI 模拟面试、学习路径等功能。本次交接聚焦于**近期完成的语音/视频面试能力**，以及换电脑所需的全部环境信息。

### 目录结构

```
面试网/
├── interview-platform/          # 主项目（Next.js 16 + React 19 + Prisma + PostgreSQL）
│   ├── src/                     # 源码
│   ├── docs/                    # 文档（含语音视频面试配置指南）
│   ├── scripts/                 # 数据治理脚本
│   ├── backups/                 # 历史数据备份（未入库）
│   ├── certs/                   # 本地 HTTPS 证书（未入库，需重建）
│   ├── .env                     # 环境变量（含 DeepSeek Key）
│   ├── .env.local               # 环境变量（含火山引擎全部密钥）
│   └── .env.example             # 环境变量模板
├── interview-admin/             # 管理后台
├── design-reference/            # 设计参考
├── design-system/               # 设计系统
├── stitch-prompts.md            # Prompt 拼接参考
├── interview_platform.dump      # 数据库备份（自定义格式，4.3M）
├── interview_platform.sql       # 数据库备份（纯 SQL，12M）
└── 开发交接文档.md              # 本文档
```

---

## 二、换电脑后的环境搭建步骤

### 1. 安装基础依赖

```bash
# Node.js（建议 20+，当前用 Node 24）
# PostgreSQL 15+（数据库）
# Homebrew（macOS）
brew install postgresql@15 node pnpm mkcert
```

### 2. 拉取/拷贝代码

```bash
# 方式一：git clone（代码已提交到 main 分支）
git clone <仓库地址>

# 方式二：直接拷贝 interview-platform/ 目录
```

### 3. 恢复数据库

```bash
# 创建空库
createdb interview_platform

# 用 SQL 文件恢复（最简单）
psql -d interview_platform -f interview_platform.sql

# 或用自定义格式恢复（推荐，更完整）
pg_restore -d interview_platform interview_platform.dump
```

> 数据库备份文件在项目根目录：`interview_platform.sql` 和 `interview_platform.dump`

### 4. 安装项目依赖

```bash
cd interview-platform
pnpm install
```

> ⚠️ **必须用 pnpm**，不要用 npm（npm 11 有 `gitignore-fallback` bug 会导致安装失败）

### 5. 配置环境变量

`.env.local` 需要手动拷贝（**不会随 git 提交**），内容见下文「三、密钥清单」。

### 6. 配置本地 HTTPS（语音/视频面试必需）

```bash
mkcert -install  # 需要 sudo

cd interview-platform
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem \
  localhost 127.0.0.1 <新电脑的局域网IP>
```

### 7. 启动项目

```bash
# 普通启动（文本面试够用）
npm run dev          # http://localhost:3001

# HTTPS 启动（语音/视频面试必需，麦克风/摄像头需要安全上下文）
npm run dev:https    # https://localhost:3001
```

---

## 三、密钥清单（换电脑必须手动携带）

以下密钥**不在 git 仓库中**，需从旧电脑的 `.env.local` 和 `.env` 手动拷贝到新电脑。

### `.env.local`（火山引擎语音/视频）

| 变量名 | 用途 | 说明 |
|--------|------|------|
| `VOLC_API_KEY` | 语音 ASR/TTS | 新版 API Key 鉴权 |
| `VOLC_TTS_RESOURCE_ID` | TTS 资源模型 | 固定 `seed-tts-2.0` |
| `VOLC_ASR_RESOURCE_ID` | ASR 资源模型 | `volc.bigasr.sauc.duration`（1.0 版） |
| `VOLC_TTS_VOICE_TYPE` | TTS 音色 | 自然女声 |
| `VOLC_S2S_APP_ID` | 端到端语音大模型 AppId | 视频面试用（旧版鉴权） |
| `VOLC_S2S_ACCESS_TOKEN` | 端到端语音大模型 Token | 视频面试用 |
| `VOLC_RTC_APP_ID` | RTC 应用 AppId | 视频面试用 |
| `VOLC_RTC_APP_KEY` | RTC 应用 AppKey | 视频面试用（MFA 验证获取） |
| `VOLC_ACCESS_KEY` | 火山引擎 AK | RTC OpenAPI 签名 |
| `VOLC_SECRET_KEY` | 火山引擎 SK | RTC OpenAPI 签名 |

### `.env`（其他服务）

| 变量名 | 用途 |
|--------|------|
| `DEEPSEEK_API_KEY` | DeepSeek 文本模型（出题/评分） |
| 阿里云 OSS 相关 | 文件上传 |

> ⚠️ 完整配置流程见 `interview-platform/docs/语音视频面试配置指南.md`

---

## 四、近期完成的工作（语音/视频面试）

### Git 提交记录（main 分支）

| Commit | 内容 |
|--------|------|
| `3a1517d` | 统一模拟面试方向与 job_role 分类治理 |
| `44fa8fb` | 接入火山豆包语音（ASR+TTS）实现语音面试 |
| `a6eeb1f` | 视频面试实时字幕 + SeedRealtime 接入 |
| `6dbd1f5` | mkcert 本地 HTTPS + npm 引入 RTC SDK |

### 三种面试模式状态

| 模式 | 技术方案 | 状态 |
|------|---------|------|
| 文本面试 | DeepSeek 纯文本 | ✅ 完整可用 |
| 语音面试 | 豆包 ASR + TTS | ✅ 完整可用（TTS 已真实验证） |
| 视频面试 | RTC + 豆包端到端实时语音大模型 | ⚠️ 代码完整，待有摄像头设备联调 |

### 关键代码文件

| 文件 | 说明 |
|------|------|
| `src/lib/volcengine.ts` | 火山引擎四套凭证体系 + V4 签名 |
| `src/lib/volcengine-voice.ts` | ASR/TTS 调用封装 |
| `src/lib/video-interview.ts` | RTC Token + StartVoiceChat |
| `src/hooks/useSpeechRecognition.ts` | 录音 Hook |
| `src/components/VoiceInput.tsx` | 语音输入按钮 |
| `src/components/SpeakButton.tsx` | AI 朗读按钮 |
| `src/components/VideoInterviewView.tsx` | 视频通话界面 |
| `src/app/api/voice/*` | TTS/ASR 代理接口 |
| `src/app/api/video-interview/*` | RTC Token/Start/Save 接口 |

---

## 五、换电脑后的重点任务

### 优先级 1：验证语音/视频面试（需要麦克风/摄像头）

新电脑有麦克风/摄像头后，可以完整联调：

1. **语音面试**：`npm run dev:https` → 访问 `https://localhost:3001/ai/mock-interview` → 语音面试模式 → 测试朗读 + 语音输入
2. **视频面试**：视频面试模式 → 开始视频面试 → 摄像头/麦克风授权 → 与 AI 面试官对话

### 优先级 2：视频面试的 RTC Token 联调

视频面试代码已完整，但 `generateRtcToken` 的 Token 算法、`StartVoiceChat` 的 V4 签名、RTC SDK 的 `joinRoom` 等，**尚未在真实设备上端到端验证**。需要在有摄像头的设备上首次联调，可能遇到：

- RTC Token 格式细节（以官方 SDK 实际验证为准）
- 字幕事件名 `roomBinaryMessageReceived`（以 SDK 类型定义为准）
- SeedRealtime 云端托管会话的配置细节

### 优先级 3：其他历史遗留

- 全量 lint 有少量历史 error/warning（test-papers/companies/LeaderboardWidget 等，非本次引入）
- learning-paths 的 category 体系与题库 job_role 是独立体系（未统一）

---

## 六、注意事项

1. **`.env.local` 和 `.env` 绝不提交 git**（含全部密钥）
2. **数据库备份文件不入库**（含用户数据，注意隐私）
3. **certs/ 目录不入库**（本地证书，每台电脑重新生成）
4. **用 pnpm 装依赖**，npm 11 有 bug
5. **语音/视频功能必须 HTTPS**（`dev:https`），否则浏览器禁用麦克风
6. **火山引擎三套凭证不要混用**（详见配置指南第 2 节）

---

## 七、联系方式/参考

- 火山引擎语音控制台：https://console.volcengine.com/speech/app
- 火山引擎 RTC 控制台：https://console.volcengine.com/rtc
- 火山引擎 IAM 密钥管理：https://console.volcengine.com/iam/keymanage/
- 配置详细文档：`interview-platform/docs/语音视频面试配置指南.md`
