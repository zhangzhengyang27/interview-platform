import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/notifications/[id]/read — 标记单条已读
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const notification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        read: notification.read,
      },
    });
  } catch (error) {
    console.error("PATCH /api/notifications/[id]/read error:", error);
    return NextResponse.json(
      { error: "标记已读失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] — 删除单条通知
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/notifications/[id] error:", error);
    return NextResponse.json(
      { error: "删除通知失败" },
      { status: 500 }
    );
  }
}
