import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// PATCH /api/notifications/read-all — 当前用户全部标记已读
export async function PATCH() {
  try {
    const authError = await requireAuth();
    if (authError) return authError;
    const user = await getCurrentUser();

    const result = await prisma.notification.updateMany({
      where: {
        userId: user!.id,
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({
      success: true,
      markedRead: result.count,
      message: `已将 ${result.count} 条通知标记为已读`,
    });
  } catch (error) {
    console.error("PATCH /api/notifications/read-all error:", error);
    return NextResponse.json(
      { error: "全部标记已读失败" },
      { status: 500 }
    );
  }
}
