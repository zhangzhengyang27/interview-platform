## Problem Statement

面试网目前拥有 2757 道面试题、36 个分类、AI 出题能力和代码编辑器，已经具备了面试刷题平台的基础骨架。但用户在刷完一道题之后，缺乏继续刷下去的动力。没有打卡激励、没有系统化的学习路线、AI 能力仅停留在出题层面。与牛客网、面试鸭、LeetCode 等成熟产品相比，平台缺少让用户"每天回来"的游戏化机制和"知道该刷什么"的路径引导。

## Solution

在现有架构（Next.js + Prisma + PostgreSQL + DeepSeek）基础上，分三个阶段引入：游戏化激励体系、AI 深度陪练、结构化学习路线。优先做投入产出比最高的功能——利用已有的 PracticeHistory 数据做统计看板和打卡，利用已有的 DeepSeek 通路做 AI 模拟面试和答案评估，利用已有的 Category + mastery 体系做学习计划。

## User Stories

### 一、刷题统计看板与连续打卡

1. As a 面试备战者, I want to see my daily/weekly/monthly question count on the Dashboard, so that I can track my study intensity and stay motivated
2. As a 面试备战者, I want a visible streak counter showing consecutive days I've practiced, so that I feel a sense of commitment to not break the chain
3. As a 面试备战者, I want to see a calendar heatmap of my practice activity (like GitHub contribution graph), so that I can visually see my consistency over time
4. As a 面试备战者, I want to see a breakdown of my practice by difficulty (easy/medium/hard pie chart), so that I know if I'm challenging myself enough
5. As a 面试备战者, I want to see a breakdown of my practice by category (Java/Frontend/Database bar chart), so that I can identify weak areas
6. As a 面试备战者, I want the Dashboard progress ring to show today's goal completion (e.g. "今日目标: 5 题, 已完成 3 题"), so that I have a clear daily target
7. As a 面试备战者, I want to set a customizable daily practice goal (default 5 questions), so that the target fits my schedule
8. As a 面试备战者, I want to see my total stats (total questions seen, mastered, learning, unsolved) at a glance, so that I feel a sense of progress

### 二、每日一题与沉浸刷题模式

9. As a 面试备战者, I want a "每日一题" section on the Dashboard that shows one curated question per day, so that I have a low-friction entry point to start practicing each day
10. As a 面试备战者, I want the daily question to be selected based on my weak areas (unsolved/learning questions prioritized), so that I'm making the most efficient use of my time
11. As a 面试备战者, I want an "immersive mode" that hides the sidebar and navigation when I'm reading a question, so that I can focus entirely on the content
12. As a 面试备战者, I want keyboard shortcuts (← → for prev/next, Esc to exit immersive mode), so that I can navigate between questions without reaching for the mouse
13. As a 面试备战者, I want to mark the daily question as "done" with one click, so that completing it feels effortless and feeds into my streak

### 三、AI 模拟面试

14. As a 面试备战者, I want to start an AI mock interview by selecting a direction (e.g. "Java后端" or "前端"), so that the questions are relevant to my target role
15. As a 面试备战者, I want the AI interviewer to ask questions one at a time in a conversational flow (not dump 10 questions at once), so that it feels like a real interview
16. As a 面试备战者, I want to type or speak my answer and have the AI evaluate it with a score and feedback, so that I know how well I performed
17. As a 面试备战者, I want the AI to ask follow-up questions based on my answer (like a real interviewer would), so that I practice thinking on my feet
18. As a 面试备战者, I want a post-interview summary report showing my strengths, weaknesses, and suggested areas to study, so that I have actionable next steps
19. As a 面试备战者, I want the AI mock interview to use progressive hints when I'm stuck (subtle clue → bigger hint → reveal answer), so that I learn incrementally rather than just reading the answer
20. As a 面试备战者, I want to review my past mock interview sessions with scores and feedback, so that I can track my improvement over time

### 四、AI 答案评估

21. As a 面试备战者, I want to write my own answer to a Q&A question and have the AI compare it against the recommended answer, so that I know what I missed
22. As a 面试备战者, I want the AI evaluation to give me a score (1-10) with specific feedback on completeness, accuracy, and expression clarity, so that I can improve my interview communication skills
23. As a 面试备战者, I want the AI to highlight key points I missed from the recommended answer, so that I can fill knowledge gaps

### 五、学习计划与刷题路线

24. As a 面试备战者, I want pre-built study plans for common roles (Java后端 30天冲刺, 前端面试突击, 系统设计入门), so that I don't have to figure out the optimal question order myself
25. As a 面试备战者, I want to see my progress within a study plan (e.g. "Day 5/30, 12/45 questions completed"), so that I feel a sense of momentum
26. As a 面试备战者, I want each study plan day to have a curated set of questions with a recommended time allocation, so that I can plan my study sessions
27. As a 面试备战者, I want to create my own custom study plans by selecting questions from the bank, so that I can prepare for specific interviews
28. As a 面试备战者, I want study plans to show a difficulty progression curve (easy → medium → hard), so that I build confidence before tackling harder topics
29. As a 面试备战者, I want to bookmark a study plan and resume it later across sessions, so that I can study in multiple sittings

