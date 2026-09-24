export const QUESTION_TYPE_COLORS = {
  code: { bg: "var(--info-container)", text: "var(--info-text)" },
  qa: { bg: "var(--warning-container)", text: "var(--warning-text)" },
} as const;

export const QUESTION_TYPE_LABELS = {
  code: "代码题",
  qa: "问答题",
} as const;

export const DIFFICULTY_COLORS = {
  easy: {
    bg: "var(--info-container)",
    text: "var(--info-text)",
    border: "var(--info-container)",
  },
  medium: {
    bg: "var(--warning-container)",
    text: "var(--warning-text)",
    border: "var(--warning-container)",
  },
  hard: {
    bg: "var(--error-container)",
    text: "var(--error)",
    border: "var(--error-container)",
  },
} as const;

export const DIFFICULTY_LABELS = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
} as const;

export const DIFFICULTY_TOP_BORDER = {
  easy: "var(--info-text)",
  medium: "var(--warning-text)",
  hard: "var(--error)",
} as const;

export const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  JavaScript: { bg: "var(--info-container)", text: "var(--info-text)", border: "var(--info-container)" },
  React: { bg: "var(--warning-container)", text: "var(--warning-text)", border: "var(--warning-container)" },
  SystemDesign: { bg: "var(--error-container)", text: "var(--error)", border: "var(--error-container)" },
  DataStructure: { bg: "var(--warning-container)", text: "var(--warning-text)", border: "var(--warning-container)" },
  前端: { bg: "var(--warning-container)", text: "var(--warning-text)", border: "var(--warning-container)" },
  后端: { bg: "var(--surface-high)", text: "var(--on-surface-variant)", border: "var(--surface-high)" },
  AI: { bg: "var(--error-container)", text: "var(--error)", border: "var(--error-container)" },
  Infra: { bg: "var(--surface-high)", text: "var(--on-surface-variant)", border: "var(--surface-high)" },
  Algorithm: { bg: "var(--warning-container)", text: "var(--warning-text)", border: "var(--warning-container)" },
  异步编程: { bg: "var(--info-container)", text: "var(--info-text)", border: "var(--info-container)" },
  架构设计: { bg: "var(--error-container)", text: "var(--error)", border: "var(--error-container)" },
  Redis: { bg: "var(--surface-high)", text: "var(--on-surface-variant)", border: "var(--surface-high)" },
  数组: { bg: "var(--info-container)", text: "var(--info-text)", border: "var(--info-container)" },
  双指针: { bg: "var(--info-container)", text: "var(--info-text)", border: "var(--info-container)" },
  排序: { bg: "var(--info-container)", text: "var(--info-text)", border: "var(--info-container)" },
};

export function getTagColor(tag: string): { bg: string; text: string; border: string } {
  return TAG_COLORS[tag] ?? { bg: "var(--surface-high)", text: "var(--on-surface-variant)", border: "var(--surface-high)" };
}

export const CODE_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python 3" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "sql", label: "SQL" },
] as const;
