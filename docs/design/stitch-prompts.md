# 面试网 - Stitch 设计提示词

> 程序员面试刷题平台，一站式管理题库 / 刷题练习 / 面经笔记 / AI 搜索。
> 设计风格：**Dev-Centric IDE 风格** — Technical Minimalism，深色暖调，代码优先。

---

## 设计风格说明

本项目采用 **Dev-Centric Interview Engineering System** 设计语言，核心原则：

- **Technical Minimalism**：专业克制、去装饰化，IDE-like 的认知低负荷体验
- **暖调深色**：背景色 #1e100b（深棕黑），避免纯黑带来的刺眼感
- **单一品牌色**：Primary Coral（#ffb59d）用于导航激活态、CTA 按钮高亮；Primary Container（#ff5712）用于主要操作按钮
- **层级靠边框区分**：不用阴影，用 Tonal Layering（surface 多层级） + 1px 边框线条
- **JetBrains Mono**：代码片段、数据标签、技术元信息全部使用等宽字体
- **小标签大写**：Badge 使用 JetBrains Mono uppercase + letter-spacing，传达技术感

---

## 通用设计规范

### 色彩系统

```
Canvas & Background：
  background:           #1e100b   （最深层背景，整个页面底色）
  surface-dim:         #1e100b   （等于 background）

层级 Surface（由深到浅）：
  surface-lowest:      #180b06   （最深面板，如底部 footer 背景）
  surface-low:         #281813   （卡片背景，页面主内容区）
  surface-container:   #2c1c16   （中等面板，如侧边栏）
  surface-high:         #372620   （更高面板，hover 态）
  surface-highest:     #43302a   （最高面板，如输入框背景）
  surface-bright:      #48352f   （最浅面板，导航栏背景）
  surface-variant:     #43302a   （等于 surface-highest）

边框线条：
  outline:             #ac897e   （主要边框）
  outline-variant:     #5c4038   （次要分隔线，颜色更浅）

文字（由浅到深）：
  on-surface:          #fadcd3   （主要文字，暖白）
  on-surface-variant:  #e5beb2   （次要文字，暖灰）
  secondary:           #c6c7c2   （辅助文字）

Primary 品牌色：
  primary:             #ffb59d   （Coral 暖橙，用于激活态文字）
  on-primary:          #5d1800   （primary 上的文字色）
  primary-container:   #ff5712   （实心按钮背景，深橙红）
  on-primary-container: #511400   （primary-container 上的文字色）
  primary-fixed:       #ffdbd0   （浅珊瑚色，悬停高亮）
  primary-fixed-dim:   #ffb59d   （等于 primary）
  on-primary-fixed:    #390b00
  on-primary-fixed-variant: #832600

Tertiary 辅助色（蓝色系，用于分类标签、元信息）：
  tertiary:            #a8c8ff   （浅蓝）
  on-tertiary:        #003061
  tertiary-container:  #3491ff   （蓝色标签背景）
  on-tertiary-container: #002955
  tertiary-fixed:     #d5e3ff
  tertiary-fixed-dim: #a8c8ff

语义色：
  error:              #ffb4ab   （浅红，用于错误、困难难度）
  on-error:          #690005
  error-container:    #93000a
  on-error-container: #ffdad6
  success:            #4caf50   （通过状态）

分类标签配色：
  JavaScript:         #a8c8ff (tertiary 浅蓝)
  React:              #ffb59d (primary 珊瑚橙)
  System Design:      #ffb4ab (error 浅红)
  Data Structure:      #ffb59d (primary 珊瑚橙)
  前端:               #ffb59d (primary 珊瑚橙)
  后端:               #c6c7c2 (secondary 灰白)
  AI/ML:              #ffb4ab (error 浅红)
  Infra:              #ac897e (outline 暖灰)

难度颜色：
  简单 (Easy):        tertiary #a8c8ff（蓝色）
  中等 (Medium):      primary #ffb59d（珊瑚橙）
  困难 (Hard):        error #ffb4ab（浅红）
```

### 字体系统

