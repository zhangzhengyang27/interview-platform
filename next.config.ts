import type { NextConfig } from "next";

const ossHostname = process.env.OSS_HOSTNAME || "xiaoye-leaf.oss-cn-shanghai.aliyuncs.com";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: ossHostname,
      },
    ],
  },
  // 基础安全响应头。Permissions-Policy 允许本站使用摄像头/麦克风（视频/语音面试），
  // 禁止第三方 iframe 嵌入与 referrer 泄露；CSP 在 P2 阶段单独设计
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=()",
          },
        ],
      },
    ];
  },
  // ali-oss 是纯 Node 服务端 SDK，其可选依赖 proxy-agent 会被 Turbopack
  // 静态分析失败（Can't resolve 'proxy-agent'）。将其排除出打包，
  // 交由 Node 运行时按需 require。
  serverExternalPackages: ["ali-oss"],
  // 允许局域网 IP 访问开发服务器（用于手机/其他设备联调语音/视频面试）
  allowedDevOrigins: ["192.168.1.4", "localhost"],
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
