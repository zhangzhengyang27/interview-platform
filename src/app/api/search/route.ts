import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface SearchResultItem {
  id: string;
  title: string;
  content?: string;
  author?: string | null;
  createdAt: Date;
  _type: string;
  questionId?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type") ?? "all"; // "all" | "question" | "solution" | "note"
  const take = Math.min(50, parseInt(searchParams.get("take") ?? "20") || 20);
  const skip = parseInt(searchParams.get("skip") ?? "0") || 0;

  if (!q || q.length < 1) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const results: SearchResultItem[] = [];

  // 搜索题目
  if (type === "all" || type === "question") {
    const [questions, count] = await Promise.all([
      prisma.question.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          difficulty: true,
          questionType: true,
          tags: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.question.count({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
          ],
        },
      }),
    ]);

    results.push(
      ...questions.map((item) => ({ ...item, _type: "question" }))
    );

    if (type === "question") {
      return NextResponse.json({ results, total: count });
    }
  }

  // 搜索题解
  if (type === "all" || type === "solution") {
    const solutions = await prisma.solution.findMany({
      where: {
        content: { contains: q, mode: "insensitive" },
      },
      include: {
        question: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    results.push(
      ...solutions.map((s) => ({
        id: s.id,
        title: `题解: ${s.question.title}`,
        content: s.content.slice(0, 200),
        author: s.user?.name,
        createdAt: s.createdAt,
        _type: "solution",
        questionId: s.question.id,
      }))
    );
  }

  // 搜索笔记
  if (type === "all" || type === "note") {
    const notes = await prisma.note.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take,
    });

    results.push(
      ...notes.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content.slice(0, 200),
        createdAt: n.createdAt,
        _type: "note",
      }))
    );
  }

  // 记录搜索历史
  if (q) {
    await prisma.searchHistory.create({
      data: { content: q },
    }).catch(() => {}); // 静默失败
  }

  return NextResponse.json({ results, total: results.length });
}
