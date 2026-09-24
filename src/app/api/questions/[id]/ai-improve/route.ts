import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateDeepSeekApiKey, callDeepSeek } from "@/lib/deepseek";

function buildImprovePrompt(
  title: string,
  content: string,
  solution: string | null,
  instruction: string
) {
  return `你是一位专业的技术面试题库优化专家。请根据用户指令优化以下面试题。

当前面试题信息：
- 标题：${title}
- 题目内容：${content}
- 参考答案：${solution ?? "（无参考答案）"}

用户优化指令：${instruction}

要求：
- 语言：中文
- 保持题目核心知识点不变，按用户指令进行优化
- 输出格式必须是严格的 JSON，不要包含任何其他内容，格式如下：
{
  "title": "优化后的题目名称",
  "content": "优化后的题目描述（Markdown格式）",
  "solution": "优化后的参考答案与解析（Markdown格式）"
}

请直接输出JSON，不要加任何前缀文字说明。`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const validation = validateDeepSeekApiKey();
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { instruction } = body;

    if (!instruction || typeof instruction !== "string" || instruction.trim() === "") {
      return NextResponse.json(
        { error: "instruction 不能为空" },
        { status: 400 }
      );
    }

    const question = await prisma.question.findUnique({
      where: { id },
      select: {
        title: true,
        content: true,
        solution: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "面试题不存在" },
        { status: 404 }
      );
    }

    const raw = await callDeepSeek(
      [
        {
          role: "user",
          content: buildImprovePrompt(
            question.title,
            question.content,
            question.solution,
            instruction.trim()
          ),
        },
      ],
      { temperature: 0.7, max_tokens: 4096 }
    );

    let parsed;
    try {
      const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", raw.slice(0, 200));
      return NextResponse.json(
        { error: "AI 返回结果解析失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      title: parsed.title ?? question.title,
      content: parsed.content ?? question.content,
      solution: parsed.solution ?? question.solution,
    });
  } catch (error) {
    console.error("POST /api/questions/[id]/ai-improve error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
