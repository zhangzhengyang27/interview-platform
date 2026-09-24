import { NextRequest, NextResponse } from "next/server";
import { getDueReviewQuestions } from "@/lib/review-scheduler";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const stage = searchParams.get("stage");

    const stageFilter = stage !== null ? parseInt(stage, 10) : undefined;

    const reviews = await getDueReviewQuestions(
      undefined, // 单用户模式，暂不传 userId
      limit,
      stageFilter
    );

    // 同时获取总数（不带 limit）
    const allReviews = await getDueReviewQuestions(undefined, 1000, stageFilter);

    return NextResponse.json({
      dueCount: allReviews.length,
      reviews: reviews.map((r) => ({
        questionId: r.questionId,
        title: r.title,
        difficulty: r.difficulty,
        categoryName: r.categoryName,
        lastPracticedAt: r.lastPracticedAt.toISOString(),
        nextReviewAt: r.nextReviewAt.toISOString(),
        daysOverdue: r.daysOverdue,
        stage: r.stage,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch due reviews:", error);
    return NextResponse.json(
      { error: "获取待复习列表失败" },
      { status: 500 }
    );
  }
}
