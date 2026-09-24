-- 高频查询索引补齐
-- comments.question_id：评论按题目查询
-- questions.categoryId：题目列表按分类过滤（列名为驼峰，schema 未映射）
-- reports.status：后台按状态筛举报
-- share_links.type+target_id：分享落地页按目标查链接

CREATE INDEX "comments_question_id_idx" ON "comments"("question_id");
CREATE INDEX "questions_categoryId_idx" ON "questions"("categoryId");
CREATE INDEX "reports_status_idx" ON "reports"("status");
CREATE INDEX "share_links_type_target_id_idx" ON "share_links"("type", "target_id");
