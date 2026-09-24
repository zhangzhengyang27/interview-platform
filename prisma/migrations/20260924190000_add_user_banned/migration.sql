-- 封禁机制：User 增加 banned 标记（登录与会话回调统一拦截）

ALTER TABLE "users" ADD COLUMN "banned" BOOLEAN NOT NULL DEFAULT false;
