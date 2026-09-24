-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "parent_id" TEXT;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "job_role" TEXT;

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_type_idx" ON "categories"("type");

-- CreateIndex
CREATE INDEX "questions_job_role_idx" ON "questions"("job_role");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