```
字体族：
  UI:                 Inter
  代码 / 技术标签:     JetBrains Mono

字号层级：
  display-lg:  32px / 600 / -0.02em  （页面大标题）
  display-lg-mobile: 24px / 600 / -0.01em
  headline-md: 20px / 600 / 0         （卡片标题、导航文字）
  body-lg:     16px / 400 / 0         （正文）
  body-sm:     14px / 400 / 0         （次要正文）
  code-md:     14px / 400 / 0         （代码正文）
  label-caps:  11px / 600 / 0.05em    （技术标签，大写等宽）
```

### 圆角系统

```
DEFAULT: 0.25rem   (4px)  — 默认元素
lg:      0.5rem    (8px)  — 卡片、按钮
xl:      0.75rem   (12px) — 大面板、模态框
full:    9999px            — 胶囊
```

### 间距系统（4px 基准网格）

```
unit:           4px
gutter:        16px   （元素间距）
margin-desktop: 24px   （页面边距）
margin-mobile:  16px   （移动端边距）
nav-height:     56px   （导航栏高度）
```

### 组件规范

```
导航栏（TopNav）：
  背景: surface-bright (#48352f)
  高度: 56px
  Logo: primary (#ffb59d) 色，Inter 600
  链接默认: text-on-surface-variant
  激活态: text-primary + 底部 2px primary 色边框

主按钮（Primary CTA）：
  背景: primary-container (#ff5712)
  文字: on-primary-container (#511400)，白色系
  圆角: lg (8px)
  内边距: 10px 18px
  悬停: brightness-110 或变至 primary-fixed (#ffdbd0)
  阴影: 可选 0 0 10px rgba(255,87,18,0.2)（发光边框效果）

次按钮：
  背景: transparent
  边框: 1px outline-variant (#5c4038)
  文字: on-surface (#fadcd3)
  悬停: 边框变 outline (#ac897e)，背景 surface-variant

Ghost 按钮：
  无背景无边框
  文字: on-surface-variant
  悬停: 文字变 primary

卡片（Card）：
  背景: surface-low (#281813) 或 surface-container (#2c1c16)
  边框: 1px outline-variant (#5c4038)
  圆角: lg (8px)
  悬停: 边框变 primary (#ffb59d)，可加轻微发光阴影
        hover:shadow-[0_4px_20px_rgba(255,181,157,0.05)]
        hover:-translate-y-1

输入框：
  背景: surface-highest (#43302a)
  边框: 1px outline-variant (#5c4038)
  圆角: DEFAULT (4px)
  聚焦: 边框变 primary (#ffb59d)

标签 Badge：
  背景: 对应色的 15% 透明度
  文字: 对应色
  边框: 1px 对应色 20% 透明度
  圆角: 4px
  字号: label-caps 11px，JetBrains Mono，字母间距 0.05em

代码编辑器区域：
  背景: #1e1e1e（VS Code 深色标准背景）
  边框: 1px outline-variant (#5c4038)
  字体: JetBrains Mono 13-14px
  行号 gutter: 左侧单独色块，文字稍暗

进度环：
  轨道: surface-highest (#43302a)
  进度: primary (#ffb59d)
  宽度: 3px（细环）
```

### 动效规范

```
时长：
  fast:   ~200ms  （hover 颜色变化）
  base:   ~300ms  （展开/收起、面板切换）
  缓动:   cubic-bezier(0.16, 1, 0.3, 1)

交互：
  卡片悬停: -translate-y-1 + 边框变 primary + 发光阴影
  按钮悬停: opacity / brightness 变化
  激活态: scale-95 ease-out
```

---

## 1. 首页 Dashboard

