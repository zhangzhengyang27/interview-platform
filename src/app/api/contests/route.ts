import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);

    const where: Record<string, unknown> = {};
    if (status && ["upcoming", "ongoing", "ended"].includes(status)) {
      where.status = status;
    }

    const [contests, total] = await Promise.all([
      prisma.contest.findMany({
        where,
        include: {
          _count: {
            select: {
              problems: true,
              submissions: true,
            },
          },
        },
        orderBy: { startTime: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contest.count({ where }),
    ]);

    return NextResponse.json({ contests, total, page, limit });
  } catch (error) {
    console.error("GET /api/contests error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 前台 CreateContestForm 也调用此接口，故用登录校验（非 admin 专属）
    const authError = await requireAuth();
    if (authError) return authError;

    const body = await request.json();
    const { title, description, startTime, duration, type, problemIds } = body;

    if (!title || !startTime || !duration || !problemIds || problemIds.length === 0) {
      return NextResponse.json(
        { error: "缺少必填字段: title, startTime, duration, problemIds" },
        { status: 400 }
      );
    }

    // 验证题目是否存在
    const questions = await prisma.question.findMany({
      where: { id: { in: problemIds } },
      select: { id: true },
    });

    if (questions.length !== problemIds.length) {
      return NextResponse.json(
        { error: "部分题目不存在，请检查题目ID" },
        { status: 400 }
      );
    }

    const contest = await prisma.contest.create({
      data: {
        title,
        description: description ?? null,
        startTime: new Date(startTime),
        duration: parseInt(duration),
        type: type ?? "weekly",
        problems: {
          create: problemIds.map((questionId: string, index: number) => ({
            questionId,
            orderBy: index + 1,
            score: 100,
          })),
        },
      },
      include: {
        problems: {
          include: {
            question: {
              select: { id: true, title: true, difficulty: true },
            },
          },
        },
      },
    });

    return NextResponse.json(contest, { status: 201 });
  } catch (error) {
    console.error("POST /api/contests error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
