import NextAuth, { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// 扩展 NextAuth 类型定义
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: string | null;
    };
  }

  interface User {
    role?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string | null;
    image?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  // NextAuth v4 默认读取 NEXTAUTH_SECRET，本项目统一使用 AUTH_SECRET，
  // 需显式指定，否则 session JWT 会退回开发默认密钥，与 middleware / lib/jwt.ts 不一致。
  secret: process.env.AUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "密码登录",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        // 邮箱未验证：禁止登录，前端据此提示先完成验证
        if (!user.emailVerified) {
          const error = new Error("EMAIL_NOT_VERIFIED");
          (error as Error & { code?: string }).code = "EMAIL_NOT_VERIFIED";
          throw error;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.image = user.image;
      } else if (trigger === "update" || (token.id && token.image === undefined)) {
        // 现有 token 缺少 image 时(如历史登录),回查数据库补全;
        // 也可在客户端调 useSession().update() 主动刷新头像
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          select: { image: true },
        });
        if (fresh) token.image = fresh.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        // 每次 session 拉取都从数据库刷新 user 资料（image/name/role），
        // 避免 JWT 里残留旧头像 URL（如换过头像后 session 未更新），
        // 保证导航栏等用 session.user.image 渲染的头像与数据库 / /api/user 完全一致。
        if (token.id) {
          try {
            const fresh = await prisma.user.findUnique({
              where: { id: token.id },
              select: { image: true, name: true, role: true },
            });
            if (fresh) {
              session.user.image = fresh.image;
              if (fresh.name) session.user.name = fresh.name;
              if (fresh.role) session.user.role = fresh.role;
            }
          } catch (err) {
            console.error("[auth] session refresh user failed, fallback to token:", err);
            session.user.image = token.image ?? null;
          }
        } else {
          session.user.image = token.image ?? null;
        }
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

/**
 * 获取当前服务端会话。
 *
 * 注意：NextAuth v4 的 handler 没有 `.auth` 属性（那是 Auth.js v5 的 API），
 * 不能直接导出 `handler.auth`。这里用 getServerSession(authOptions) 包装，
 * 保证调用方 `await auth()` 能正常拿到 Session 而非抛 TypeError。
 */
export async function auth() {
  return getServerSession(authOptions);
}
