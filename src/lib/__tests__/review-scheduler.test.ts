import { describe, it, expect } from "vitest";
import { calculateNextReview, EBINGHAUS_INTERVALS } from "../review-scheduler";

describe("calculateNextReview（艾宾浩斯间隔）", () => {
  it("复习次数 0 → 第 1 阶段间隔 1 天", () => {
    const base = new Date("2026-09-24T00:00:00.000Z");
    const next = calculateNextReview(base, 0);
    expect(next.getTime()).toBe(base.getTime() + EBINGHAUS_INTERVALS[0] * 86400_000);
  });

  it("按阶段递进：1→2→4→7→15→30 天", () => {
    const base = new Date("2026-09-24T00:00:00.000Z");
    for (let count = 0; count < EBINGHAUS_INTERVALS.length; count++) {
      const next = calculateNextReview(base, count);
      const expected = base.getTime() + EBINGHAUS_INTERVALS[count] * 86400_000;
      expect(next.getTime()).toBe(expected);
    }
  });

  it("超过阶段数后封顶在最后一级间隔（30 天）", () => {
    const base = new Date("2026-09-24T00:00:00.000Z");
    const next = calculateNextReview(base, 20);
    const last = EBINGHAUS_INTERVALS[EBINGHAUS_INTERVALS.length - 1];
    expect(next.getTime()).toBe(base.getTime() + last * 86400_000);
  });

  it("不修改传入的日期对象（纯函数）", () => {
    const base = new Date("2026-09-24T00:00:00.000Z");
    const before = base.getTime();
    calculateNextReview(base, 3);
    expect(base.getTime()).toBe(before);
  });
});
