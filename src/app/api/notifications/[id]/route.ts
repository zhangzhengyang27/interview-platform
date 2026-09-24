import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// PATCH /api/notifications/[id] — 标记当前用户的单条通知已读
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;
    const user = await getCurrentUser();
    const { id } = await params;

    const result = await prisma.notification.updateMany({
      where: { id, userId: user!.id },
      data: { read: true },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "通知不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id, read: true });
  } catch (error) {
    console.error("PATCH /api/notifications/[id] error:", error);
    return NextResponse.json(
      { error: "标记已读失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] — 删除当前用户的单条通知
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;
    const user = await getCurrentUser();
    const { id } = await params;

    const result = await prisma.notification.deleteMany({
      where: { id, userId: user!.id },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "通知不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/notifications/[id] error:", error);
    return NextResponse.json(
      { error: "删除通知失败" },
      { status: 500 }
    );
  }
}
