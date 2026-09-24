import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// 认证配置（authOptions）与类型扩展统一在 @/lib/auth 维护，
// 避免两处定义漂移。此处仅为兼容历史导入路径（notifications 路由）而 re-export。
export { authOptions };

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
