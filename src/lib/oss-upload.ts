/**
 * 客户端 OSS 上传工具
 *
 * 通过 /api/upload/oss API 上传文件，避免在客户端 bundle 中引入 ali-oss。
 * ali-oss 依赖 Node.js fs 模块，不能在客户端组件中使用。
 */

export async function uploadToOSS(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload/oss", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "上传失败" }));
    throw new Error(data.error ?? "上传失败");
  }

  const data = await res.json();
  return data.url as string;
}