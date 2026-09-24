import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Get today's date string in YYYY-MM-DD format for Asia/Shanghai timezone.
 */
function getTodayStr(): string {
  const now = new Date();
  const shanghaiTime = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return shanghaiTime; // en-CA locale produces YYYY-MM-DD
}

/**
 * Compute a stable numeric seed from a date string.
 * Sums all char codes of the string to produce a positive integer.
 */
function dateSeed(dateStr: string): number {
  let sum = 0;
  for (let i = 0; i < dateStr.length; i++) {
    sum += dateStr.charCodeAt(i);
  }
  return sum;
}

export async function GET() {
  try {
    const todayStr = getTodayStr();
    const seed = dateSeed(todayStr);

    // Step 1: Query candidate questions with priority ordering
    // Priority 1: mastery === "unsolved"
    const unsolvedQuestions = await prisma.question.findMany({
      where: { mastery: "unsolved" },
      include: { tags: true, category: true },
    });

    let candidates = unsolvedQuestions;

    // Priority 2: mastery === "learning" if no unsolved
    if (candidates.length === 0) {
      candidates = await prisma.question.findMany({
        where: { mastery: "learning" },
        include: { tags: true, category: true },
      });
    }

    // Fallback: all questions if both empty
    if (candidates.length === 0) {
      candidates = await prisma.question.findMany({
        include: { tags: true, category: true },
      });
    }

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: "No questions available" },
        { status: 404 }
      );
    }

    // Step 2: Get categories used in the last 7 days from PracticeHistory
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentHistory = await prisma.practiceHistory.findMany({
      where: {
        attemptedAt: { gte: sevenDaysAgo },
      },
      include: {
        question: { select: { categoryId: true } },
      },
    });

    const recentCategoryIds = new Set(
      recentHistory
        .map((h) => h.question.categoryId)
        .filter((id): id is string => id !== null)
    );

    // Step 3: Prefer candidates NOT in recently-used categories
    const preferredCandidates = candidates.filter(
      (q) => !q.categoryId || !recentCategoryIds.has(q.categoryId)
    );

    const finalCandidates =
      preferredCandidates.length > 0 ? preferredCandidates : candidates;

    // Step 4: Deterministic selection using date seed
    const selected = finalCandidates[seed % finalCandidates.length];

    // Step 5: Build response
    const contentPreview =
      selected.content.length > 200
        ? selected.content.slice(0, 200) + "..."
        : selected.content;

    return NextResponse.json({
      id: selected.id,
      title: selected.title,
      contentPreview,
      difficulty: selected.difficulty,
      categoryName: selected.category?.name ?? null,
      tags: selected.tags.map((t) => ({ tag: t.tag })),
    });
  } catch (error) {
    console.error("GET /api/daily-question error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
