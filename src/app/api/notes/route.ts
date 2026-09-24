import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getCurrentUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const user = await getCurrentUser();
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const notes = await prisma.note.findMany({
      where: {
        userId: user!.id,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
                { company: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("GET /api/notes error:", error);
    return NextResponse.json({ error: "获取笔记失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const user = await getCurrentUser();
    const body = await request.json();
    const { title, content, company, questionIds } = body;

    if (!title) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }

    const note = await prisma.note.create({
      data: {
        title,
        content: content ?? "",
        company: company ?? null,
        questionIds: questionIds ?? [],
        userId: user!.id,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes error:", error);
    return NextResponse.json({ error: "创建笔记失败" }, { status: 500 });
  }
}
