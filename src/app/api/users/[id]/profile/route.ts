import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { optionalAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/users/[id]/profile — 公开用户主页数据（脱敏，不含邮箱等隐私字段）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            practiceHistory: true,
            solutions: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 查看者登录时返回关注状态
    const session = await optionalAuth();
    const viewerId = session?.user?.id as string | undefined;
    let isFollowing: boolean | null = null;
    if (viewerId && viewerId !== id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: { followerId: viewerId, followingId: id },
        },
        select: { id: true },
      });
      isFollowing = !!follow;
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      image: user.image,
      bio: user.bio,
      joinedAt: user.createdAt,
      stats: {
        practiceCount: user._count.practiceHistory,
        solutionCount: user._count.solutions,
        followers: user._count.followers,
        following: user._count.following,
      },
      isFollowing,
      isSelf: viewerId === id,
    });
  } catch (error) {
    console.error("GET /api/users/[id]/profile error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
