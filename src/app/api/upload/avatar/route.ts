import { NextRequest, NextResponse } from "next/server";
import { assumeRole } from "@/lib/oss";
import { requireAuth } from "@/lib/session";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const EXT_WHITELIST = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

/**
 * 头像上传：接收裁剪后的图片，经 STS 凭证写入阿里云 OSS 的 uploads/avatars/，
 * 返回完整可访问的 OSS URL。
 * 不能写本地 public/uploads（standalone 运行时不服务运行时新增文件，且容器重建即丢失）。
 */
export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未提供文件" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "仅支持图片文件" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "图片大小不能超过 2MB" }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!EXT_WHITELIST.has(ext)) {
      return NextResponse.json({ error: "不支持的图片格式" }, { status: 400 });
    }

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const objectPath = `uploads/avatars/${crypto.randomUUID()}.${ext}`;
    // 设置 object 为公共读，保证返回的普通 URL 可被直接访问
    const result = await client.put(objectPath, buffer, {
      headers: { "x-oss-object-acl": "public-read" },
    });

    // 强制 https，避免 HTTPS 站点 mixed-content 拦截导致头像预览失败
    return NextResponse.json({ url: result.url.replace(/^http:\/\//, "https://") });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
