import { NextResponse } from "next/server";
import { ZodError, ZodType } from "zod";

/**
 * API 请求体校验工具（zod）。
 *
 * 用法：
 *   const parsed = await parseBody(request, createCommentSchema);
 *   if (!parsed.success) return parsed.response;
 *   const { content } = parsed.data;
 *
 * 校验失败统一返回 400 + `{ error: <首个错误信息> }`，与现有前端
 * `data.error` 的读取习惯一致。
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json({ error: "请求体必须是合法的 JSON" }, { status: 400 }),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error instanceof ZodError ? result.error.issues : [];
    const first = issues[0];
    const message = first
      ? `${first.path.join(".") || "body"}: ${first.message}`
      : "请求参数不合法";
    return {
      success: false,
      response: NextResponse.json({ error: message }, { status: 400 }),
    };
  }

  return { success: true, data: result.data };
}
