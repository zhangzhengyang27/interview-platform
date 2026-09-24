export const PAGE_SIZE = 20;

// Language groups matching 面试鸭's structure
export const LANGUAGE_GROUPS = [
  { id: "all", label: "全部", icon: "🌐" },
  { id: "java", label: "Java", icon: "☕" },
  { id: "frontend", label: "前端", icon: "🎨" },
  { id: "python", label: "Python", icon: "🐍" },
  { id: "database", label: "数据库", icon: "🗄️" },
  { id: "algorithm", label: "算法与数据结构", icon: "🧩" },
  { id: "cs", label: "计算机基础", icon: "💻" },
  { id: "system", label: "系统设计", icon: "🏗️" },
  { id: "softskill", label: "软技能", icon: "🤝" }
];

// Map category IDs to language groups — covers all categories in the database
export const CATEGORY_TO_LANG: Record<string, string> = {
  // === 旧 ID（兼容） ===
  // JavaScript / TS / Frameworks → 前端
  javascript: "frontend",
  typescript: "frontend",
  react: "frontend",
  vue: "frontend",
  nodejs: "frontend",
  "4ffec43a-2f19-4ad8-b51d-51704d205493": "frontend",
  // Java
  java: "java",
  "cat-java-core": "java",
  "cat-spring-eco": "java",
  "cat-java-network": "java",
  "cat-java-utils": "java",
  // 前端
  "frontend-build": "frontend",
  "f0e51ac5-6dad-4213-a725-5d4e788a913f": "frontend",
  "7a6263a6-c7ff-4cd2-9094-ff9caadfc2e9": "frontend",
  "aa0c6c5f-8605-4c33-a613-b606782f05cc": "frontend",
  "a9d9e569-78f6-419a-a334-81f70582e544": "frontend",
  "9b2d9900-1464-46a0-a8fd-ef7acb4e3a58": "frontend",
  "df52ba27-ff15-4ae9-b8bc-128b652a699c": "frontend",
  "c9d0e68e-9397-445b-8248-2b71047a932e": "frontend",
  "9fe31395-7273-4899-a1c0-66daf98e1961": "frontend",
  // Python
  python: "python",
  // Go
  go: "go",
  // 数据库
  mysql: "database",
  redis: "database",
  "cat-cache": "database",
  "cat-db-advanced": "database",
  // 计算机基础
  network: "cs",
  os: "cs",
  algorithm: "cs",
  "cat-cs-basics": "cs",
  "c8fc153f-d48c-421c-811a-63f81f2214f5": "cs",
  // 系统设计 / 架构
  "system-design": "system",
  "ai-llm": "system",
  "cat-distributed": "system",
  "cat-arch-design": "system",
  "cat-mq": "system",
  "cat-ops": "system",
  "cat-dev-tools": "system",
  // C++
  // 其他实战分类 → Java
  "0b73b900-76ff-4b55-aa81-8ba3e036adab": "java",
  "b6876f7e-1077-4c83-a81f-c9f2e212293c": "java",
  "a64f199d-1908-4661-9714-fa4d612ef7a8": "java",
  "ecb7c6db-5ba5-4d85-bc2d-0c1cc9a0faed": "java",
  "ab8bb27b-f648-4e80-8a09-d38edb99efc2": "java",
  "7fd3ae9b-ba67-4bf1-803b-d84817aefc9c": "java",
  "1039cc54-7597-4784-9509-ba4bd16439b0": "java",

  // === 新 seed-classify.ts ID ===
  // Java domain
  "domain-Java": "java",
  "sub-Java-Java 基础": "java",
  "sub-Java-并发编程": "java",
  "sub-Java-JVM": "java",
  "sub-Java-Spring 框架": "java",
  "sub-Java-微服务与分布式": "java",
  "sub-Java-中间件": "java",
  // Java topics
  "topic-Java-Java 基础-集合框架": "java",
  "topic-Java-Java 基础-异常处理": "java",
  "topic-Java-Java 基础-字符串": "java",
  "topic-Java-Java 基础-IO 与 NIO": "java",
  "topic-Java-Java 基础-面向对象": "java",
  "topic-Java-Java 基础-反射与代理": "java",
  "topic-Java-Java 基础-类型与装箱": "java",
  "topic-Java-Java 基础-引用类型": "java",
  "topic-Java-Java 基础-设计模式": "java",
  "topic-Java-并发编程-锁机制": "java",
  "topic-Java-并发编程-线程与线程池": "java",
  "topic-Java-并发编程-并发工具类": "java",
  "topic-Java-并发编程-CAS 与原子类": "java",
  "topic-Java-并发编程-死锁与诊断": "java",
  "topic-Java-并发编程-Java 内存模型": "java",
  "topic-Java-JVM-内存区域": "java",
  "topic-Java-JVM-垃圾回收": "java",
  "topic-Java-JVM-类加载机制": "java",
  "topic-Java-JVM-字节码与动态生成": "java",
  "topic-Java-JVM-性能调优": "java",
  "topic-Java-Spring 框架-IoC 与 AOP": "java",
  "topic-Java-Spring 框架-Bean 管理": "java",
  "topic-Java-Spring 框架-事务管理": "java",
  "topic-Java-Spring 框架-Spring Boot": "java",
  "topic-Java-Spring 框架-Spring MVC": "java",
  "topic-Java-Spring 框架-安全与认证": "java",
  "topic-Java-微服务与分布式-分布式理论": "java",
  "topic-Java-微服务与分布式-服务治理": "java",
  "topic-Java-微服务与分布式-分布式 ID": "java",
  "topic-Java-中间件-消息队列": "java",
  "topic-Java-中间件-Redis 缓存": "java",

  // 数据库 domain
  "domain-数据库": "database",
  "sub-数据库-MySQL": "database",
  "topic-数据库-MySQL-索引原理": "database",
  "topic-数据库-MySQL-事务与锁": "database",
  "topic-数据库-MySQL-SQL 优化": "database",

  // 前端 domain
  "domain-前端": "frontend",
  "sub-前端-JavaScript": "frontend",
  "sub-前端-CSS": "frontend",
  "sub-前端-HTML与DOM": "frontend",
  "sub-前端-React": "frontend",
  "sub-前端-Vue": "frontend",
  "sub-前端-浏览器与网络": "frontend",
  "sub-前端-工程化": "frontend",
  // JavaScript topics
  "topic-前端-JavaScript-语言基础": "frontend",
  "topic-前端-JavaScript-原型与继承": "frontend",
  "topic-前端-JavaScript-闭包与作用域": "frontend",
  "topic-前端-JavaScript-异步编程": "frontend",
  "topic-前端-JavaScript-ES6+ 新特性": "frontend",
  // CSS topics
  "topic-前端-CSS-盒模型与布局": "frontend",
  "topic-前端-CSS-选择器": "frontend",
  "topic-前端-CSS-响应式与移动端": "frontend",
  // HTML topics
  "topic-前端-HTML与DOM-HTML基础": "frontend",
  "topic-前端-HTML与DOM-DOM与事件": "frontend",
  "topic-前端-HTML与DOM-图形与可视化": "frontend",
  "topic-前端-HTML与DOM-小程序": "frontend",
  // React topics
  "topic-前端-React-Hooks": "frontend",
  "topic-前端-React-状态管理": "frontend",
  "topic-前端-React-渲染与 SSR": "frontend",
  "topic-前端-React-性能优化": "frontend",
  // Vue topics
  "topic-前端-Vue-响应式原理": "frontend",
  "topic-前端-Vue-Composition API": "frontend",
  "topic-前端-Vue-组件与指令": "frontend",
  // 浏览器 topics
  "topic-前端-浏览器与网络-浏览器原理": "frontend",
  "topic-前端-浏览器与网络-HTTP 协议": "frontend",
  "topic-前端-浏览器与网络-前端安全": "frontend",
  // 工程化 topics
  "topic-前端-工程化-构建工具": "frontend",
  "topic-前端-工程化-TypeScript": "frontend",
  "topic-前端-工程化-包管理与工程化": "frontend",
  "topic-前端-工程化-测试": "frontend",

  // Python domain
  "domain-Python": "python",
  "sub-Python-Python 核心": "python",
  "sub-Python-数据分析与 AI": "python",
  "topic-Python-Python 核心-GIL 与并发": "python",
  "topic-Python-Python 核心-语言特性": "python",
  "topic-Python-数据分析与 AI-数据处理": "python",
  "topic-Python-数据分析与 AI-机器学习": "python",

  // 算法与数据结构 domain
  "domain-算法与数据结构": "algorithm",
  "sub-算法与数据结构-算法基础": "algorithm",
  "sub-算法与数据结构-数据结构": "algorithm",
  "sub-算法与数据结构-高级算法": "algorithm",
  "topic-算法与数据结构-算法基础-复杂度分析": "algorithm",
  "topic-算法与数据结构-算法基础-排序算法": "algorithm",
  "topic-算法与数据结构-算法基础-搜索算法": "algorithm",
  "topic-算法与数据结构-数据结构-线性结构": "algorithm",
  "topic-算法与数据结构-数据结构-树与二叉树": "algorithm",
  "topic-算法与数据结构-数据结构-图": "algorithm",
  "topic-算法与数据结构-数据结构-哈希表与堆": "algorithm",
  "topic-算法与数据结构-高级算法-动态规划": "algorithm",
  "topic-算法与数据结构-高级算法-贪心与回溯": "algorithm",

  // 系统设计 domain
  "domain-系统设计": "system",
  "sub-系统设计-系统架构设计": "system",
  "sub-系统设计-手写代码": "system",
  "topic-系统设计-系统架构设计-经典系统设计": "system",
  "topic-系统设计-系统架构设计-基础设施": "system",
  "topic-系统设计-手写代码-手写数据结构": "system",
  "topic-系统设计-手写代码-手写设计模式": "system",

  // 计算机基础 domain
  "domain-计算机基础": "cs",
  "sub-计算机基础-操作系统": "cs",
  "sub-计算机基础-计算机网络": "cs",
  "topic-计算机基础-操作系统-进程与线程": "cs",
  "topic-计算机基础-操作系统-内存管理": "cs",
  "topic-计算机基础-操作系统-进程调度": "cs",
  "topic-计算机基础-计算机网络-TCP/IP": "cs",
  "topic-计算机基础-计算机网络-HTTP 协议": "cs",
  "topic-计算机基础-计算机网络-DNS": "cs",

  // 软技能 domain
  "domain-软技能": "softskill"
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难"
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  qa: "问答",
  code: "代码"
};

