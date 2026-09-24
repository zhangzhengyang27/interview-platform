-- CreateTable
CREATE TABLE "contests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "type" TEXT NOT NULL DEFAULT 'weekly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_problems" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 100,
    "orderBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contest_problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_submissions" (
    "id" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contest_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contests_status_idx" ON "contests"("status");

-- CreateIndex
CREATE INDEX "contests_startTime_idx" ON "contests"("startTime");

-- CreateIndex
CREATE INDEX "contest_problems_contestId_idx" ON "contest_problems"("contestId");

-- CreateIndex
CREATE UNIQUE INDEX "contest_problems_contestId_questionId_key" ON "contest_problems"("contestId", "questionId");

-- CreateIndex
CREATE INDEX "contest_submissions_contestId_idx" ON "contest_submissions"("contestId");

-- CreateIndex
CREATE INDEX "contest_submissions_userId_idx" ON "contest_submissions"("userId");

-- CreateIndex
CREATE INDEX "contest_submissions_submittedAt_idx" ON "contest_submissions"("submittedAt");

-- AddForeignKey
ALTER TABLE "contest_problems" ADD CONSTRAINT "contest_problems_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_problems" ADD CONSTRAINT "contest_problems_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_submissions" ADD CONSTRAINT "contest_submissions_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_submissions" ADD CONSTRAINT "contest_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
