import { prisma } from "@/lib/prisma";

export type NotificationType = "follow" | "comment_reply" | "mention" | "reminder" | "system";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

/**
 * 创建通知
 * - 自动忽略"自己给自己通知"（actorId === userId 时不创建）
 * - 失败不抛出，仅打印日志（通知不应阻塞主业务流程）
 */
export async function createNotification(
  input: CreateNotificationInput,
  actorId?: string,
): Promise<void> {
  try {
    // 自己给自己不通知
    if (actorId && actorId === input.userId) {
      return;
    }

    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      },
    });
  } catch (error) {
    console.error("createNotification failed:", error);
  }
}
