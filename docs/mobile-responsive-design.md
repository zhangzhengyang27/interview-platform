# 移动端响应式适配设计规范

> 日期：2026-06-11
> 策略：移动端优先重构（Mobile-First Redesign）
> 范围：全站所有页面 + 全部 UI 组件
> 目标设备：手机（≤767px）+ 平板（768px-1024px）

---

## 1. 断点体系

采用 Tailwind CSS 默认断点，**默认样式面向手机端编写**，通过 `md:` / `lg:` 前缀逐级增强。

| 断点 | 最小宽度 | 目标设备 | 用途 |
|------|---------|----------|------|
| （默认） | 0px | 手机竖屏 | 基础样式 |
| `sm` | 640px | 大屏手机横屏 / 小平板 | 微调 |
| `md` | 768px | 平板竖屏 | 启用桌面导航、侧边栏、多列布局 |
| `lg` | 1024px | 平板横屏 / 小笔记本 | Bento Grid 等复杂布局 |
| `xl` | 1280px | 桌面显示器 | 最大内容宽度 |

### 核心原则
- **Mobile-First:** 不写 `max-width` 媒体查询，全部用 Tailwind 的 min-width 断点
- **渐进增强:** 默认 = 手机端，`md:` 以上才添加桌面端特性
- **不破坏桌面端:** 所有改动需在桌面浏览器中验证无回归

---

## 2. 全局基础层

### 2.1 Viewport Meta 标签

**文件:** `src/app/layout.tsx`

```tsx
export const metadata: Metadata = {
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}
```

### 2.2 globals.css 新增规则

```css
/* ─── Mobile-First Base ─────────────────────────────── */

/* 安全区域适配（刘海屏/底部指示器） */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* 触摸优化：取消 300ms 点击延迟 */
a, button, [role="button"] {
  touch-action: manipulation;
}

/* 仅在支持 hover 的设备上启用 hover 效果 */
@media (hover: hover) and (pointer: fine) {
  .hover-enable:hover { ... }
}

/* 文字排版：手机端不小于 14px */
body {
  -webkit-text-size-adjust: 100%;
  font-size: 16px; /* 防止 iOS 自动缩放 */
}

/* 滚动容器统一 */
.mobile-scroll {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
```

### 2.3 间距系统

| 属性 | 手机端 (默认) | 平板+ (md:) |
|------|-------------|-------------|
| 页面 padding | 16px (`--spacing-margin-mobile`) | 24px (`--spacing-margin-desktop`) |
| 卡片内边距 | 12-16px | 16-20px |
| 栅格间距 | 12px (`gap-3`) | 16px (`gap-4`) |
| 组件间距 | 16px | 24px |

---

## 3. 导航系统改造

### 3.1 TopNav 组件重构

**文件:** `src/components/layout/TopNav.tsx`

#### 桌面端（≥768px，`md:`）
- **保持现有设计不变**
- Logo + 水平导航链接 + 操作按钮区

#### 移动端（<768px）
```
┌─────────────────────────────────┐
│ 📋 面试网              [☰]     │
└─────────────────────────────────┘
```

- Logo 缩小至 `text-xl`（20px）
- 右侧显示汉堡菜单图标按钮（44×44px 触摸区域）
- 隐藏：导航链接、"新增题目"按钮、通知/设置图标

### 3.2 Drawer 抽屉组件（新增）

**新文件:** `src/components/layout/MobileDrawer.tsx`

**行为规范：**
- 从左侧滑入，宽度 280px，最大宽度 80vw
- 背景遮罩层（半透明黑色），点击关闭
- 支持右滑手势关闭
- 内容包含：
  - 用户头像/名称区域（可选）
  - 导航链接列表（与 NAV_LINKS 一致）
  - 分隔线
  - 「新增题目」入口
  - 主题切换开关
- 打开时禁止背景滚动（`overflow: hidden`）
- 进入/退出动画：300ms ease-out
- 使用 `z-50` 确保在最上层

### 3.3 状态管理

TopNav 内部管理 Drawer 开关状态（`useState`），无需全局状态。

---

## 4. 页面级布局规范

### 4.1 Dashboard（首页）

**文件:** `src/app/page.tsx`

