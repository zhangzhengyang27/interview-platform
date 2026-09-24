-- CreateTable
CREATE TABLE "test_paper_submissions" (
    "id" TEXT NOT NULL,
    "test_paper_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "answers" JSONB,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_paper_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_paper_submissions_test_paper_id_idx" ON "test_paper_submissions"("test_paper_id");

-- CreateIndex
CREATE INDEX "test_paper_submissions_user_id_idx" ON "test_paper_submissions"("user_id");

-- AddForeignKey
ALTER TABLE "test_paper_submissions" ADD CONSTRAINT "test_paper_submissions_test_paper_id_fkey" FOREIGN KEY ("test_paper_id") REFERENCES "test_papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_paper_submissions" ADD CONSTRAINT "test_paper_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
