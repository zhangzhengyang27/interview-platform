import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  try {
    const interviews = await prisma.mockInterview.findMany({
      where: { userId: user?.id },
      orderBy: { startedAt: "desc" },
      include: {
        turns: { orderBy: { turnOrder: "asc" } },
      },
    });

    return NextResponse.json({ interviews });
  } catch (error) {
    console.error("Failed to fetch mock interviews:", error);
    return NextResponse.json(
      { error: "获取模拟面试列表失败" },
      { status: 500 }
    );
  }
}
