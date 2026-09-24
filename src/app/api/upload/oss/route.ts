import { NextRequest, NextResponse } from "next/server";
import { assumeRole } from "@/lib/oss";
import { requireAuth } from "@/lib/session";

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

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未提供文件" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "只支持图片文件" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "图片大小不能超过 10MB" }, { status: 400 });
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

    const ext = file.name.split(".").pop() ?? "";
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
