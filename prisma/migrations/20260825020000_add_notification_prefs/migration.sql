-- AlterTable
ALTER TABLE "users" ADD COLUMN "email_notifications" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "reminder_enabled" BOOLEAN NOT NULL DEFAULT true;
