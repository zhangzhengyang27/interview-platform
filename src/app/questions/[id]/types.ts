export type QuestionType = "code" | "qa";
export type CodeTab = "editor" | "solution" | "user_solutions" | "discussion";
export type QaTab = "answer" | "user_solutions" | "interview" | "discussion";
export type ActiveTab = CodeTab | QaTab;

export interface DbQuestion {
  id: string;
  title: string;
  content: string;
  solution: string | null;
  answer: boolean | null;
  codeTemplate: Record<string, string> | null;
  questionType: QuestionType;
  difficulty: string;
  mastery: string;
  isBookmarked: boolean;
  company: string | null;
  tags: { tag: string }[];
  comments: Comment[];
  practiceHistory: { status: string; durationSeconds: number | null; attemptedAt: string }[];
}

export interface DbQuestionList {
  id: string;
  title: string;
  difficulty: string;
  questionType: QuestionType;
  tags: { tag: string }[];
}

export interface Comment {
  id: string;
  content: string;
  author: string | null;
  upvotes: number;
  createdAt: string;
}

export interface SolutionUser {
  id: string;
  name: string | null;
  image: string | null;
}

export interface Solution {
  id: string;
  content: string;
  language: string | null;
  upvotes: number;
  isFeatured: boolean;
  createdAt: string;
  user: SolutionUser | null;
}

export type SolutionView = "list" | "detail" | "editor";

export interface EvalDimension {
  score: number;
  comment: string;
}

export interface EvalResult {
  overallScore: number;
  dimensions: {
    accuracy: EvalDimension;
    completeness: EvalDimension;
    clarity: EvalDimension;
    depth: EvalDimension;
  };
  missedPoints: string[];
  strengths: string[];
  suggestions: string[];
  overallComment: string;
}

export const CODE_TABS: { key: CodeTab; label: string }[] = [
  { key: "editor", label: "代码编辑器" },
  { key: "solution", label: "答案解析" },
  { key: "user_solutions", label: "用户题解" },
  { key: "discussion", label: "回答讨论" },
];

export const QA_TABS: { key: QaTab; label: string }[] = [
  { key: "answer", label: "推荐答案" },
  { key: "user_solutions", label: "用户题解" },
  { key: "interview", label: "开始面试" },
  { key: "discussion", label: "回答讨论" },
];

// 代码编辑器支持的语言（value 与 CodeMirror / 判题后端约定一致）
export const LANGUAGES: { value: string; label: string }[] = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python 3" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];
