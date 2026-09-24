import { defineConfig } from "vitest/config";
import path from "path";

// Vitest 配置文件
export default defineConfig({
  test: {
    // 使用 jsdom 作为测试环境，以便测试 DOM 相关的代码（如 React 组件）
    environment: "jsdom",
    // 启用全局 API（describe, it, expect 等），无需在每个测试文件中手动导入
    globals: true,
    // 测试运行前加载的设置文件
    setupFiles: ["./src/test/setup.ts"],
    // 禁用 CSS 处理，提升测试速度
    css: false,
  },
  resolve: {
    // 配置路径别名，与 tsconfig.json 中的 paths 保持一致
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
