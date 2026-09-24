// design-tokens 工具函数的单元测试
import { describe, it, expect } from "vitest";
import {
  QUESTION_TYPE_COLORS,
  QUESTION_TYPE_LABELS,
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  DIFFICULTY_TOP_BORDER,
  TAG_COLORS,
  getTagColor,
  CODE_LANGUAGES,
} from "./design-tokens";

describe("QUESTION_TYPE_COLORS", () => {
  it("应当包含 code 和 qa 两种题型", () => {
    expect(QUESTION_TYPE_COLORS).toHaveProperty("code");
    expect(QUESTION_TYPE_COLORS).toHaveProperty("qa");
  });

  it("code 题型应当具有 bg 和 text 属性", () => {
    expect(QUESTION_TYPE_COLORS.code).toHaveProperty("bg");
    expect(QUESTION_TYPE_COLORS.code).toHaveProperty("text");
  });

  it("qa 题型应当具有 bg 和 text 属性", () => {
    expect(QUESTION_TYPE_COLORS.qa).toHaveProperty("bg");
    expect(QUESTION_TYPE_COLORS.qa).toHaveProperty("text");
  });
});

describe("QUESTION_TYPE_LABELS", () => {
  it("应当有 code 的中文标签", () => {
    expect(QUESTION_TYPE_LABELS.code).toBe("代码题");
  });

  it("应当有 qa 的中文标签", () => {
    expect(QUESTION_TYPE_LABELS.qa).toBe("问答题");
  });
});

describe("DIFFICULTY_COLORS", () => {
  it("应当包含 easy/medium/hard 三种难度", () => {
    expect(DIFFICULTY_COLORS).toHaveProperty("easy");
    expect(DIFFICULTY_COLORS).toHaveProperty("medium");
    expect(DIFFICULTY_COLORS).toHaveProperty("hard");
  });

  it("每种难度应当具有 bg/text/border 属性", () => {
    ["easy", "medium", "hard"].forEach((difficulty) => {
      const colors = DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS];
      expect(colors).toHaveProperty("bg");
      expect(colors).toHaveProperty("text");
      expect(colors).toHaveProperty("border");
    });
  });

  it("easy 难度应当使用 info 容器色", () => {
    expect(DIFFICULTY_COLORS.easy.bg).toContain("--info-container");
  });

  it("medium 难度应当使用 warning 容器色", () => {
    expect(DIFFICULTY_COLORS.medium.bg).toContain("--warning-container");
  });

  it("hard 难度应当使用 error 容器色", () => {
    expect(DIFFICULTY_COLORS.hard.bg).toContain("--error-container");
  });
});

describe("DIFFICULTY_LABELS", () => {
  it("应当有正确的中文标签", () => {
    expect(DIFFICULTY_LABELS.easy).toBe("简单");
    expect(DIFFICULTY_LABELS.medium).toBe("中等");
    expect(DIFFICULTY_LABELS.hard).toBe("困难");
  });
});

describe("DIFFICULTY_TOP_BORDER", () => {
  it("应当包含三种难度的边框颜色", () => {
    expect(DIFFICULTY_TOP_BORDER).toHaveProperty("easy");
    expect(DIFFICULTY_TOP_BORDER).toHaveProperty("medium");
    expect(DIFFICULTY_TOP_BORDER).toHaveProperty("hard");
  });

  it("边框颜色应当使用 CSS 变量", () => {
    Object.values(DIFFICULTY_TOP_BORDER).forEach((color) => {
      expect(color).toContain("var(--");
    });
  });
});

describe("TAG_COLORS", () => {
  it("应当包含预定义的标签颜色", () => {
    expect(TAG_COLORS).toHaveProperty("JavaScript");
    expect(TAG_COLORS).toHaveProperty("React");
    expect(TAG_COLORS).toHaveProperty("前端");
  });

  it("每个标签颜色应当具有 bg/text/border 属性", () => {
    Object.values(TAG_COLORS).forEach((colors) => {
      expect(colors).toHaveProperty("bg");
      expect(colors).toHaveProperty("text");
      expect(colors).toHaveProperty("border");
    });
  });
});

describe("getTagColor", () => {
  it("应当为已知标签返回对应颜色", () => {
    const result = getTagColor("JavaScript");
    expect(result).toEqual(TAG_COLORS["JavaScript"]);
  });

  it("应当为未知标签返回默认颜色", () => {
    const result = getTagColor("UnknownTag");
    expect(result).toEqual({
      bg: "var(--surface-high)",
      text: "var(--on-surface-variant)",
      border: "var(--surface-high)",
    });
  });

  it("应当为 React 标签返回 warning 颜色", () => {
    const result = getTagColor("React");
    expect(result.bg).toContain("--warning-container");
  });
});

describe("CODE_LANGUAGES", () => {
  it("应当包含常见编程语言", () => {
    const values = CODE_LANGUAGES.map((lang) => lang.value);
    expect(values).toContain("javascript");
    expect(values).toContain("typescript");
    expect(values).toContain("python");
    expect(values).toContain("java");
    expect(values).toContain("cpp");
    expect(values).toContain("sql");
  });

  it("每种语言应当具有 value 和 label", () => {
    CODE_LANGUAGES.forEach((lang) => {
      expect(lang).toHaveProperty("value");
      expect(lang).toHaveProperty("label");
      expect(typeof lang.value).toBe("string");
      expect(typeof lang.label).toBe("string");
    });
  });

  it("Python 标签应当显示版本信息", () => {
    const python = CODE_LANGUAGES.find((lang) => lang.value === "python");
    expect(python?.label).toBe("Python 3");
  });
});
