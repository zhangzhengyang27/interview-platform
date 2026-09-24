import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permission";
import { parseBody } from "@/lib/validate";
import { z } from "zod";

const batchCompanySchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "至少提供一道题目").max(500, "单次最多 500 道"),
  company: z.string().trim().min(1, "公司名不能为空").max(50),
});

// POST /api/admin/questions/batch-company — 批量设置题目 company 字段（数据运营）
export async function POST(request: NextRequest) {
  const authError = await requirePermission("question:manage");
  if (authError) return authError;

  try {
    const parsed = await parseBody(request, batchCompanySchema);
    if (!parsed.success) return parsed.response;
    const { ids, company } = parsed.data;

    const result = await prisma.question.updateMany({
      where: { id: { in: ids } },
      data: { company },
    });

    return NextResponse.json({ success: true, updated: result.count });
  } catch (error) {
    console.error("POST /api/admin/questions/batch-company error:", error);
    return NextResponse.json({ error: "批量更新失败" }, { status: 500 });
  }
}
