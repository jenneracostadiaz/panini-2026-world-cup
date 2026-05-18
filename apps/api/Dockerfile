# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /repo

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* .npmrc* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile=false

FROM deps AS build
COPY packages packages
COPY apps/api apps/api
RUN pnpm --filter @panini-tracker/db build
RUN pnpm --filter @panini-tracker/api build

FROM node:20-alpine AS runner
ENV NODE_ENV=production PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
WORKDIR /repo

COPY --from=build /repo/pnpm-workspace.yaml /repo/package.json /repo/.npmrc* ./
COPY --from=build /repo/packages packages
COPY --from=build /repo/apps/api/package.json apps/api/package.json
COPY --from=build /repo/apps/api/dist apps/api/dist
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile=false

ENV PORT=3001
EXPOSE 3001
WORKDIR /repo/apps/api
CMD ["node", "dist/server.js"]