```
设计一个程序员面试刷题平台首页。参考 Dev-Centric IDE 风格设计。

页面布局：
1. 顶部导航栏（surface-bright #48352f 背景，高度 56px）：
   左侧：品牌 Logo "面试网"，primary (#ffb59d) 色，Inter 600 32px
   中间导航：真题实战（激活态，primary 色 + 底部 2px primary 边框）/ 面试宝典 / 能力测评 / 社区交流
   右侧：通知图标 + 设置图标 + "新增题目" 按钮（primary-container #ff5712 背景，on-primary-container 文字）

2. 主内容区（padding 24px，Bento Grid 布局，12 列网格）：
   - 左侧大卡片（col-span-4）：今日刷题
     surface-low (#281813) 背景，outline-variant 边框
     顶部标题 + monitoring 图标
     圆形进度环（轨道 surface-highest，进度 primary #ffb59d，3px 宽）
     环内大字 "3/10" + "COMPLETED" 标签
     下方 "开始刷题" 主按钮（primary-container 背景）
   - 中间列（col-span-4）：三张统计卡片纵向排列
     每张卡片：surface-low 背景，flex 左右分布
     左：标签文字 + 大数字；右：圆形图标背景
     "总题目数 156" / "已掌握 43"（primary 色数字）/ "待复习 28"（error 色数字）
     悬停: 边框变 primary
   - 右侧（col-span-4）：错题提醒列表
     surface-low 背景
     标题 + "查看全部" 链接
     每行：题号 (#42) + 题目名（截断）+ 错误次数标签（error 背景）+ 箭头图标

3. 底部横向滚动区："最近练习"
   标题 + 左右翻页箭头
   横向滚动卡片列表（min-width 280px）：
     顶部：题号 + 分类标签（label-caps 大写徽章，不同分类不同颜色）
     标题 + 时间戳
     悬停: 边框变 primary，上移 -1px

4. Footer（surface-lowest #180b06 背景，outline-variant 顶部边框）：
   版权文字（label-caps，JetBrains Mono）+ 链接行

配色：
  background: #1e100b
  surface-low: #281813
  surface-highest: #43302a
  primary: #ffb59d
  primary-container: #ff5712
  error: #ffb4ab
  tertiary: #a8c8ff
```

---

## 2. 题库管理页

```
设计一个程序员面试题库管理页面。参考 Dev-Centric IDE 风格。

页面结构（左右分栏，全高布局）：

1. 顶部导航栏（与首页一致）。

2. 左侧筛选侧边栏（240px 宽，surface-container #2c1c16 背景，右侧 outline-variant 分隔）：
   - 顶部搜索框（输入框样式）
   - 分类筛选（Category）：
     "分类域 (Category)" label-caps 标题
     每个分类行：checkbox + 小圆点（对应分类色）+ 分类名 + （可选）数量
     选中态: 圆点变粗，文字变对应色
   - 难度筛选（Difficulty）：
     radio 组：全部 / 简单（tertiary） / 中等（primary） / 困难（error）
   - 掌握状态（Status）：
     checkbox 组：未掌握 / 已掌握 / 已收藏
     每项带图标

3. 右侧主内容区（flex-grow，background #1e100b 背景）：
   - 工具栏：搜索框（更大） + "搜索" 主按钮 + 排序下拉
   - 题目卡片网格（1-3 列，间距 16px）：
     每张卡片（surface-container #2c1c16 背景，outline-variant 边框，圆角 8px）：
       顶部 2px 色条（对应难度：tertiary蓝 / primary橙 / error红）
       题号（code-md 灰色）+ 右上角收藏按钮
       题目名（headline-md，hover 变 primary 色）
       底部：分类标签云（label-caps 徽章，多个）
       悬停: 边框变 primary，发光阴影，上移 -1px
     已掌握的题目：半透明遮罩 + check_circle 图标

4. 底部状态栏（surface-low #281813，top border）：
   左侧："共 N 题"
   右侧：分页控件（数字按钮 + 左右箭头）

配色：同上。
```

---

## 3. 新增/编辑题目页

