import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const plans = await prisma.studyPlan.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      orderBy: { createdAt: "desc" },
      include: {
        days: {
          include: {
            items: true,
          },
        },
        progress: true,
      },
    });

    const result = plans.map((plan) => {
      const totalQuestions = plan.days.reduce(
        (sum, day) => sum + day.items.length,
        0
      );
      const completedCount = plan.progress.length;

      return {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        icon: plan.icon,
        totalDays: plan.totalDays,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        totalQuestions,
        completedCount,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/study-plans error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, totalDays } = body;

    if (!title || !totalDays) {
      return NextResponse.json(
        { error: "缺少必填字段: title, totalDays" },
        { status: 400 }
      );
    }

    if (typeof totalDays !== "number" || totalDays < 1) {
      return NextResponse.json(
        { error: "totalDays must be a positive integer" },
        { status: 400 }
      );
    }

    const plan = await prisma.studyPlan.create({
      data: {
        title,
        description: description ?? null,
        totalDays,
        days: {
          create: Array.from({ length: totalDays }, (_, i) => ({
            dayNumber: i + 1,
          })),
        },
      },
      include: {
        days: {
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("POST /api/study-plans error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
