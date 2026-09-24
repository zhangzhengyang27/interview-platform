# interview-platform (面试网) Next.js 全栈单容器多阶段构建
# 构建期：pnpm install → prisma generate → prisma migrate deploy（建表，供可能的构建期 DB 访问）→ next build
# 运行期：prisma migrate deploy（幂等）+ next start

FROM node:22-slim AS build
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV CI=true
ARG NEXT_PUBLIC_APP_URL
ARG DATABASE_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV DATABASE_URL=${DATABASE_URL}
ENV AUTH_SECRET=build-only-dummy
# 防止任意 build 期 .env 干扰（架构判定等）
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --no-frozen-lockfile
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm exec prisma generate
RUN pnpm exec prisma migrate deploy
RUN pnpm build

FROM node:22-slim AS run
ENV NODE_ENV=production
ENV CI=true
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
# 运行期需要 public/（career 页读 public/knowledge/*.md）
COPY --from=build /app/public ./public
# 运行期 prisma migrate deploy 需要 CLI + schema + migrations + config
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
EXPOSE 4300
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm start -p 4300"]