### 六、公司维度筛选

30. As a 面试备战者, I want to filter questions by company (字节跳动, 阿里巴巴, 腾讯, etc.), so that I can prepare for a specific company's interview
31. As a 面试备战者, I want to see company tags on question cards in the list view, so that I know at a glance which companies have asked this question
32. As a 面试备战者, I want a company-focused view that shows all questions from a specific company grouped by category, so that I can do targeted company preparation

### 七、题解社区增强

33. As a 面试备战者, I want to submit my own answer/solution to a question and share it with others, so that I can contribute to the community and reinforce my learning
34. As a 面试备战者, I want to see other users' solutions sorted by upvotes, so that I can learn from the best approaches
35. As a 面试备战者, I want to upvote helpful solutions from other users, so that good content rises to the top

## Implementation Decisions

### 1. 新增数据模型

#### `Streak` 模型
- 记录每日打卡状态，字段：`id`、`date`（唯一索引）、`questionCount`（当日刷题数）、`goalMet`（是否达标）
- 连续天数通过查询连续 date 记录计算，不做冗余存储

#### `StudyPlan` 模型
- 字段：`id`、`title`、`description`、`icon`、`totalDays`、`createdAt`
- 预设计划由 seed 脚本写入（如 "Java后端30天冲刺"），用户也可自建

#### `StudyPlanDay` 模型
- 字段：`id`、`studyPlanId`（外键）、`dayNumber`（第几天）、`targetQuestionCount`
- 关联 `StudyPlanItem`（多对多连接 Question）

#### `StudyPlanItem` 模型
- 字段：`id`、`studyPlanDayId`（外键）、`questionId`（外键）、`sortOrder`
- 表示某一天计划中的具体题目和顺序

#### `StudyPlanProgress` 模型
- 字段：`id`、`studyPlanId`（外键）、`questionId`（外键）、`completedAt`
- 记录用户在计划中完成了哪些题，用于计算进度

#### `MockInterview` 模型
- 字段：`id`、`direction`（面试方向，如 "java-backend"）、`startedAt`、`endedAt`、`overallScore`（总评分）、`summary`（AI 生成的总结报告）、`status`（in-progress / completed）

#### `MockInterviewTurn` 模型
- 字段：`id`、`mockInterviewId`（外键）、`questionId`（可空，关联题库中的题）、`aiQuestion`（AI 提的问题文本）、`userAnswer`（用户的回答）、`aiFeedback`（AI 的评估反馈）、`score`（单轮评分）、`turnOrder`

### 2. API 变更

#### 新增 API 路由
- `GET /api/stats/extended` — 扩展统计：每日/每周/每月刷题量、分类分布、难度分布、日历热力图数据（最近 90 天的每日刷题数）
- `GET /api/stats/streak` — 返回当前连续打卡天数、历史最长连续天数、今日是否已打卡
- `GET /api/daily-question` — 每日一题：基于用户未掌握题目随机推荐一道，同一天多次请求返回同一题（按 date 缓存）
- `POST /api/mock-interview` — 创建一场新的 AI 模拟面试会话
- `POST /api/mock-interview/[id]/turn` — 提交一轮回答并获取 AI 的下一轮追问
- `GET /api/mock-interview/[id]` — 获取模拟面试详情（含所有轮次）
- `GET /api/mock-interviews` — 获取历史模拟面试列表
- `POST /api/ai/evaluate` — AI 答案评估：接收用户答案和推荐答案，返回评分和改进建议
- `GET /api/study-plans` — 获取学习计划列表
- `POST /api/study-plans` — 创建自定义学习计划
- `GET /api/study-plans/[id]` — 获取学习计划详情（含每日题目和进度）
- `POST /api/study-plans/[id]/progress` — 标记计划中某题已完成

#### 现有 API 修改
- `GET /api/questions` — 增加 `company` 筛选参数
- `GET /api/questions/[id]/comments` — 增加按 upvotes 排序选项
- `POST /api/questions/[id]/comments` — 增加 `parentId` 字段支持嵌套评论（可选，P2）

### 3. 前端页面变更

#### Dashboard 页面 (`/`) 重构
- 保留现有进度环和统计卡片
- 新增：今日目标进度条（"5 题中已完成 3 题"）
- 新增：每日一题卡片（醒目的 CTA 按钮"开始今日练习"）
- 新增：刷题日历热力图（GitHub contribution 风格，90 天）
- 新增：分类雷达图（展示各方向刷题均衡度）
- 新增：连续打卡天数徽章

#### 新增沉浸模式
- 在题目详情页 (`/questions/[id]`) 增加"沉浸模式"开关按钮
- 激活后隐藏 TopNav、侧边栏，只保留题目内容和答案区域
- 键盘快捷键：`←` 上一题、`→` 下一题、`Esc` 退出沉浸模式、`F` 切换沉浸模式

