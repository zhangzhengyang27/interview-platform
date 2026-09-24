import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const companies = await prisma.question.findMany({
      where: {
        company: { not: null },
      },
      select: { company: true },
      distinct: ["company"],
      orderBy: { company: "asc" },
    });

    const list = companies
      .map((q) => q.company)
      .filter((c): c is string => c !== null);

    return NextResponse.json({ companies: list, total: list.length });
  } catch (error) {
    console.error("GET /api/companies error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
