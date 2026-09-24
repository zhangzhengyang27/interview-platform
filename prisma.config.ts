// Prisma 7 配置（CLI 由此文件驱动：migrate / db seed / studio 等）
// 注：Prisma 7 起 seed 命令在 migrations.seed 配置（package.json 的 prisma 块已废弃）
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
