import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Timezone helpers  (Asia/Shanghai = UTC+8)
// ---------------------------------------------------------------------------

const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * Returns a Date object whose UTC instant corresponds to 00:00:00
 * Asia/Shanghai on the reference date (defaults to "now" in Shanghai).
 */
export function getShanghaiMidnight(date?: Date): Date {
  const ref = date ?? new Date();
  const utcMs = ref.getTime() + SHANGHAI_OFFSET_MS;
  const d = new Date(utcMs);
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() - SHANGHAI_OFFSET_MS);
}

/** Formats a Date as YYYY-MM-DD after converting to Asia/Shanghai. */
export function toDateKey(date: Date): string {
  const shanghaiMs = date.getTime() + SHANGHAI_OFFSET_MS;
  const d = new Date(shanghaiMs);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Subtracts `days` calendar days from a YYYY-MM-DD string. */
export function subtractDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - days);
  const yr = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, "0");
  const da = String(date.getUTCDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
}

/**
 * Walk backwards from `startDateKey` through `practiceDateSet`, counting
 * consecutive calendar days that appear in the set.
 */
export function countCurrentStreak(
  practiceDateSet: Set<string>,
  startDateKey: string,
): number {
  let streak = 0;
  let current = startDateKey;
  while (practiceDateSet.has(current)) {
    streak++;
    current = subtractDays(current, 1);
  }
  return streak;
}

/**
 * Finds the longest run of consecutive calendar days in the provided set.
 */
export function countLongestStreak(practiceDateSet: Set<string>): number {
  if (practiceDateSet.size === 0) return 0;

  const sorted = [...practiceDateSet].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const expected = subtractDays(sorted[i], 1);
    if (sorted[i - 1] === expected) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}

/**
 * 计算连续打卡数据（current / longest）。
 * 从 PracticeHistory 近一年的练习记录推导，不依赖 Streak 表的派生字段
 * （Streak 表仅记录每日快照，没有 currentStreak/longestStreak 列）。
 */
export async function computeStreakStats(userId?: string): Promise<{
  currentStreak: number;
  longestStreak: number;
}> {
  const todayMidnight = getShanghaiMidnight();
  const todayKey = toDateKey(todayMidnight);

  const oneYearAgo = new Date(todayMidnight);
  oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1);

  const practices = await prisma.practiceHistory.findMany({
    where: {
      ...(userId ? { userId } : {}),
      attemptedAt: { gte: oneYearAgo },
    },
    select: { attemptedAt: true },
  });

  const practiceDates = new Set(practices.map((p) => toDateKey(p.attemptedAt)));

  const yesterdayKey = subtractDays(todayKey, 1);
  const todayPracticed = practiceDates.has(todayKey);
  const streakStartKey = todayPracticed ? todayKey : yesterdayKey;
  const currentStreak = countCurrentStreak(practiceDates, streakStartKey);
  const longestStreak = countLongestStreak(practiceDates);

  return { currentStreak, longestStreak };
}
