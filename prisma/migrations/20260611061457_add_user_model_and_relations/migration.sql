/*
  Warnings:

  - You are about to drop the column `source` on the `questions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "user_id" TEXT;

-- AlterTable
ALTER TABLE "practice_history" ADD COLUMN     "user_id" TEXT;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "source",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "questionType" TEXT NOT NULL DEFAULT 'qa',
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "bio" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "following_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmark_folders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmark_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmark_items" (
    "id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "bookmark_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_links" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streaks" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "question_count" INTEGER NOT NULL DEFAULT 0,
    "daily_goal" INTEGER NOT NULL DEFAULT 5,
    "goal_met" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_interviews" (
    "id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "overall_score" INTEGER,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in-progress',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT,

    CONSTRAINT "mock_interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_interview_turns" (
    "id" TEXT NOT NULL,
    "mock_interview_id" TEXT NOT NULL,
    "question_id" TEXT,
    "ai_question" TEXT NOT NULL,
    "user_answer" TEXT,
    "ai_feedback" TEXT,
    "score" INTEGER,
    "turn_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mock_interview_turns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plans" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "total_days" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT,

    CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plan_days" (
    "id" TEXT NOT NULL,
    "study_plan_id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "target_question_count" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "study_plan_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plan_items" (
    "id" TEXT NOT NULL,
    "study_plan_day_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "study_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plan_progress" (
    "id" TEXT NOT NULL,
    "study_plan_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_plan_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_following_id_key" ON "follows"("follower_id", "following_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookmark_items_folder_id_question_id_key" ON "bookmark_items"("folder_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "share_links_slug_key" ON "share_links"("slug");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE UNIQUE INDEX "streaks_date_key" ON "streaks"("date");

-- CreateIndex
CREATE UNIQUE INDEX "study_plan_days_study_plan_id_day_number_key" ON "study_plan_days"("study_plan_id", "day_number");

-- CreateIndex
CREATE UNIQUE INDEX "study_plan_progress_study_plan_id_question_id_key" ON "study_plan_progress"("study_plan_id", "question_id");

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmark_folders" ADD CONSTRAINT "bookmark_folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmark_items" ADD CONSTRAINT "bookmark_items_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "bookmark_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmark_items" ADD CONSTRAINT "bookmark_items_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_history" ADD CONSTRAINT "practice_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_interviews" ADD CONSTRAINT "mock_interviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mock_interview_turns" ADD CONSTRAINT "mock_interview_turns_mock_interview_id_fkey" FOREIGN KEY ("mock_interview_id") REFERENCES "mock_interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_days" ADD CONSTRAINT "study_plan_days_study_plan_id_fkey" FOREIGN KEY ("study_plan_id") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_items" ADD CONSTRAINT "study_plan_items_study_plan_day_id_fkey" FOREIGN KEY ("study_plan_day_id") REFERENCES "study_plan_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_items" ADD CONSTRAINT "study_plan_items_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_progress" ADD CONSTRAINT "study_plan_progress_study_plan_id_fkey" FOREIGN KEY ("study_plan_id") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_progress" ADD CONSTRAINT "study_plan_progress_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