| 区域 | 桌面端 | 移动端 |
|------|--------|--------|
| Header | 左标题右打卡徽章 | 标题 + 打卡徽章换行堆叠 |
| Bento Row 1 | 3 列网格 (md:grid-cols-12) | 单列垂直堆叠 |
| 进度环 (ProgressRing) | size=160 | size=120 |
| 统计卡片 | 3 个纵向排列 | 横向 3 列等分 (grid-cols-3) |
| 每日一题卡 | 右侧卡片 | 全宽卡片 |
| 热力图 | Card 内展示 | 保持，允许横向滚动 |
| 分类分布 + 错题 | 2 列 | 单列堆叠 |
| 最近练习 | 横向滚动卡片 | 横向滚动，min-w→260px |
| Footer | 双行 | 单行居中 |

**关键改动：**
- 外层容器：`p-margin-desktop` → `p-4 md:p-margin-desktop`
- `max-w-[1440px]` 保持不变
- Grid 布局全部改为 mobile-first 写法

### 4.2 题目列表页

**文件:** `src/app/questions/page.tsx`

**移动端布局：**
```
┌─────────────────────────┐
│ [全部][JS][Java][前端]… →│  ← 横向滚动 Tab 栏
├─────────────────────────┤
│ [筛选 ▼] [搜索框...    ] │  ← 筛选栏
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ 题目卡片 1          │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ 题目卡片 2          │ │
│ └─────────────────────┘ │
│                         │
│   [< 1 2 3 4 5 >]      │  ← 简化分页
└─────────────────────────┘
```

**关键改动：**
- 语言分组 Tab 栏：固定顶部，`overflow-x-auto` 横向滚动，每个 tab 最小宽度 auto
- 分类侧边栏：**收起为「筛选」弹出按钮**，点击后从底部弹出面板（Bottom Sheet）或展开为下拉区域
- 题目列表：单列，卡片间距 12px
- 分页器：简化显示，或替换为「加载更多」按钮

### 4.3 题目详情页

**文件:** `src/app/questions/[id]/page.tsx`

**移动端布局：**
```
┌─────────────────────────┐
│ ← 返回  两数之和         │  ← 顶栏固定
│ [中等] [算法] [数组]    │  ← 元信息标签
├─────────────────────────┤
│                         │
│    题目内容区域          │  ← 可滚动
│    (Markdown 渲染)       │
│                         │
├─────────────────────────┤
│ [编辑器][题解][面试][讨论]│  ← 底部 Tab 栏（粘性定位）
├─────────────────────────┤
│                         │
│    Tab 对应内容区        │
│                         │
└─────────────────────────┘
```

**关键改动：**
- 移除左右分屏布局，改为**垂直流式布局**
- 顶部固定：返回按钮 + 题目标题 + 难度/标签
- 中间：题目内容（可滚动）
- 底部：**粘性 Tab 栏**（`sticky bottom` 或固定底部）
- Tab 内容区在 Tab 栏上方滚动
- 代码编辑器：全宽展示，高度至少 200px

### 4.4 AI 对话页

**文件:** `src/app/ai/page.tsx`

**移动端布局：**
- 聊天消息列表：基本可用，确保 padding 适配
- 输入框：固定底部，全宽，带发送按钮
- **Keyboard 弹起处理：** 输入框跟随键盘，消息区自动滚动到底部

### 4.5 AI 模拟面试页

**文件:** `src/app/ai/mock-interview/page.tsx`

**选择方向界面：**
- 方向卡片：2×2 网格 → 移动端 2 列或单列堆叠
- 卡片内部：图标缩小，文字折行

**面试聊天界面：**
- 同 AI 对话页处理
- 提交答案区：文本域全宽 + 提交按钮

### 4.6 学习计划

**列表页** `src/app/study-plans/page.tsx`
- 创建计划 Modal：全屏居中，内边距缩小
- 计划卡片：单列堆叠

**详情页** `src/app/study-plans/[id]/page.tsx`
- 日历/进度视图：保持，横向滚动日历
- 题目列表：单列，完成状态图标保持

### 4.7 面经笔记页（最复杂）

**文件:** `src/app/experiences/page.tsx`

