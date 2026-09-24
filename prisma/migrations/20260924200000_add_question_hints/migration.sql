-- AI 渐进式提示：按题按级缓存

-- CreateTable
CREATE TABLE "question_hints" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_hints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "question_hints_question_id_level_key" ON "question_hints"("question_id", "level");

-- AddForeignKey
ALTER TABLE "question_hints" ADD CONSTRAINT "question_hints_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
