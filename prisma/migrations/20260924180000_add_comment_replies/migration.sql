-- 评论支持回复：增加 parent_id 自关联（一层嵌套语义，级联删除）

ALTER TABLE "comments" ADD COLUMN "parent_id" TEXT;

CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");

ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
