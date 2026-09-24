-- 多用户数据隔离改造（第二阶段：清理全局字段）
-- 题目级全局 mastery/isBookmarked 已由 user_question_states 表替代，
-- 全局共享的 streaks 表已由 user_streaks 表替代。

-- DropColumn（questions 表列名为驼峰，schema 未映射）
ALTER TABLE "questions" DROP COLUMN IF EXISTS "mastery";
ALTER TABLE "questions" DROP COLUMN IF EXISTS "isBookmarked";

-- DropTable
DROP TABLE IF EXISTS "streaks";
