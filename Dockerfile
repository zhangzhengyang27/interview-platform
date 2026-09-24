# interview-platform (面试网) Next.js 全栈单容器多阶段构建
# 构建期：pnpm install（frozen）→ prisma generate → next build（不连数据库）
# 运行期：prisma migrate deploy（幂等）+ next start，以非 root 用户运行

FROM node:22-slim AS build
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV CI=true
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
# prisma generate / next build 不需要真实数据库；DATABASE_URL 仅需满足
# prisma.config.ts 的非空校验，绝不通过 build-arg 传入真实连接串
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build_dummy"
ENV AUTH_SECRET=build-only-dummy
# 防止任意 build 期 .env 干扰（架构判定等）
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm exec prisma generate
RUN pnpm build

FROM node:22-slim AS run
ENV NODE_ENV=production
ENV CI=true
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
# 运行期需要 public/（career 页读 public/knowledge/*.md）
COPY --from=build --chown=node:node /app/public ./public
# 运行期 prisma migrate deploy 需要 CLI + schema + migrations + config
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/next.config.ts ./next.config.ts
COPY --from=build --chown=node:node /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
USER node
EXPOSE 4300
# 容器自检：健康探针无外部依赖，失败即由编排层重启
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4300/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm start -p 4300"]
