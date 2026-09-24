import { NextRequest, NextResponse } from "next/server";
import { getDueReviewQuestions } from "@/lib/review-scheduler";
import { requireAuth, getCurrentUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const stage = searchParams.get("stage");

    const stageFilter = stage !== null ? parseInt(stage, 10) : undefined;

    // 复习数据按用户隔离（此前为全站共享）
    const reviews = await getDueReviewQuestions(user!.id, limit, stageFilter);

    // 同时获取总数（不带 limit）
    const allReviews = await getDueReviewQuestions(user!.id, 1000, stageFilter);

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
