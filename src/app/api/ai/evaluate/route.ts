import { NextRequest, NextResponse } from "next/server";
import { validateDeepSeekApiKey, callDeepSeek } from "@/lib/deepseek";
import { requireAuth, getCurrentUser } from "@/lib/session";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

interface EvaluateRequest {
  questionTitle: string;
  questionContent: string;
  recommendedAnswer: string;
  userAnswer: string;
}

interface DimensionScore {
  score: number;
  comment: string;
}

interface EvaluationResult {
  overallScore: number;
  dimensions: {
    accuracy: DimensionScore;
    completeness: DimensionScore;
    clarity: DimensionScore;
    depth: DimensionScore;
  };
  missedPoints: string[];
  strengths: string[];
  suggestions: string[];
  overallComment: string;
}

const SYSTEM_PROMPT = `你是一位专业的技术面试评估专家。请对面试者的回答进行全面评估。

评估维度：
1. 准确性 (accuracy): 回答中的技术概念是否正确
2. 完整性 (completeness): 是否涵盖了推荐答案中的关键要点
3. 表达清晰度 (clarity): 回答是否条理清晰、逻辑通顺
4. 深度 (depth): 是否有深入的理解和独到见解

请严格按以下 JSON 格式返回评估结果：
{
  "overallScore": 7,
  "dimensions": {
    "accuracy": { "score": 8, "comment": "评价" },
    "completeness": { "score": 6, "comment": "评价" },
    "clarity": { "score": 7, "comment": "评价" },
    "depth": { "score": 7, "comment": "评价" }
  },
  "missedPoints": ["遗漏的关键点1", "遗漏的关键点2"],
  "strengths": ["回答中的亮点1"],
  "suggestions": ["改进建议1"],
  "overallComment": "总体评价"
}`;

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  const rl = rateLimit(`ai-evaluate:${user?.id}`, 20, 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "AI 请求过于频繁，请稍后再试" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  const validation = validateDeepSeekApiKey();
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 503 }
    );
  }

  try {
    const body: EvaluateRequest = await request.json();
    const { questionTitle, questionContent, recommendedAnswer, userAnswer } = body;

    // Validate required fields
    if (!questionTitle || !questionContent || !userAnswer) {
      return NextResponse.json(
        { error: "缺少必要参数：questionTitle、questionContent、userAnswer" },
        { status: 400 }
      );
    }

    // Build user message
    let userMessage = `## 题目\n**${questionTitle}**\n\n${questionContent}\n\n`;

    if (recommendedAnswer && recommendedAnswer.trim()) {
      userMessage += `## 推荐答案\n${recommendedAnswer}\n\n`;
    } else {
      userMessage += `## 推荐答案\n（无推荐答案，请根据题目要求自行评估）\n\n`;
    }

    userMessage += `## 面试者的回答\n${userAnswer}`;

    // Call DeepSeek API
    const content = await callDeepSeek(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      { temperature: 0.3 }
    );

    if (!content) {
      return NextResponse.json({ error: "DeepSeek 返回内容为空" }, { status: 500 });
    }

    // Parse JSON from response
    let evaluation: EvaluationResult;
    try {
      // Try to extract JSON from markdown code block if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1].trim();
      evaluation = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse DeepSeek response as JSON:", content);
      return NextResponse.json(
        { error: "DeepSeek 返回了无效的 JSON 格式" },
        { status: 500 }
      );
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("AI evaluate route error:", error);
    return NextResponse.json({ error: "服务端内部错误" }, { status: 500 });
  }
}
