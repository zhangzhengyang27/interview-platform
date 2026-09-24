import { NextRequest, NextResponse } from "next/server";
import { getQuestionReviewSchedule } from "@/lib/review-scheduler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json(
        { error: "缺少 questionId 参数" },
        { status: 400 }
      );
    }

    const schedule = await getQuestionReviewSchedule(questionId);

    if (!schedule) {
      return NextResponse.json(
        { error: "题目不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      questionId: schedule.questionId,
      title: schedule.title,
      stages: schedule.stages.map((s) => ({
        stage: s.stage,
        intervalDays: s.intervalDays,
        scheduledAt: s.scheduledAt?.toISOString() ?? null,
        completedAt: s.completedAt?.toISOString() ?? null,
        isDue: s.isDue,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch review schedule:", error);
    return NextResponse.json(
      { error: "获取复习计划失败" },
      { status: 500 }
    );
  }
}
