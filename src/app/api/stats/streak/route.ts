import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  getShanghaiMidnight,
  toDateKey,
  subtractDays,
  countCurrentStreak,
  countLongestStreak,
} from "@/lib/streak";

// ---------------------------------------------------------------------------
// GET  /api/stats/streak
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const userId = session.user.id;

    const todayMidnight = getShanghaiMidnight();
    const todayKey = toDateKey(todayMidnight);

    // 1. Fetch all practice timestamps from the last 365 days for the current user.
    const oneYearAgo = new Date(todayMidnight);
    oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1);

    const practices = await prisma.practiceHistory.findMany({
      where: { userId, attemptedAt: { gte: oneYearAgo } },
      select: { attemptedAt: true },
    });

    // 2. Build a Set of distinct practice date keys (Shanghai timezone).
    const practiceDates = new Set(practices.map((p) => toDateKey(p.attemptedAt)));

    // 3. Current streak: start from today if practiced, else yesterday.
    const yesterdayKey = subtractDays(todayKey, 1);
    const todayPracticed = practiceDates.has(todayKey);
    const streakStartKey = todayPracticed ? todayKey : yesterdayKey;
    const currentStreak = countCurrentStreak(practiceDates, streakStartKey);

    // 4. Longest streak across the full window.
    const longestStreak = countLongestStreak(practiceDates);

    // 5. Today's practice count and goal evaluation.
    const todayPractices = practices.filter(
      (p) => toDateKey(p.attemptedAt) === todayKey,
    );
    const todayCount = todayPractices.length;

    // Look up today's Streak record for the user-configured dailyGoal.
    const existingStreak = await prisma.streak.findUnique({
      where: { date: todayMidnight },
    });
    const dailyGoal = existingStreak?.dailyGoal ?? 5;
    const goalMet = todayCount >= dailyGoal;

    // 6. Upsert today's Streak record with fresh numbers.
    await prisma.streak.upsert({
      where: { date: todayMidnight },
      update: { questionCount: todayCount, goalMet },
      create: {
        date: todayMidnight,
        questionCount: todayCount,
        dailyGoal,
        goalMet,
      },
    });

    return NextResponse.json({
      currentStreak,
      longestStreak,
      todayPracticed,
      todayCount,
      dailyGoal,
      goalMet,
    });
  } catch (error) {
    console.error("GET /api/stats/streak error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST  /api/stats/streak   —  update dailyGoal
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { dailyGoal } = body;

    if (dailyGoal === undefined || dailyGoal === null) {
      return NextResponse.json(
        { error: "缺少必填字段: dailyGoal" },
        { status: 400 },
      );
    }

    const parsedGoal = Number(dailyGoal);
    if (!Number.isInteger(parsedGoal) || parsedGoal < 1) {
      return NextResponse.json(
        { error: "dailyGoal must be a positive integer" },
        { status: 400 },
      );
    }

    const todayMidnight = getShanghaiMidnight();
    const todayKey = toDateKey(todayMidnight);

    // Count today's practices for the current user
    const todayPractices = await prisma.practiceHistory.count({
      where: { userId, attemptedAt: { gte: todayMidnight } },
    });
    const goalMet = todayPractices >= parsedGoal;

    const streak = await prisma.streak.upsert({
      where: { date: todayMidnight },
      update: { dailyGoal: parsedGoal, goalMet },
      create: {
        date: todayMidnight,
        questionCount: todayPractices,
        dailyGoal: parsedGoal,
        goalMet,
      },
    });

    return NextResponse.json({
      ...streak,
      todayKey,
    });
  } catch (error) {
    console.error("POST /api/stats/streak error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
