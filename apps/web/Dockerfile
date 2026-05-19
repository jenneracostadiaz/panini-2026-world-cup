# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* .npmrc* ./
COPY apps/web/package.json apps/web/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile=false

FROM deps AS build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXTAUTH_URL=$NEXTAUTH_URL \
    NEXTAUTH_SECRET=$NEXTAUTH_SECRET
COPY packages/typescript-config packages/typescript-config
COPY apps/web apps/web
RUN pnpm --filter @panini-tracker/web build

FROM node:20-alpine AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app

RUN apk add --no-cache wget && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/ || exit 1

CMD ["node", "apps/web/server.js"]
