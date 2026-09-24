-- CreateIndex
CREATE INDEX "practice_history_user_id_attempted_at_idx" ON "practice_history"("user_id", "attempted_at");

-- CreateIndex
CREATE INDEX "practice_history_question_id_idx" ON "practice_history"("question_id");
