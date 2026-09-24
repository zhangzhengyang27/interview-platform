import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const VALID_TARGET_TYPES = ["question", "comment", "note"] as const;
const VALID_REASONS = ["spam", "inappropriate", "copyright", "outdated", "other"] as const;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { targetType, targetId, reason, description } = body;

    // 验证必填字段
    if (!targetType || !targetId || !reason) {
      return NextResponse.json(
        { error: "缺少必填字段：targetType、targetId、reason" },
        { status: 400 }
      );
    }

    // 验证 target_type
    if (!VALID_TARGET_TYPES.includes(targetType)) {
      return NextResponse.json(
        { error: `无效的 target_type，允许值：${VALID_TARGET_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // 验证 reason
    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: `无效的 reason，允许值：${VALID_REASONS.join(", ")}` },
        { status: 400 }
      );
    }

    // 防重复提交：检查是否已存在相同举报
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: session.user.id,
        target_type: targetType,
        targetId,
        status: "pending",
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "您已经举报过该内容，请等待处理结果" },
        { status: 409 }
      );
    }

    // 验证目标是否存在（根据类型）
    let targetExists = false;
    switch (targetType) {
      case "question":
        targetExists = !!(await prisma.question.findUnique({
          where: { id: targetId },
        }));
        break;
      case "comment":
        targetExists = !!(await prisma.comment.findUnique({
          where: { id: targetId },
        }));
        break;
      case "note":
        targetExists = !!(await prisma.note.findUnique({
          where: { id: targetId },
        }));
        break;
    }

    if (!targetExists) {
      return NextResponse.json({ error: "举报目标不存在" }, { status: 404 });
    }

    // 创建举报
    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        target_type: targetType,
        targetId,
        reason,
        description: description || null,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("创建举报失败:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const take = Math.min(parseInt(searchParams.get("take") || "20", 10) || 20, 100);
    const skip = parseInt(searchParams.get("skip") || "0", 10) || 0;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: { status },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          reporter: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.report.count({ where: { status } }),
    ]);

    return NextResponse.json({ reports, total });
  } catch (error) {
    console.error("获取举报列表失败:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
