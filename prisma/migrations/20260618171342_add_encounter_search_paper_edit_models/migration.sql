-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "encounter_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "question_encounters" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "tags" TEXT[],
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_histories" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_papers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "detail" TEXT,
    "user_id" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_papers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_paper_items" (
    "id" TEXT NOT NULL,
    "test_paper_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "question_type" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "test_paper_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_edits" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "user_id" TEXT,
    "description" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "review_message" TEXT,
    "reviewer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_edits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_encounters_question_id_idx" ON "question_encounters"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "question_encounters_user_id_question_id_key" ON "question_encounters"("user_id", "question_id");

-- CreateIndex
CREATE INDEX "search_histories_created_at_idx" ON "search_histories"("created_at");

-- CreateIndex
CREATE INDEX "search_histories_user_id_idx" ON "search_histories"("user_id");

-- CreateIndex
CREATE INDEX "test_paper_items_test_paper_id_idx" ON "test_paper_items"("test_paper_id");

-- CreateIndex
CREATE INDEX "question_edits_question_id_idx" ON "question_edits"("question_id");

-- CreateIndex
CREATE INDEX "question_edits_status_idx" ON "question_edits"("status");

-- AddForeignKey
ALTER TABLE "question_encounters" ADD CONSTRAINT "question_encounters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_encounters" ADD CONSTRAINT "question_encounters_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_papers" ADD CONSTRAINT "test_papers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_paper_items" ADD CONSTRAINT "test_paper_items_test_paper_id_fkey" FOREIGN KEY ("test_paper_id") REFERENCES "test_papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_paper_items" ADD CONSTRAINT "test_paper_items_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_edits" ADD CONSTRAINT "question_edits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_edits" ADD CONSTRAINT "question_edits_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
