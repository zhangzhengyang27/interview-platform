import { describe, it, expect } from "vitest";
import { buildCategoryLabels } from "../category-utils";

describe("buildCategoryLabels", () => {
  it("无重名时直接用名称", () => {
    const labels = buildCategoryLabels([
      { id: "a", name: "前端", parentId: null },
      { id: "b", name: "Java", parentId: null },
    ]);
    expect(labels).toEqual({ a: "前端", b: "Java" });
  });

  it("重名时用父级路径区分", () => {
    const labels = buildCategoryLabels([
      { id: "fe", name: "前端", parentId: null },
      { id: "fe-js", name: "JavaScript", parentId: "fe" },
      { id: "be", name: "后端", parentId: null },
      { id: "be-js", name: "JavaScript", parentId: "be" },
    ]);
    expect(labels["fe-js"]).toBe("前端 > JavaScript");
    expect(labels["be-js"]).toBe("后端 > JavaScript");
    expect(labels["fe"]).toBe("前端");
  });

  it("路径层级有防死循环保护", () => {
    // 人为构造环：a -> b -> a
    const labels = buildCategoryLabels([
      { id: "a", name: "环A", parentId: "b" },
      { id: "b", name: "环B", parentId: "a" },
    ]);
    expect(Object.keys(labels)).toHaveLength(2);
  });
});
