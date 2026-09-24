-- 多用户数据隔离改造（第一阶段：additive + 存量数据归属回填）
-- 新增用户维度的题目状态表与打卡表；学习计划及进度归属到首个注册用户。

-- CreateTable user_question_states（用户维度的掌握/收藏状态）
CREATE TABLE "user_question_states" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "mastery" TEXT NOT NULL DEFAULT 'unsolved',
    "is_bookmarked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_question_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable user_streaks（用户维度的每日打卡快照）
CREATE TABLE "user_streaks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "question_count" INTEGER NOT NULL DEFAULT 0,
    "daily_goal" INTEGER NOT NULL DEFAULT 5,
    "goal_met" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("id")
);

-- AlterTable study_plan_progress：先加可空列，回填后再设 NOT NULL
ALTER TABLE "study_plan_progress" ADD COLUMN "user_id" TEXT;

-- ── 存量数据回填：全部归属给首个注册用户 ──────────────────────────────

-- 学习计划：userId 为 null 的计划划归首个用户
UPDATE "study_plans"
SET "user_id" = (SELECT "id" FROM "users" ORDER BY "created_at" ASC, "id" ASC LIMIT 1)
WHERE "user_id" IS NULL;

-- 学习计划进度：跟随所属计划的归属人
UPDATE "study_plan_progress" p
SET "user_id" = sp."user_id"
FROM "study_plans" sp
WHERE p."study_plan_id" = sp."id" AND p."user_id" IS NULL;

-- 题目全局掌握/收藏状态 → 首个用户的个人状态
-- 注意：questions 表的 isBookmarked 列为驼峰命名（schema 未映射）
INSERT INTO "user_question_states" ("id", "user_id", "question_id", "mastery", "is_bookmarked", "created_at", "updated_at")
SELECT
    md5(random()::text || clock_timestamp()::text),
    u."id",
    q."id",
    q."mastery",
    q."isBookmarked",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
CROSS JOIN "questions" q
WHERE u."id" = (SELECT "id" FROM "users" ORDER BY "created_at" ASC, "id" ASC LIMIT 1)
  AND (q."mastery" <> 'unsolved' OR q."isBookmarked" = true);

-- 全局打卡快照 → 首个用户的个人打卡
INSERT INTO "user_streaks" ("id", "user_id", "date", "question_count", "daily_goal", "goal_met", "created_at", "updated_at")
SELECT
    md5(random()::text || clock_timestamp()::text),
    u."id",
    s."date",
    s."question_count",
    s."daily_goal",
    s."goal_met",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
CROSS JOIN "streaks" s
WHERE u."id" = (SELECT "id" FROM "users" ORDER BY "created_at" ASC, "id" ASC LIMIT 1);

-- ── 约束（回填完成后收紧） ────────────────────────────────────────────

ALTER TABLE "study_plan_progress" ALTER COLUMN "user_id" SET NOT NULL;

CREATE UNIQUE INDEX "user_question_states_user_id_question_id_key" ON "user_question_states"("user_id", "question_id");
CREATE INDEX "user_question_states_user_id_mastery_idx" ON "user_question_states"("user_id", "mastery");
CREATE UNIQUE INDEX "user_streaks_user_id_date_key" ON "user_streaks"("user_id", "date");
DROP INDEX IF EXISTS "study_plan_progress_study_plan_id_question_id_key";
CREATE UNIQUE INDEX "study_plan_progress_study_plan_id_user_id_question_id_key" ON "study_plan_progress"("study_plan_id", "user_id", "question_id");

-- AddForeignKey
ALTER TABLE "user_question_states" ADD CONSTRAINT "user_question_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_question_states" ADD CONSTRAINT "user_question_states_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_plan_progress" ADD CONSTRAINT "study_plan_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
