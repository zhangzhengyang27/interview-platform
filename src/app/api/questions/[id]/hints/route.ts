import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { validateDeepSeekApiKey, callDeepSeek } from "@/lib/deepseek";
import { parseBody } from "@/lib/validate";
import { z } from "zod";

export const dynamic = "force-dynamic";

const MAX_LEVEL = 3;

const getHintSchema = z.object({
  level: z.number().int().min(1).max(MAX_LEVEL),
});

// 每级的生成约束：越往后越接近答案，但任何一级都不直接亮出完整答案/代码
const LEVEL_RULES: Record<number, { name: string; instruction: string; maxTokens: number }> = {
  1: {
    name: "点拨",
    instruction:
      "用 1-2 句话点出这道题的关键概念或思考方向（比如应该想到哪个数据结构/角度），不要给出任何具体解题步骤。",
    maxTokens: 200,
  },
  2: {
    name: "思路框架",
    instruction:
      "给出解题思路的步骤框架（3-5 步，每步一句话），讲清楚「做什么」，但不要展开具体实现细节，不要写代码，不要给出最终答案。",
    maxTokens: 500,
  },
  3: {
    name: "详细思路",
    instruction:
      "详细讲解接近完整解法的思路：核心算法/论述逐段展开，包括关键细节、边界条件与易错点。如果是代码题，可以用一两行伪代码点出最难的部分，但不要给出完整可运行的代码。",
    maxTokens: 1000,
  },
};

// GET /api/questions/[id]/hints — 已生成的提示列表（按题共享，无需登录）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hints = await prisma.questionHint.findMany({
      where: { questionId: id },
      orderBy: { level: "asc" },
      select: { level: true, content: true, createdAt: true },
    });
    return NextResponse.json({ hints });
  } catch (error) {
    console.error("GET /api/questions/[id]/hints error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// POST /api/questions/[id]/hints — 获取指定级别的提示（已有则复用，否则 AI 生成）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  const rl = rateLimit(`hints:${user!.id}`, 10, 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  const parsed = await parseBody(request, getHintSchema);
  if (!parsed.success) return parsed.response;
  const { level } = parsed.data;

  try {
    const { id: questionId } = await params;

    // 已有提示直接复用（AI 只为每道题的每一级支付一次成本）
    const existing = await prisma.questionHint.findUnique({
      where: { questionId_level: { questionId, level } },
    });
    if (existing) {
      return NextResponse.json({ level, content: existing.content, cached: true });
    }

    const validation = validateDeepSeekApiKey();
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 503 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { title: true, content: true, solution: true, questionType: true },
    });
    if (!question) {
      return NextResponse.json({ error: "题目不存在" }, { status: 404 });
    }

    const rule = LEVEL_RULES[level];
    const systemPrompt =
      "你是一位耐心的技术面试教练。用户正在练习一道面试题，卡住后希望获得「渐进式提示」" +
      "—— 由浅入深的引导，而不是直接看到答案。请严格按当前级别的要求输出，用中文，" +
      "输出纯正文（Markdown 可用），不要重复题目，不要说「以下是提示」之类的开场白。";

    const userPrompt = `# 题目（${question.questionType === "code" ? "代码题" : "问答题"}）
## ${question.title}

${question.content.slice(0, 3000)}

# 参考答案（仅供你把握方向，绝不能直接透露）
${question.solution?.slice(0, 2500) ?? "（无参考答案）"}

# 当前提示级别：第 ${level} 级（${rule.name}）
${rule.instruction}`;

    const content = await callDeepSeek(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.6, max_tokens: rule.maxTokens }
    );

    if (!content.trim()) {
      return NextResponse.json({ error: "AI 未返回有效内容，请重试" }, { status: 502 });
    }

    // 写入缓存；并发下唯一键冲突说明别人刚生成过，回读即可
    try {
      await prisma.questionHint.create({
        data: { questionId, level, content: content.trim() },
      });
    } catch {
      const cached = await prisma.questionHint.findUnique({
        where: { questionId_level: { questionId, level } },
      });
      if (cached) {
        return NextResponse.json({ level, content: cached.content, cached: true });
      }
    }

    return NextResponse.json({ level, content: content.trim(), cached: false });
  } catch (error) {
    console.error("POST /api/questions/[id]/hints error:", error);
    return NextResponse.json({ error: "提示生成失败，请稍后重试" }, { status: 500 });
  }
}
