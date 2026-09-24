import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody } from "@/lib/validate";
import { updateUserProfileSchema } from "@/lib/schemas";

// GET /api/user — 获取当前用户详情
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      bio: true,
      emailNotifications: true,
      reminderEnabled: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  // 获取用户统计数据
  const [practiceCount, noteCount, planCount] = await Promise.all([
    prisma.practiceHistory.count({
      where: { userId: session.user.id },
    }),
    prisma.note.count({
      where: { userId: session.user.id },
    }),
    prisma.studyPlan.count({
      where: { userId: session.user.id },
    }),
  ]);

  return NextResponse.json({
    user,
    stats: { practiceCount, noteCount, planCount },
  });
}

// PATCH /api/user — 更新用户信息
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const parsed = await parseBody(request, updateUserProfileSchema);
  if (!parsed.success) return parsed.response;
  const { name, image, bio, emailNotifications, reminderEnabled } = parsed.data;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined && { name }),
      ...(image !== undefined && { image }),
      ...(bio !== undefined && { bio }),
      ...(emailNotifications !== undefined && { emailNotifications }),
      ...(reminderEnabled !== undefined && { reminderEnabled }),
    },
    // 白名单脱敏：不回传 password 等敏感字段
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      bio: true,
      emailNotifications: true,
      reminderEnabled: true,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/user — 注销账号（级联删除用户所有关联数据）
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.practiceHistory.deleteMany({ where: { userId } }),
      prisma.note.deleteMany({ where: { userId } }),
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.report.deleteMany({ where: { reporterId: userId } }),
      prisma.shareLink.deleteMany({ where: { creatorId: userId } }),
      prisma.questionEncounter.deleteMany({ where: { userId } }),
      prisma.questionEdit.deleteMany({ where: { userId } }),
      prisma.comment.deleteMany({ where: { userId } }),
      prisma.solution.deleteMany({ where: { userId } }),
      prisma.bookmarkItem.deleteMany({
        where: { folder: { userId } },
      }),
      prisma.bookmarkFolder.deleteMany({ where: { userId } }),
      prisma.mockInterview.deleteMany({ where: { userId } }),
      prisma.studyPlanProgress.deleteMany({
        where: { studyPlan: { userId } },
      }),
      prisma.studyPlan.deleteMany({ where: { userId } }),
      prisma.contestSubmission.deleteMany({ where: { userId } }),
      prisma.testPaper.deleteMany({ where: { userId } }),
      prisma.follow.deleteMany({
        where: { OR: [{ followerId: userId }, { followingId: userId }] },
      }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "注销失败，请稍后重试" }, { status: 500 });
  }
}

