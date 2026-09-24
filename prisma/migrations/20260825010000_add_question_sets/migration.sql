-- CreateTable
CREATE TABLE "question_sets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "cover" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_set_items" (
    "id" TEXT NOT NULL,
    "question_set_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "question_set_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "question_sets_slug_key" ON "question_sets"("slug");

-- CreateIndex
CREATE INDEX "question_set_items_question_set_id_idx" ON "question_set_items"("question_set_id");

-- AddForeignKey
ALTER TABLE "question_set_items" ADD CONSTRAINT "question_set_items_question_set_id_fkey" FOREIGN KEY ("question_set_id") REFERENCES "question_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_set_items" ADD CONSTRAINT "question_set_items_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
