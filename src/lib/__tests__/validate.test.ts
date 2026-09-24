// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseBody } from "../validate";
import {
  createCommentSchema,
  updateQuestionStateSchema,
  createStudyPlanSchema,
} from "../schemas";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function textRequest(): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    body: "not json",
  });
}

describe("parseBody", () => {
  it("合法请求返回解析后的数据", async () => {
    const result = await parseBody(jsonRequest({ content: "hello" }), createCommentSchema);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ content: "hello" });
  });

  it("非法 JSON 返回 400", async () => {
    const result = await parseBody(textRequest(), createCommentSchema);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.response.status).toBe(400);
  });

  it("校验失败返回 400 与首个错误信息", async () => {
    const result = await parseBody(jsonRequest({ content: "" }), createCommentSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
      const body = await result.response.json();
      expect(body.error).toContain("content");
    }
  });
});

describe("updateQuestionStateSchema", () => {
  it("接受 mastery / isBookmarked 任意组合", () => {
    expect(updateQuestionStateSchema.safeParse({ mastery: "mastered" }).success).toBe(true);
    expect(updateQuestionStateSchema.safeParse({ isBookmarked: true }).success).toBe(true);
  });

  it("空对象与非法 mastery 拒绝", () => {
    expect(updateQuestionStateSchema.safeParse({}).success).toBe(false);
    expect(updateQuestionStateSchema.safeParse({ mastery: "expert" }).success).toBe(false);
  });
});

describe("createStudyPlanSchema", () => {
  it("totalDays 边界：1 与 365 合法，0 与 366 拒绝", () => {
    expect(createStudyPlanSchema.safeParse({ title: "t", totalDays: 1 }).success).toBe(true);
    expect(createStudyPlanSchema.safeParse({ title: "t", totalDays: 365 }).success).toBe(true);
    expect(createStudyPlanSchema.safeParse({ title: "t", totalDays: 0 }).success).toBe(false);
    expect(createStudyPlanSchema.safeParse({ title: "t", totalDays: 366 }).success).toBe(false);
  });
});
