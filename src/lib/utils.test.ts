// utils.ts 工具函数的测试
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cn, formatDate, formatRelativeTime, generateId } from "./utils";

// cn 函数：基于 clsx 合并类名
describe("cn", () => {
  it("应当正确合并字符串类名", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("应当过滤掉 falsy 值", () => {
    expect(cn("foo", false && "bar", undefined, null, "baz")).toBe("foo baz");
  });

  it("应当处理对象类型的类名", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("应当处理数组类型的类名", () => {
    expect(cn(["foo", ["bar", "baz"]])).toBe("foo bar baz");
  });

  it("应当混合多种类型的输入", () => {
    expect(cn("a", { b: true, c: false }, ["d", undefined])).toBe("a b d");
  });
});

// formatDate 函数：将日期格式化为 "YYYY/MM/DD" 的中文日期格式
describe("formatDate", () => {
  it("应当正确格式化 Date 对象", () => {
    const result = formatDate(new Date("2025-01-15T00:00:00Z"));
    expect(result).toMatch(/2025.*01.*15/);
  });

  it("应当正确格式化日期字符串", () => {
    const result = formatDate("2025-01-15");
    expect(result).toMatch(/2025.*01.*15/);
  });

  it("应当返回字符串类型的结果", () => {
    const result = formatDate(new Date());
    expect(typeof result).toBe("string");
  });
});

// formatRelativeTime 函数：返回相对时间的中文描述
describe("formatRelativeTime", () => {
  beforeEach(() => {
    // 使用 fake timers 控制 Date.now()，确保测试可重复
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("当下时间应当显示为刚刚", () => {
    expect(formatRelativeTime(new Date())).toBe("刚刚");
  });

  it("30 秒之前应当显示为刚刚", () => {
    const past = new Date();
    past.setSeconds(past.getSeconds() - 30);
    expect(formatRelativeTime(past)).toBe("刚刚");
  });

  it("5 分钟之前应当显示为 5 分钟前", () => {
    const past = new Date();
    past.setMinutes(past.getMinutes() - 5);
    expect(formatRelativeTime(past)).toBe("5 分钟前");
  });

  it("3 小时之前应当显示为 3 小时前", () => {
    const past = new Date();
    past.setHours(past.getHours() - 3);
    expect(formatRelativeTime(past)).toBe("3 小时前");
  });

  it("7 天之前应当显示为 7 天前", () => {
    const past = new Date();
    past.setDate(past.getDate() - 7);
    expect(formatRelativeTime(past)).toBe("7 天前");
  });

  it("接受字符串输入", () => {
    const past = new Date();
    past.setMinutes(past.getMinutes() - 10);
    expect(formatRelativeTime(past.toISOString())).toBe("10 分钟前");
  });
});

// generateId 函数：生成随机 UUID
describe("generateId", () => {
  it("应当生成非空字符串", () => {
    const id = generateId();
    expect(id).toBeDefined();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("应当生成唯一的 ID", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it("应当生成符合 UUID 格式的字符串", () => {
    const id = generateId();
    // UUID v4 格式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f-]+$/i;
    expect(uuidRegex.test(id)).toBe(true);
  });
});
