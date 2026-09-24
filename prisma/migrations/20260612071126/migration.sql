-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "duration_days" INTEGER NOT NULL,
    "difficulty_level" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_preset" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_items" (
    "id" TEXT NOT NULL,
    "path_id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "question_id" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_path_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learning_paths_category_idx" ON "learning_paths"("category");

-- CreateIndex
CREATE INDEX "learning_paths_is_preset_idx" ON "learning_paths"("is_preset");

-- CreateIndex
CREATE INDEX "learning_path_items_path_id_idx" ON "learning_path_items"("path_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_items_path_id_day_number_question_id_key" ON "learning_path_items"("path_id", "day_number", "question_id");

-- AddForeignKey
ALTER TABLE "learning_path_items" ADD CONSTRAINT "learning_path_items_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_items" ADD CONSTRAINT "learning_path_items_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
