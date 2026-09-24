import { NextResponse } from "next/server";

// GET /api/health — 容器健康检查探针（无外部依赖，恒定快速返回）
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