#### 新增 AI 模拟面试页面 (`/ai/mock-interview`)
- 第一步：选择面试方向（卡片式选择：Java后端、前端、数据库、系统设计等）
- 第二步：进入对话式面试界面（类似现有 /ai 聊天界面，但结构化为问答轮次）
- 第三步：面试结束后展示总结报告（评分雷达图、各轮反馈、改进建议）

#### 新增学习计划页面 (`/study-plans`)
- 计划列表页：预设计划 + 自建计划，卡片式展示，显示总天数和完成百分比
- 计划详情页：左侧天数列表（Day 1, Day 2, ...），右侧当日题目列表
- 每日进度可视化：已完成/未完成的勾选标记

#### 题目列表页增强
- 筛选器增加"公司"维度下拉选择
- 题目卡片增加 company 标签（如果有的话）

### 4. 技术架构决策

- **AI 调用保持非流式**：模拟面试和答案评估场景对延迟容忍度较高（用户正在思考/打字），非流式调用简化实现，后续可改为流式提升体验
- **统计查询走 Prisma 聚合**：`groupBy` + `_count` 满足需求，暂不引入独立的分析数据库
- **每日一题缓存策略**：基于当前日期（Asia/Shanghai 时区）作为 seed 从候选题目中伪随机选取，同一天返回相同题目，无需 Redis 缓存
- **学习计划进度存储在服务端**：通过 StudyPlanProgress 表追踪，不依赖客户端状态
- **键盘快捷键使用 useEffect + keydown 事件监听**：不需要引入额外的快捷键库

### 5. 阶段划分

- **Phase 1（P0，预计 5 天）**：统计看板 + 打卡 + 每日一题 + 沉浸模式。仅涉及新增 Streak 模型和扩展 /api/stats，前端 Dashboard 重构和题目详情页增加沉浸模式
- **Phase 2（P1，预计 7 天）**：AI 模拟面试 + 答案评估。新增 MockInterview / MockInterviewTurn 模型，对话式 UI 复用现有 /ai 页面架构，DeepSeek prompt 工程
- **Phase 3（P1，预计 5 天）**：学习计划。新增 StudyPlan 系列模型，预设计划 seed 数据，计划列表/详情页面
- **Phase 4（P2，预计 3 天）**：公司筛选 + 题解社区增强。利用现有 company 字段和 Comment 模型，前端增加筛选器和排序

## Testing Decisions

### 测试原则
- 只测试外部行为（API 输入/输出），不测试内部实现细节
- 统计类 API 通过预先 seed 固定数据并验证聚合结果来测试
- AI 相关功能使用 mock 响应测试（避免依赖外部 API 的不确定性）

### 需要测试的模块
- `/api/stats/extended` 和 `/api/stats/streak`：验证在不同 PracticeHistory 数据下的聚合正确性
- `/api/daily-question`：验证同一天多次请求返回相同题目，不同天返回不同题目
- `/api/study-plans/[id]/progress`：验证进度计算的正确性（完成数/总数）
- `/api/mock-interview/[id]/turn`：验证轮次递增和会话状态转换
- 前端沉浸模式：验证快捷键绑定和 DOM 元素隐藏/显示

### 已有测试先例
- 项目目前没有自动化测试框架配置。建议 Phase 1 同步引入 Vitest（与 Next.js 生态契合），先为新增 API 编写集成测试

## Out of Scope

- **用户认证系统**：当前项目为单用户工具，所有数据天然属于当前用户。如果后续要公网部署，需引入 NextAuth + User 模型，但不在本次 PRD 范围内
- **在线代码判题（OJ）**：需要沙箱执行环境（Judge0/Piston），基础设施成本过高，且项目定位偏向 Q&A 面试而非算法竞赛
- **实时多人协作 / 真人模拟面试**：需要 WebSocket 基础设施和双边用户匹配系统，运营成本高
- **支付 / 会员系统**：项目暂无商业化目标
- **移动端 App**：当前为 Web 应用，响应式布局已覆盖移动端基本使用
- **全文搜索引擎**：当前 PostgreSQL LIKE 查询对 2757 条数据完全够用，暂不引入 Meilisearch/Elasticsearch

## Further Notes

- Phase 1 的所有功能都不需要新增外部依赖，完全在现有技术栈（Next.js + Prisma + PostgreSQL + Tailwind）内完成
- AI 模拟面试的 prompt 工程是关键质量因素。建议参考 Interviewing.io 的反馈框架：技术准确性、沟通清晰度、问题解决思路、深度追问四个维度
- 每日一题的随机算法应避免连续推荐相同分类的题目，可用"最近 7 天未出现的分类优先"策略
- 学习计划预设数据可以参考 LeetCode 的"热题 100"和面试鸭的"刷题路线"来组织，从现有 2757 题中精选
- 沉浸模式的 UI 设计可参考面试鸭的"纯净模式"——隐藏一切非内容元素，只保留题目和答案
- 公司维度数据目前 `company` 字段覆盖率较低（大部分题目为 null），建议配合导入脚本补充公司标注
