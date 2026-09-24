// 题目类型元数据注册表 —— 题型相关的一切配置的唯一事实来源。
//
// 新增题型时只需在此注册，各页面（新建表单、详情 Tab、列表徽标）自动生效，
// 无需再在多个文件中散落修改 switch/三元分支。参考 jc-club 的策略模式思路收敛。

export type QuestionType = "qa" | "code" | "judge";
export type CodeTab = "editor" | "solution" | "user_solutions" | "discussion";
export type QaTab = "answer" | "user_solutions" | "interview" | "discussion";
export type ActiveTab = CodeTab | QaTab;

export interface QuestionTypeMeta {
  label: string;
  color: { bg: string; text: string };
  tabs: { key: ActiveTab; label: string }[];
  defaultTab: ActiveTab;
  /** 新建/编辑题目时是否需要「初始代码模板」与「测试用例」区段 */
  needsTemplate: boolean;
}

export const QUESTION_TYPE_META: Record<QuestionType, QuestionTypeMeta> = {
  qa: {
    label: "问答题",
    color: { bg: "var(--warning-container)", text: "var(--warning-text)" },
    tabs: [
      { key: "answer", label: "推荐答案" },
      { key: "user_solutions", label: "用户题解" },
      { key: "interview", label: "开始面试" },
      { key: "discussion", label: "回答讨论" },
    ],
    defaultTab: "answer",
    needsTemplate: false,
  },
  code: {
    label: "代码题",
    color: { bg: "var(--info-container)", text: "var(--info-text)" },
    tabs: [
      { key: "editor", label: "代码编辑器" },
      { key: "solution", label: "答案解析" },
      { key: "user_solutions", label: "用户题解" },
      { key: "discussion", label: "回答讨论" },
    ],
    defaultTab: "editor",
    needsTemplate: true,
  },
  judge: {
    label: "判断题",
    color: { bg: "var(--success-container)", text: "var(--success-text)" },
    tabs: [
      { key: "answer", label: "答案解析" },
      { key: "discussion", label: "回答讨论" },
    ],
    defaultTab: "answer",
    needsTemplate: false,
  },
};

/**
 * 兼容任意字符串（含 DB 历史脏值）。
 * 已知题型原样返回；未知值一律归一化为 qa。
 */
export function normalizeQuestionType(type: string | null | undefined): QuestionType {
  if (type === "code" || type === "judge") return type;
  return "qa";
}

export function getQuestionTypeMeta(type: string | null | undefined): QuestionTypeMeta {
  return QUESTION_TYPE_META[normalizeQuestionType(type)];
}