```
设计一个「新增/编辑面试题目」的表单页面。参考 Dev-Centric IDE 风格。

页面布局：
1. 顶部导航栏（IDE 风格，surface-container-low 背景 #281813）。

2. 页面标题行：
   左侧：返回箭头 + "新增题目" headline-md
   右侧："取消" 次按钮 + "保存草稿" 主按钮（primary-container + 发光阴影）

3. 主表单卡片（max-width 860px，居中，surface-container #2c1c16 背景，outline-variant 边框）：
   各表单区域（间距 8px）：

   基本信息：
     label-caps 大写标题
     输入框（surface-highest #43302a 背景，聚焦 primary 边框）

   分类与难度：
     两列网格
     分类下拉（带 expand_more 图标）
     难度三个 pill 按钮：
       简单（outline-variant 边框）/ 中等（primary-container/20 背景 + primary-container 边框）/ 困难（outline-variant 边框）

   题目描述：
     label-caps 标题 + Markdown 工具栏（format_bold / format_italic / code / link 图标按钮组）
     textarea（surface-highest 背景，JetBrains Mono 字体）

   代码模板：
     标题 + 右上角语言下拉
     代码编辑器区（#1e1e1e 背景，深色）：
       左侧行号列（surface-container-low 背景）+ 右侧代码 textarea

   测试用例：
     "添加用例" 按钮（primary 色文字）
     用例卡片（surface-low #281813 背景，outline-variant 边框）：
       右上角删除按钮（hover error 色）
       两列：输入 + 预期输出
       底部：公开示例 checkbox

   附加标签：
     标签输入区（surface-highest 背景，聚焦 primary 边框）
     已添加的标签：surface-variant 背景徽章 + close 图标

4. 底部发布区（卡片内底部，surface-low 背景，top border）：
   "正式发布题目" 主按钮（primary-container + 发光阴影）

配色：表单背景 #2c1c16，输入框 #43302a，编辑器 #1e1e1e，primary #ffb59d，primary-container #ff5712。
```

---

## 4. 刷题练习页（重点页面）

```
设计一个程序员刷题练习页面（IDE 双栏布局）。参考 Dev-Centric IDE 风格。

页面布局（flex 左右两栏，全高）：

左侧栏（45%，surface-low #281813 背景，右侧 outline-variant 分隔）：
   - 顶部条（48px，surface-high #372620 背景）：
     返回箭头 + 题目名 "15. 三数之和"（headline-md）+ 右侧难度徽章（中等，primary/15 背景）
   - 题目内容区（可滚动，padding 24px）：
     标签行：数组 / 双指针 / 排序（surface-variant 背景徽章）
     Markdown 正文，code 块用 surface-container (#2c1c16) 背景
   - 底部操作栏（56px，surface-container #2c1c16 背景）：
     左侧：收藏按钮（bookmark_border）+ 题解按钮（forum）
     右侧："标记为已掌握" 按钮（primary 边框 + primary 文字）

右侧栏（55%，background #1e100b 背景）：
   - Tab 头部（40px，surface-high #372620 背景）：
     "代码编辑器" tab（激活态：primary 边框底部 + surface-container 背景）
     "答案解析" tab（未激活：hover surface-variant）
     工具栏：语言下拉（surface-variant 背景）+ 主题切换按钮
     右侧：次按钮 "运行代码" + 主按钮 "提交"（primary-container）
   - 编辑器主体（flex-grow，#1e1e1e 深色背景）：
     带语法高亮的代码内容，JetBrains Mono
     行号 gutter（左侧灰色列）
   - 底部控制台（180px，surface-container #2c1c16 背景）：
     "测试用例" / "执行结果" tab 切换
     成功态：success #4caf50 色文字 "✓ 通过 3/3 测试用例"
     测试用例展示：surface-lowest #180b06 背景
   - 底部导航（56px，surface-bright #48352f 背景，top border）：
     "← 上一题" ghost 按钮 + "进度: 3 / 156"（label-caps）+ "下一题 →" 主按钮（primary 边框 + primary 文字）

配色：编辑器 #1e1e1e，左栏 surface-low #281813，右栏 background #1e100b，primary #ffb59d，primary-container #ff5712。
```

---

## 5. 面经笔记页

