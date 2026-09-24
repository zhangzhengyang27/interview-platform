import { describe, it, expect, vi } from "vitest";

// Mock prisma 和 code-runner，因为 wrapCode 是纯函数但文件顶部导入了这些模块
vi.mock("@/lib/prisma", () => ({
  prisma: {
    question: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/code-runner", () => ({
  runCode: vi.fn(),
}));

import { wrapCode } from "../judge";

describe("wrapCode", () => {
  describe("JavaScript", () => {
    it("应在用户代码后注入 runner 代码", () => {
      const userCode = "function twoSum(nums, target) { return [0, 1]; }";
      const wrapped = wrapCode(userCode, "javascript");
      expect(wrapped).toContain(userCode);
      expect(wrapped).toContain("Auto-generated runner");
      expect(wrapped).toContain("JSON.stringify");
      expect(wrapped).toContain("require('fs')");
    });

    it("应支持箭头函数变量声明", () => {
      const userCode = "const twoSum = (nums, target) => [0, 1];";
      const wrapped = wrapCode(userCode, "javascript");
      expect(wrapped).toContain(userCode);
      expect(wrapped).toContain("Auto-generated runner");
    });
  });

  describe("Python", () => {
    it("应在用户代码后注入 Python runner", () => {
      const userCode = "class Solution:\n    def solve(self, x):\n        return x";
      const wrapped = wrapCode(userCode, "python");
      expect(wrapped).toContain(userCode);
      expect(wrapped).toContain("import sys, json");
      expect(wrapped).toContain("Solution()");
      expect(wrapped).toContain("json.dumps");
    });
  });

  describe("Java", () => {
    it("用户代码已包含 main 方法时应直接返回", () => {
      const userCode = "public class Main { public static void main(String[] args) { System.out.println(\"hi\"); } }";
      const wrapped = wrapCode(userCode, "java");
      expect(wrapped).toBe(userCode);
    });

    it("用户代码无 main 方法时应注入 wrapper", () => {
      const userCode = "class Solution { public int solve(int x) { return x; } }";
      const wrapped = wrapCode(userCode, "java");
      expect(wrapped).toContain(userCode);
      expect(wrapped).toContain("class Main");
      expect(wrapped).toContain("public static void main");
    });
  });

  describe("C++", () => {
    it("用户代码已包含 int main 时应直接返回", () => {
      const userCode = "#include <iostream>\nint main() { std::cout << \"hi\"; return 0; }";
      const wrapped = wrapCode(userCode, "cpp");
      expect(wrapped).toBe(userCode);
    });

    it("用户代码无 main 时应注入 wrapper", () => {
      const userCode = "int solve(int x) { return x; }";
      const wrapped = wrapCode(userCode, "cpp");
      expect(wrapped).toContain(userCode);
      expect(wrapped).toContain("int main()");
      expect(wrapped).toContain("#include <bits/stdc++.h>");
    });
  });

  describe("未知语言", () => {
    it("应直接返回用户代码", () => {
      const userCode = "print('hello')";
      const wrapped = wrapCode(userCode, "ruby");
      expect(wrapped).toBe(userCode);
    });
  });
});
