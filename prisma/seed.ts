/**
 * 数据库种子脚本：为全新部署准备最小可用的内容
 *
 * 用法：pnpm prisma db seed（需先 pnpm prisma migrate deploy）
 *
 * 幂等：分类按 id upsert、题目按 title 去重、题集/学习路径存在即跳过。
 */
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../src/generated/prisma/client.js";

import { algorithmQuestions } from "../src/data/algorithm-questions.js";
import { algorithmQuestionsSupplement } from "../src/data/algorithm-questions-supplement.js";
import { algorithmQuestionsFinal } from "../src/data/algorithm-questions-batch3.js";
import { frontendQuestions } from "../src/data/frontend-questions.js";
import { backendQuestionsSupplement } from "../src/data/backend-questions-supplement.js";
import { backendQuestionsFinal } from "../src/data/backend-questions-batch3.js";
import { systemQuestions } from "../src/data/system-questions.js";
import { systemQuestionsSupplement } from "../src/data/system-questions-supplement.js";

interface SeedQuestion {
  title: string;
  content: string;
  solution?: string;
  codeTemplate?: Record<string, string>;
  difficulty: string;
  questionType: string;
  tags: string[];
}

// 数据文件 → 领域分类
const SOURCES: { name: string; domain: string; questions: SeedQuestion[] }[] = [
  { name: "算法题库", domain: "算法", questions: [...algorithmQuestions, ...algorithmQuestionsSupplement, ...algorithmQuestionsFinal] as unknown as SeedQuestion[] },
  { name: "前端题库", domain: "前端", questions: frontendQuestions as unknown as SeedQuestion[] },
  { name: "后端题库", domain: "Java", questions: [...backendQuestionsSupplement, ...backendQuestionsFinal] as unknown as SeedQuestion[] },
  { name: "系统设计题库", domain: "系统设计", questions: [...systemQuestions, ...systemQuestionsSupplement] as unknown as SeedQuestion[] },
];

const DOMAINS = ["前端", "Java", "Python", "算法", "系统设计", "计算机基础"];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    // ── 1. 域分类（题目可直接挂在 domain 上，与线上数据形态一致）──
    for (const name of DOMAINS) {
      await prisma.category.upsert({
        where: { id: `domain-${name}` },
        update: {},
        create: { id: `domain-${name}`, name, type: "domain" },
      });
    }
    console.log(`✔ 领域分类就绪（${DOMAINS.length} 个）`);

    // ── 2. 题目导入（按 title 去重）──
    let created = 0;
    let skipped = 0;
    for (const source of SOURCES) {
      for (const q of source.questions) {
        if (!q?.title || !q?.content) {
          skipped++;
          continue;
        }
        const exists = await prisma.question.findFirst({
          where: { title: q.title },
          select: { id: true },
        });
        if (exists) {
          skipped++;
          continue;
        }
        await prisma.question.create({
          data: {
            title: q.title,
            content: q.content,
            solution: q.solution ?? null,
            codeTemplate:
              q.questionType === "code" ? (q.codeTemplate as Prisma.InputJsonValue) ?? undefined : undefined,
            questionType: q.questionType ?? "qa",
            difficulty: q.difficulty ?? "medium",
            categoryId: `domain-${source.domain}`,
            // 去重：question_tags 有 (question_id, tag) 唯一约束，数据文件中存在重复 tag
            tags: q.tags?.length
              ? { create: [...new Set(q.tags)].slice(0, 8).map((tag) => ({ tag })) }
              : undefined,
          },
        });
        created++;
      }
    }
    console.log(`✔ 题目导入：新增 ${created}，跳过（重复/无效）${skipped}`);

    // ── 3. 示例精选题集 ──
    const setCount = await prisma.questionSet.count();
    if (setCount === 0) {
      const sample = await prisma.question.findMany({
        where: { difficulty: "medium", categoryId: "domain-算法" },
        select: { id: true },
        take: 20,
      });
      if (sample.length > 0) {
        await prisma.questionSet.create({
          data: {
            slug: "algorithm-interview-essentials",
            name: "算法面试精选 20 题",
            description: "高频中等难度算法题，覆盖数据结构与常见套路（系统预置）",
            isPublished: true,
            items: {
              create: sample.map((q, i) => ({
                questionId: q.id,
                sortOrder: i + 1,
              })),
            },
          },
        });
        console.log("✔ 示例题集已创建");
      }
    } else {
      console.log(`– 题集已存在（${setCount}），跳过`);
    }

    // ── 4. 示例学习路径 ──
    const pathCount = await prisma.learningPath.count();
    if (pathCount === 0) {
      const questions = await prisma.question.findMany({
        where: { categoryId: "domain-前端" },
        select: { id: true },
        take: 30,
      });
      if (questions.length > 0) {
        await prisma.learningPath.create({
          data: {
            title: "前端面试 15 天冲刺",
            description: "由系统预置的前端高频题学习路线：JS 核心 → CSS → 框架 → 工程化",
            icon: "🚀",
            durationDays: 15,
            difficultyLevel: "intermediate",
            category: "frontend",
            isPreset: true,
            items: {
              create: questions.map((q, i) => ({
                questionId: q.id,
                dayNumber: Math.floor(i / 2) + 1,
                sortOrder: i % 2,
              })),
            },
          },
        });
        console.log("✔ 示例学习路径已创建");
      }
    } else {
      console.log(`– 学习路径已存在（${pathCount}），跳过`);
    }

    const total = await prisma.question.count();
    console.log(`✔ 完成。当前题库总题量：${total}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
