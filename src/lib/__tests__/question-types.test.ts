import { describe, it, expect } from "vitest";
import {
  QUESTION_TYPE_META,
  normalizeQuestionType,
  getQuestionTypeMeta,
} from "../question-types";

describe("normalizeQuestionType", () => {
  it("已知题型原样返回", () => {
    expect(normalizeQuestionType("qa")).toBe("qa");
    expect(normalizeQuestionType("code")).toBe("code");
    expect(normalizeQuestionType("judge")).toBe("judge");
  });

  it("未知值与脏值一律归一化为 qa", () => {
    expect(normalizeQuestionType("unknown")).toBe("qa");
    expect(normalizeQuestionType("")).toBe("qa");
    expect(normalizeQuestionType(null)).toBe("qa");
    expect(normalizeQuestionType(undefined)).toBe("qa");
  });
});

describe("getQuestionTypeMeta / 注册表一致性", () => {
  it("每种题型的 defaultTab 必须在自己的 tabs 里", () => {
    for (const [key, meta] of Object.entries(QUESTION_TYPE_META)) {
      expect(
        meta.tabs.some((t) => t.key === meta.defaultTab),
        `${key} 的 defaultTab 不在 tabs 中`
      ).toBe(true);
    }
  });

  it("code 题型需要模板，其他不需要", () => {
    expect(QUESTION_TYPE_META.code.needsTemplate).toBe(true);
    expect(QUESTION_TYPE_META.qa.needsTemplate).toBe(false);
    expect(QUESTION_TYPE_META.judge.needsTemplate).toBe(false);
  });

  it("getQuestionTypeMeta 对脏值返回 qa 的元数据", () => {
    expect(getQuestionTypeMeta("nonsense")).toBe(QUESTION_TYPE_META.qa);
  });
});