export const JOB_ROLE_OPTIONS = [
  { value: "", label: "全部方向" },
  { value: "java", label: "Java" },
  { value: "python", label: "Python" },
  { value: "backend", label: "后端" },
  { value: "frontend", label: "前端" },
  { value: "algorithm", label: "算法" },
  { value: "system-design", label: "系统设计" },
  { value: "general", label: "通用" }
];

export const DIFFICULTY_OPTIONS = [
  { value: "", label: "全部难度" },
  { value: "easy", label: "简单" },
  { value: "medium", label: "中等" },
  { value: "hard", label: "困难" }
];

export const QUESTION_TYPE_OPTIONS = [
  { value: "", label: "全部题型" },
  { value: "qa", label: "问答" },
  { value: "code", label: "代码" }
];

export interface DbQuestion {
  id: string;
  title: string;
  content: string;
  questionType: string;
  difficulty: string;
  mastery: string;
  isBookmarked: boolean;
  company: string | null;
  categoryId: string | null;
  viewCount: number;
  tags: { tag: string }[];
}

export interface CategoryWithCount {
  id: string;
  name: string;
  type: string;
  description: string | null;
  sortOrder?: number;
  parentId?: string | null;
  questionCount: number;
}

export interface QuestionBank {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  type?: string;
}

export interface CategoriesResponse {
  categories: CategoryWithCount[];
  total: number;
}

export interface QuestionsResponse {
  questions: DbQuestion[];
  total: number;
}