```
设计一个面经笔记管理页面。参考 Dev-Centric IDE 风格。

页面结构（三栏布局）：

1. 顶部导航栏（IDE 风格，surface-container-low #281813 背景）：
   左侧：Logo "DevLeap IDE" + 搜索框（center）
   右侧：terminal / settings / help 图标 + "Execute" 按钮（primary-container） + 头像

2. 左侧图标导航栏（16px 宽，surface-lowest #180b06 背景）：
   上下排列的图标按钮（dashboard / database / code / description）
   当前页：surface-secondary-container 背景 + primary 左侧 2px 边框
   底部：terminal 图标

3. 中间笔记列表栏（260px，surface-raised #1c1c19 背景，右侧 outline-variant 分隔）：
   标题行："面经笔记" + 数量徽章
   "新增笔记" 按钮（surface-highest 背景，outline 边框）
   搜索框（聚焦 primary 边框）
   列表：
     "全部笔记" 入口（带总数）
     按公司分组折叠面板：
       公司名（大写 label-caps） + 笔记数量 + 展开/收起箭头
       每条笔记：标题 + 日期 + 收藏图标
       当前选中：primary 左侧 2px 竖条 + surface-variant 背景
     悬停：surface-variant 背景

4. 右侧笔记内容区（flex-grow，canvas #0e0e0c 背景）：
   编辑工具栏（12px，surface-lowest #180b06 背景）：
     标题输入框（可编辑，内联样式）+ "Unsaved" 标签
     右侧：收藏按钮 + Split/Preview 切换按钮组 + 删除按钮（hover error 背景）
   内容区（Markdown Split 编辑器）：
     左侧：textarea（surface-container #2c1c16 背景，JetBrains Mono）
     右侧：渲染后的 Markdown 内容

配色：canvas #0e0e0c，侧栏 #1c1c19，primary #ffb59d，primary-container #ff5712，surface-container #2c1c16。
```

---

## 6. AI 助手页

```
设计一个 AI 面试助手页面。参考 Dev-Centric IDE 风格。

页面布局：

1. 顶部导航栏（与首页一致，surface-bright #48352f）。

2. 主内容区（max-width 5xl，居中）：

   顶部信息区：
     标题 "AI Assistant"（display-lg）+ 描述文字
     API 状态指示器：绿色圆点（带 pulse 动画 + 发光）+ "已连接" label-caps

   快捷功能区（4 列 grid）：
     每张卡片（surface-container #2c1c16 背景，outline-variant 边框）：
       Material Symbol 图标（primary #ffb59d 色，hover 时 scale 动画）
       功能名（headline-md）
       悬停: 边框变 primary + surface-high 背景
     四个功能：
       📖 题目解析 — menu_book 图标
       🔍 语义搜索 — search_insights 图标
       💡 模拟面试 — lightbulb 图标
       📝 优化答案 — edit_note 图标

   对话区（flex-grow，surface #1e100b 背景，outline-variant 边框）：
     消息列表（可滚动）：
       AI 消息：左侧机器人头像（surface-high #372620 背景圆形）+ 右侧气泡（surface-container #2c1c16 背景）
         标签 "SYSTEM COMPILER"（label-caps 暖灰）
         支持 Markdown，含代码块（code-block 样式：#180b06 背景）
       用户消息：右对齐，primary-container #ff5712 背景，on-primary-container 文字

     底部输入区（surface-container #2c1c16 背景，top border）：
       textarea（surface #1e100b 背景，outline 边框，聚焦 primary 边框）
       工具栏：attach_file / code 按钮
       右侧：Clear 次按钮 + Send 主按钮（primary-container）

配色：AI 气泡 surface-container (#2c1c16)，用户消息 primary-container (#ff5712)。
```

---

## 附录

### 页面路径结构（供开发参考）

```
/                    首页 Dashboard
/questions           题库管理
/questions/new       新增题目
/questions/[id]      刷题练习（单题）
/experiences         面经笔记
/ai                  AI 助手
```

### 设计文件来源

- **DESIGN.md**：`/design-system/DESIGN-cursor.md` — Cursor 官方设计规范（参考）
- **实际实现配色**：来自 Stitch 生成的 7 个 HTML 页面，色彩值均为实测
- **分类标签**：前端 #ffb59d / 后端 #c6c7c2 / AI #ffb4ab / Infra #ac897e / JavaScript #a8c8ff 等
