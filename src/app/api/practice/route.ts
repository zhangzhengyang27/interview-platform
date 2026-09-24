import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const VALID_STATUSES = new Set(["completed", "failed"]);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录，请先登录" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { questionId, status, durationSeconds } = body;

    if (!questionId || !status) {
      return NextResponse.json(
        { error: "缺少必填字段: questionId, status" },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: `Invalid status: must be one of ${[...VALID_STATUSES].join(", ")}` },
        { status: 400 }
      );
    }

    const record = await prisma.practiceHistory.create({
      data: {
        questionId,
        userId,
        status,
        durationSeconds: durationSeconds ?? null,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("POST /api/practice error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