**移动端布局 — 两层跳转模式：**
```
第一层：笔记列表（全屏）
┌─────────────────────────┐
│ 面经笔记        [✏️新建] │
├─────────────────────────┤
│ ▼ 字节跳动               │
│   · 字节跳动一面复盘      │
│   · 字节跳动二面总结      │
│ ▼ 阿里巴巴               │
│   · 阿里淘系面经          │
│                         │
└─────────────────────────┘

第二层：笔记详情/编辑（全屏）
┌─────────────────────────← 返回
│ 字节跳动一面复盘    [编辑]│
├─────────────────────────┤
│                         │
│  Markdown 内容渲染       │
│  （或编辑器）            │
│                         │
└─────────────────────────┘
```

**关键改动：**
- 移除三栏布局和左侧图标导航
- 第一层：公司分组手风琴 + 笔记列表（全宽）
- 点击笔记 → 使用 `router.push` 进入详情模式（或替换当前路由状态）
- 详情模式：顶部返回栏 + 标题 + 内容区
- 编辑模式：全屏 Markdown 编辑器

### 4.8 其他页面

**新增题目** `/questions/new`
- 表单元素全宽
- 标签/难度选择器：横向滚动或网格 2-3 列

**AI 批量出题** `/questions/ai-generate`
- 参数配置区垂直堆叠
- 结果列表单列

---

## 5. 组件级适配规范

### 5.1 Card 组件

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 默认 padding | p-6 | p-4 |
| 圆角 | rounded-lg | rounded-lg (不变) |
| hover 效果 | 阴影+位移 | 仅阴影变化 |

### 5.2 Button 组件

- **最小触摸高度 44px**（padding-y 至少 10px for sm 尺寸）
- primary 按钮：全宽使用时 `w-full`
- 图标按钮：保持 44×44px 触摸区域

### 5.3 Input 组件
- 移动端默认 `w-full`
- font-size ≥ 16px（防止 iOS zoom）

### 5.4 Badge 组件
- 字体大小：text-xs（不变）
- 内边距略微缩小：px-1.5 py-0.5

### 5.5 CodeEditor 组件
- 容器：`w-full`，min-height: 200px
- 工具栏（语言选择等）：换行或横向滚动

### 5.6 MarkdownRenderer
- 表格：外层 `overflow-x-auto`
- 代码块：字体缩小至 12px
- 图片：`max-w-full h-auto`

### 5.7 ProgressRing
- 尺寸响应式：`size={isMobile ? 120 : 160}`
- 或通过 props 传入

### 5.8 ThemeToggle / ImageUploader
- 无特殊适配需求，保持现有尺寸

---

## 6. 交互规范

### 6.1 触摸目标
- 所有可交互元素 **最小 44×44px**
- 列表项行高至少 52px
- 图标按钮使用 padding撑开而非固定尺寸

### 6.2 滚动行为
- 使用 `-webkit-overflow-scrolling: touch` 惯性滚动
- `overscroll-behavior: contain` 防止嵌套滚动联动
- 横向滚动区域明确标示（阴影提示或部分露出下一项）

### 6.3 动画过渡
- Drawer/Modal：300ms ease-out
- 页面切换：无动画（Next.js 路由）
- Tab 切换：150ms fade
- 列表项出现：stagger 50ms 延迟

### 6.4 键盘处理
- 输入框获取焦点时，页面整体不滚动（仅内容区滚动）
- 聊天类页面：输入框贴底，随 keyboard 弹起
- 使用 `visualViewport` API 监听键盘变化（可选增强）

### 6.5 网络状态
- 保持现有加载态（Skeleton）
- 下拉刷新：暂不实现（非核心需求）

---

## 7. 实施顺序建议

### Phase 1：基础框架（必须首先完成）
1. viewport meta 标签
2. globals.css 移动端基础规则
3. TopNav + MobileDrawer 组件
4. 间距系统切换

### Phase 2：核心页面
5. Dashboard 首页
6. 题目列表页
7. 题目详情页

### Phase 3：功能页面
8. AI 对话页
9. AI 模拟面试页
10. 学习计划（列表 + 详情）
11. 面经笔记页

### Phase 4：收尾
12. 新增题目 / AI 出题页
13. 全组件检查
14. 多设备测试验证

---

## 8. 验收标准

- [ ] iPhone SE (375px) 全页面可正常浏览和操作
- [ ] iPhone 14 Pro (393px) 全页面体验良好
- [ ] iPad (768px / 1024px) 布局合理
- [ ] Android Chrome / 微信内置浏览器正常
- [ ] 横屏模式不崩溃
- [ ] 触摸操作流畅无误触
- [ ] 桌面端（≥1280px）无视觉回归
