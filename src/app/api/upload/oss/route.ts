import { NextRequest, NextResponse } from "next/server";
import { assumeRole } from "@/lib/oss";
import { requireAuth, getCurrentUser } from "@/lib/session";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
// 扩展名白名单：防止 text/html 等内容以 .html/.svg 扩展名传成公共读对象（存储型 XSS 托管）
const EXT_WHITELIST = new Set(["jpg", "jpeg", "png", "gif", "webp"]);
// MIME 类型白名单（file.type 客户端可伪造，仅作第一道校验，扩展名白名单兜底）
const MIME_PREFIX = "image/";

/**
 * 客户端上传文件到 OSS 的 API
 *
 * 接收 FormData 中的文件，使用 STS 临时凭证上传到 OSS。
 * 避免在客户端 bundle 中引入 ali-oss（它依赖 Node.js fs 模块）。
 */
export async function POST(request: NextRequest) {
  // 认证检查：禁止未登录用户上传
  const authError = await requireAuth();
  if (authError) return authError;
  const user = await getCurrentUser();

  const rl = rateLimit(`upload-oss:${user!.id}`, 20, 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "上传过于频繁，请稍后再试" },
      { status: 429, headers: rateLimitHeaders(rl) }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未提供文件" }, { status: 400 });
    }

    if (!file.type.startsWith(MIME_PREFIX)) {
      return NextResponse.json({ error: "只支持图片文件" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "图片大小不能超过 10MB" }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    if (!EXT_WHITELIST.has(ext)) {
      return NextResponse.json({ error: "不支持的图片格式" }, { status: 400 });
    }

    // 动态导入 ali-oss，确保只在服务端执行
    const OSS = (await import("ali-oss")).default;

    const creds = await assumeRole();

    const client = new OSS({
      region: process.env.OSS_REGION ?? "oss-cn-shanghai",
      accessKeyId: creds.AccessKeyId,
      accessKeySecret: creds.AccessKeySecret,
      stsToken: creds.SecurityToken,
      bucket: process.env.OSS_BUCKET ?? "xiaoye-leaf",
      authorizationV4: true,
    });

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
    const path = `uploads/${date}/${crypto.randomUUID()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    // 设置 object 为公共读，保证返回的普通 URL 可被直接访问
    const result = await client.put(path, buffer, {
      headers: { "x-oss-object-acl": "public-read" },
    });

        // 强制 https，避免 HTTPS 站点 mixed-content 拦截导致图片预览失败
    return NextResponse.json({ url: result.url.replace(/^http:\/\//, "https://") });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
