import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notify";

// POST /api/follow — 关注用户
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录，请先登录" }, { status: 401 });
    }
    const followerId = session.user.id;

    const body = await request.json();
    const { followingId } = body;

    if (!followingId) {
      return NextResponse.json({ error: "缺少 followingId 参数" }, { status: 400 });
    }

    if (followerId === followingId) {
      return NextResponse.json({ error: "不能关注自己" }, { status: 400 });
    }

    // 检查目标用户是否存在
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true, name: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "目标用户不存在" }, { status: 404 });
    }

    // upsert 关注关系（避免重复关注报错）
    const follow = await prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId, followingId },
      },
      update: {},
      create: { followerId, followingId },
    });

    // 通知被关注者
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: { name: true },
    });
    await createNotification(
      {
        userId: followingId,
        type: "follow",
        title: `${follower?.name ?? "有人"} 关注了你`,
        body: "快来看看你的新粉丝吧",
        link: "/profile",
      },
      followerId,
    );

    return NextResponse.json({ success: true, follow }, { status: 201 });
  } catch (error) {
    console.error("POST /api/follow error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// DELETE /api/follow?followingId=xxx — 取消关注
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录，请先登录" }, { status: 401 });
    }
    const followerId = session.user.id;

    const { searchParams } = new URL(request.url);
    const followingId = searchParams.get("followingId");

    if (!followingId) {
      return NextResponse.json({ error: "缺少 followingId 参数" }, { status: 400 });
    }

    await prisma.follow.deleteMany({
      where: { followerId, followingId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/follow error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// GET /api/follow?userId=xxx — 获取用户关注/粉丝统计
// 不传 userId 时返回当前用户的统计
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get("userId");

    if (!userId) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "未登录" }, { status: 401 });
      }
      userId = session.user.id;
    }

    const [followingCount, followersCount, followingList, followersList] = await Promise.all([
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.findMany({
        where: { followerId: userId },
        include: { following: { select: { id: true, name: true, image: true } } },
        take: 50,
      }),
      prisma.follow.findMany({
        where: { followingId: userId },
        include: { follower: { select: { id: true, name: true, image: true } } },
        take: 50,
      }),
    ]);

    // 判断当前登录用户是否关注了该用户
    const session = await auth();
    const currentUserId = session?.user?.id ?? null;
    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      isFollowing = await prisma.follow.count({
        where: { followerId: currentUserId, followingId: userId },
      }) > 0;
    }

    return NextResponse.json({
      userId,
      followingCount,
      followersCount,
      isFollowing,
      following: followingList.map((f) => f.following),
      followers: followersList.map((f) => f.follower),
    });
  } catch (error) {
    console.error("GET /api/follow error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
