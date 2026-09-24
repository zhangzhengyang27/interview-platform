import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";

function generateSlug(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  try {
    const body = await request.json();
    const { type, targetId } = body;

    if (!type || !targetId) {
      return NextResponse.json(
        { error: "缺少必要参数 type 或 targetId" },
        { status: 400 }
      );
    }

    if (!["question", "note", "interview_result"].includes(type)) {
      return NextResponse.json({ error: "无效的分享类型" }, { status: 400 });
    }

    const creatorId = user!.id;

    // 检查是否已存在该目标的分享链接
    const existing = await prisma.shareLink.findFirst({
      where: {
        creatorId,
        type,
        targetId,
      },
    });

    if (existing) {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return NextResponse.json({
        url: `${baseUrl}/s/${existing.slug}`,
        slug: existing.slug,
      });
    }

    // 生成唯一 slug
    let slug = generateSlug();
    let attempts = 0;
    while (await prisma.shareLink.findUnique({ where: { slug } })) {
      slug = generateSlug();
      attempts++;
      if (attempts > 10) {
        slug = generateSlug(12); // 加长避免冲突
      }
    }

    const share = await prisma.shareLink.create({
      data: {
        creatorId,
        type,
        targetId,
        slug,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 天
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.json({
      url: `${baseUrl}/s/${share.slug}`,
      slug: share.slug,
    });
  } catch (error) {
    console.error("POST /api/share error:", error);
    return NextResponse.json({ error: "创建分享链接失败" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "缺少 slug 参数" }, { status: 400 });
    }

    const share = await prisma.shareLink.findUnique({
      where: { slug },
      include: {
        creator: { select: { id: true, name: true, image: true } },
      },
    });

    if (!share) {
      return NextResponse.json({ error: "分享链接不存在或已过期" }, { status: 404 });
    }

    // 检查过期
    if (share.expiresAt && new Date() > share.expiresAt) {
      return NextResponse.json({ error: "分享链接已过期" }, { status: 410 });
    }

    // 浏览次数 +1
    await prisma.shareLink.update({
      where: { id: share.id },
      data: { views: { increment: 1 } },
    });

    // 根据类型获取目标内容
    let targetContent = null;
    if (share.type === "question") {
      targetContent = await prisma.question.findUnique({
        where: { id: share.targetId },
        select: {
          id: true,
          title: true,
          content: true,
          difficulty: true,
          questionType: true,
          tags: true,
          company: true,
          solution: true,
        },
      });
    } else if (share.type === "note") {
      targetContent = await prisma.note.findUnique({
        where: { id: share.targetId },
        select: {
          id: true,
          title: true,
          content: true,
          company: true,
          createdAt: true,
        },
      });
    }

    if (!targetContent) {
      return NextResponse.json({ error: "分享的内容不存在" }, { status: 404 });
    }

    return NextResponse.json({
      ...share,
      targetContent,
    });
  } catch (error) {
    console.error("GET /api/share error:", error);
    return NextResponse.json({ error: "获取分享内容失败" }, { status: 500 });
  }
}
