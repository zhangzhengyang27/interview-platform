import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  try {
    const { id } = await params;

    const interview = await prisma.mockInterview.findUnique({
      where: { id },
    });

    if (!interview) {
      return new Response(JSON.stringify({ error: "面试不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 归属验证：只能删除自己的面试
    // 严格归属校验：userId 为 null 的历史记录同样拒绝（多用户数据隔离）
  if (interview.userId !== user?.id) {
      return new Response(JSON.stringify({ error: "无权删除此面试" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    await prisma.mockInterview.delete({ where: { id } });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to delete mock interview:", error);
    const message = error instanceof Error ? error.message : "删除失败";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
