import { z } from "zod";

/**
 * 高频写接口的请求体 schema 集中定义。
 * 长度上限等约束与业务一致；新增接口建议优先在此登记。
 */

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, "评论内容不能为空").max(5000, "评论过长，最多 5000 字符"),
  parentId: z.string().uuid().optional(),
});

export const createSolutionSchema = z.object({
  content: z.string().trim().min(1, "题解内容不能为空").max(20000, "题解内容过长，最多 20000 字符"),
  language: z.string().trim().max(30).optional().nullable(),
});

export const createStudyPlanSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空").max(100, "标题过长，最多 100 字符"),
  description: z.string().trim().max(1000).optional().nullable(),
  totalDays: z.number().int("totalDays 必须是整数").min(1, "totalDays 至少为 1").max(365, "totalDays 不能超过 365"),
});

export const updateStudyPlanSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  totalDays: z.number().int().min(1).max(365).optional(),
});

export const createTestPaperSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空").max(100, "标题过长"),
  detail: z.string().trim().max(1000).optional().nullable(),
  isPublic: z.boolean().optional(),
  questionIds: z.array(z.string().min(1)).min(1, "至少选择一道题目").max(100, "单卷题目数不能超过 100"),
});

export const updateUserProfileSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  image: z.string().max(500).optional(),
  bio: z.string().max(500).optional(),
  emailNotifications: z.boolean().optional(),
  reminderEnabled: z.boolean().optional(),
});

export const updateQuestionStateSchema = z
  .object({
    mastery: z.enum(["unsolved", "learning", "mastered"]).optional(),
    isBookmarked: z.boolean().optional(),
  })
  .refine((v) => v.mastery !== undefined || v.isBookmarked !== undefined, {
    message: "至少提供一个要更新的字段",
  });
