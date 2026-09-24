import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

// GET /api/notifications — 获取当前用户的通知列表（分页，未读优先）
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;
    const user = await getCurrentUser();
    const userId = user!.id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type"); // 可选：follow, comment_reply, mention, reminder, system

    const skip = (page - 1) * PAGE_SIZE;

    const where: Record<string, unknown> = {
      userId,
    };

    if (unreadOnly) {
      where.read = false;
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [
          { read: "asc" }, // 未读优先
          { createdAt: "desc" },
        ],
        skip,
        take: PAGE_SIZE,
      }),
      prisma.notification.count({ where }),
    ]);

    // 统计未读数量
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
      unreadCount,
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: "获取通知失败" },
      { status: 500 }
    );
  }
}

// POST /api/notifications — 创建当前用户的通知
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;
    const user = await getCurrentUser();
    const userId = user!.id;

    const body = await request.json();
    const { type, title, body: notificationBody, link } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: "缺少必要参数：type 和 title" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body: notificationBody ?? null,
        link: link ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        link: notification.link,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json(
      { error: "创建通知失败" },
      { status: 500 }
    );
  }
}
