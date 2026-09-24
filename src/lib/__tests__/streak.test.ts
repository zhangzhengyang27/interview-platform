import { describe, it, expect } from "vitest";
import {
  getShanghaiMidnight,
  toDateKey,
  subtractDays,
  countCurrentStreak,
  countLongestStreak,
} from "../streak";

describe("streak 日期工具函数", () => {
  describe("getShanghaiMidnight", () => {
    it("应返回上海时区当天 00:00 的 UTC 时间", () => {
      const result = getShanghaiMidnight();
      // 上海时区 UTC+8，所以上海 00:00 = UTC 前一天 16:00
      expect(result.getUTCHours()).toBe(16);
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCSeconds()).toBe(0);
    });

    it("返回的时间应不晚于当前时间", () => {
      const result = getShanghaiMidnight();
      expect(result.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("接受可选的 date 参数", () => {
      const input = new Date(Date.UTC(2026, 7, 25, 10, 0, 0));
      const result = getShanghaiMidnight(input);
      // 2026-08-25 10:00 UTC = 2026-08-25 18:00 上海
      // 上海当天 00:00 = 2026-08-24 16:00 UTC
      expect(result.getUTCDate()).toBe(24);
      expect(result.getUTCHours()).toBe(16);
    });
  });

  describe("toDateKey", () => {
    it("应将 Date 转换为 YYYY-MM-DD 格式（上海时区）", () => {
      // 2026-08-25 16:00 UTC = 2026-08-26 00:00 上海
      const date = new Date(Date.UTC(2026, 7, 25, 16, 0, 0));
      const key = toDateKey(date);
      expect(key).toBe("2026-08-26");
    });

    it("格式应为 YYYY-MM-DD", () => {
      const key = toDateKey(new Date());
      expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("subtractDays", () => {
    it("应返回减去指定天数后的日期字符串", () => {
      const result = subtractDays("2026-08-25", 5);
      expect(result).toBe("2026-08-20");
    });

    it("减去 0 天应返回相同日期", () => {
      expect(subtractDays("2026-08-25", 0)).toBe("2026-08-25");
    });

    it("应能跨月计算", () => {
      expect(subtractDays("2026-08-01", 2)).toBe("2026-07-30");
    });

    it("应能跨年计算", () => {
      expect(subtractDays("2026-01-01", 1)).toBe("2025-12-31");
    });
  });
});

describe("streak 计算函数", () => {
  describe("countCurrentStreak", () => {
    it("今天有练习时应返回至少 1", () => {
      const todayKey = toDateKey(new Date());
      const dates = new Set([todayKey]);
      expect(countCurrentStreak(dates, todayKey)).toBe(1);
    });

    it("空 Set 应返回 0", () => {
      const todayKey = toDateKey(new Date());
      expect(countCurrentStreak(new Set(), todayKey)).toBe(0);
    });

    it("连续多天练习应返回连续天数", () => {
      const todayKey = "2026-08-25";
      const dates = new Set(["2026-08-25", "2026-08-24", "2026-08-23"]);
      expect(countCurrentStreak(dates, todayKey)).toBe(3);
    });

    it("有间隔时应只计算最近的连续段", () => {
      const todayKey = "2026-08-25";
      // 25, 24 连续，22 有间隔
      const dates = new Set(["2026-08-25", "2026-08-24", "2026-08-22"]);
      expect(countCurrentStreak(dates, todayKey)).toBe(2);
    });

    it("今天没练习时应返回 0", () => {
      const todayKey = "2026-08-25";
      const dates = new Set(["2026-08-24", "2026-08-23"]);
      expect(countCurrentStreak(dates, todayKey)).toBe(0);
    });
  });

  describe("countLongestStreak", () => {
    it("空 Set 应返回 0", () => {
      expect(countLongestStreak(new Set())).toBe(0);
    });

    it("单个日期应返回 1", () => {
      expect(countLongestStreak(new Set(["2026-08-25"]))).toBe(1);
    });

    it("应返回最长的连续段", () => {
      // 连续段1: 3天 (25,24,23)
      // 连续段2: 4天 (20,19,18,17)
      const dates = new Set([
        "2026-08-25", "2026-08-24", "2026-08-23",
        "2026-08-20", "2026-08-19", "2026-08-18", "2026-08-17",
      ]);
      expect(countLongestStreak(dates)).toBe(4);
    });

    it("所有日期连续时应返回总天数", () => {
      const dates = new Set([
        "2026-08-25", "2026-08-24", "2026-08-23", "2026-08-22", "2026-08-21",
      ]);
      expect(countLongestStreak(dates)).toBe(5);
    });
  });
});
