import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/solutions/user/[id] — 某用户的公开题解列表（分页）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const take = Math.min(parseInt(searchParams.get("take") ?? "10") || 10, 50);
    const skip = parseInt(searchParams.get("skip") ?? "0") || 0;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const [solutions, total] = await Promise.all([
      prisma.solution.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take,
        skip,
        select: {
          id: true,
          language: true,
          upvotes: true,
          isFeatured: true,
          createdAt: true,
          question: {
            select: { id: true, title: true, difficulty: true },
          },
        },
      }),
      prisma.solution.count({ where: { userId: id } }),
    ]);

    return NextResponse.json({ solutions, total, take, skip });
  } catch (error) {
    console.error("GET /api/solutions/user/[id] error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
