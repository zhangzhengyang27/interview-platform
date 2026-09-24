-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "solution" TEXT,
    "codeTemplate" JSONB,
    "difficulty" TEXT NOT NULL,
    "source" TEXT,
    "mastery" TEXT NOT NULL DEFAULT 'unsolved',
    "isBookmarked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_tags" (
    "question_id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "question_tags_pkey" PRIMARY KEY ("question_id","tag")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "company" TEXT,
    "question_ids" TEXT[],
    "isBookmarked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_history" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "duration_seconds" INTEGER,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "question_tags" ADD CONSTRAINT "question_tags_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_history" ADD CONSTRAINT "practice_history_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
