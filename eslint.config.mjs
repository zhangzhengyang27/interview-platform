import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 数据生成脚本（非业务代码，使用 require()）
    "scripts/**",
    // 跳过类型检查的超大数据文件
    "src/data/backend-questions-supplement.ts",
  ]),
  // set-state-in-effect 关闭：
  // 项目中大量 useEffect 内调用 setState（数据获取、loading 状态切换等），
  // 这是 React 客户端组件的标准模式。React 19 推荐用 RSC 替代，
  // 但全量重构为 RSC 不现实，因此关闭此规则。
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // no-img-element 关闭：
  // 项目所有 <img> 均为动态外部用户头像（GitHub OAuth / 阿里云 OSS 上传图），
  // 域名不可枚举，next/image 优化不适用且配置成本高、有运行时风险。
  // 头像已为小图，原生 <img> 为合理选择。
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  // 错误边界组件不能使用 <Link>（可能连 next/link 都无法加载）
  {
    files: ["src/app/error.tsx", "src/app/global-error.tsx"],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);

export default eslintConfig;
