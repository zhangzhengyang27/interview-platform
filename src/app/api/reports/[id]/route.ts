import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // 验证状态值
    const VALID_STATUSES = ["resolved", "dismissed"];
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `无效的 status，允许值：${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // 更新举报状态
    const report = await prisma.report.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("更新举报状态失败:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
