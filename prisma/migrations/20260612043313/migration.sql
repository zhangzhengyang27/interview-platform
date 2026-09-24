-- CreateTable
CREATE TABLE "test_cases" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "orderBy" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solutions" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT,
    "questionId" TEXT NOT NULL,
    "userId" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_cases_questionId_idx" ON "test_cases"("questionId");

-- CreateIndex
CREATE INDEX "solutions_questionId_idx" ON "solutions"("questionId");

-- CreateIndex
CREATE INDEX "solutions_userId_idx" ON "solutions"("userId");

-- CreateIndex
CREATE INDEX "solutions_created_at_idx" ON "solutions"("created_at");

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solutions" ADD CONSTRAINT "solutions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solutions" ADD CONSTRAINT "solutions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
