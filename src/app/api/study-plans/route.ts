import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";
import { parseBody } from "@/lib/validate";
import { createStudyPlanSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  try {
    const search = request.nextUrl.searchParams.get("search")?.trim();
    // 学习计划是用户私有数据：只返回本人计划
    const plans = await prisma.studyPlan.findMany({
      where: {
        userId: user!.id,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        days: {
          include: {
            items: true,
          },
        },
        progress: {
          where: { userId: user!.id },
        },
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
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  try {
    const parsed = await parseBody(request, createStudyPlanSchema);
    if (!parsed.success) return parsed.response;
    const { title, description, totalDays } = parsed.data;

    const plan = await prisma.studyPlan.create({
      data: {
        title,
        description: description ?? null,
        totalDays,
        userId: user!.id,
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
