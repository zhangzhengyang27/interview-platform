import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const MAX_CONTENT_LENGTH = 20000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20") || 20));
    const sort = searchParams.get("sort") ?? "newest";

    const orderBy =
      sort === "most_upvotes"
        ? [{ isFeatured: "desc" as const }, { upvotes: "desc" as const }]
        : [{ isFeatured: "desc" as const }, { createdAt: "desc" as const }];

    const [solutions, total] = await Promise.all([
      prisma.solution.findMany({
        where: { questionId: id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.solution.count({
        where: { questionId: id },
      }),
    ]);

    return NextResponse.json({
      solutions,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("GET /api/questions/[id]/solutions error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 题解必须登录：此前匿名可发布且不写 userId，内容无法归属治理
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  const rl = rateLimit(`solution-post:${user!.id}`, 10, 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "发布过于频繁，请稍后再试" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { content, language } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "题解内容不能为空" },
        { status: 400 }
      );
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `题解内容过长，最多 ${MAX_CONTENT_LENGTH} 字符` },
        { status: 400 }
      );
    }

    // 验证题目是否存在
    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      return NextResponse.json({ error: "题目不存在" }, { status: 404 });
    }

    const solution = await prisma.solution.create({
      data: {
        questionId: id,
        content: content.trim(),
        language: language?.trim() || null,
        userId: user!.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(solution, { status: 201 });
  } catch (error) {
    console.error("POST /api/questions/[id]/solutions error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
