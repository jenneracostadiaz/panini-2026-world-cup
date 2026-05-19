# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack & layout

pnpm monorepo (pnpm 10.33.2, Node ≥20) with three workspaces:

- `apps/web` — Next.js 16 app router, React 19, Tailwind v4, NextAuth v5 (beta). Renders the UI and proxies auth to the API.
- `apps/api` — Hono on `@hono/node-server`, JWT auth, zod validation, Drizzle ORM. Listens on `PORT` (default 3001).
- `packages/db` — Drizzle schema, `postgres-js` client, migrations, and seed. Exported as `@panini-tracker/db` (built to `dist/`).
- `packages/typescript-config` — shared `tsconfig` bases (`base.json`, `nextjs.json`, `hono.json`). All apps extend these.

The product is a Panini sticker album tracker for World Cup 2026 (one admin user, public exchange links for sharing duplicates).

## Common commands

Run from repo root unless noted:

```bash
pnpm dev                # parallel: web (3000) + api (3001)
pnpm build              # build all workspaces (db must build before api/web type-check)
pnpm lint               # tsc --noEmit per workspace + next lint for web

pnpm db:generate        # drizzle-kit generate (after schema.ts edits)
pnpm db:migrate         # apply migrations against DATABASE_URL
pnpm db:studio          # drizzle studio
pnpm db:seed            # seed teams/stickers/collection + admin user
```

Single-workspace work:

```bash
pnpm --filter @panini-tracker/api dev
pnpm --filter @panini-tracker/api lint        # tsc --noEmit
pnpm --filter @panini-tracker/web build
```

No test runner is wired up. "Lint" means `tsc --noEmit` (plus `next lint` for web).

## Environment loading (gotcha)

There is **no shared env loader** — each tool reads env its own way:

- `apps/web` (Next): reads `apps/web/.env.local` automatically. Do **not** rely on root `.env` for the web app.
- `apps/api` and `packages/db` scripts: use `tsx --env-file=../../.env` (see their `package.json`). The root `.env` is the source of truth here.
- `drizzle-kit` (generate/studio): reads `process.env.DATABASE_URL` from whatever shell invokes it; the root `package.json` script doesn't load `.env`, so export it or run via a wrapper that does.

When adding a new env var, update `.env.example` and remember web needs it copied into `apps/web/.env.local` (and prefixed `NEXT_PUBLIC_` if used client-side).

Required vars: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Optional: `ALLOWED_ORIGIN` (CORS), `PORT`, `NODE_ENV`.

Both apps validate env at startup via Zod (`apps/api/src/lib/env.ts` and `apps/web/src/lib/env.ts`) — missing or malformed vars cause `process.exit(1)` at import time. Import `env` from those files rather than reading `process.env` directly.

## Auth architecture (two-token model)

1. User submits credentials to the Next.js login page.
2. NextAuth Credentials `authorize` callback (`apps/web/src/auth.ts`) POSTs to `apps/api` `/api/auth/login`, which returns a `{ token, user }` JWT signed with `JWT_SECRET` (HS256, 7-day exp).
3. The API JWT is stashed on the NextAuth session as `session.apiToken` (typed in `apps/web/src/types/next-auth.d.ts`).
4. All client/server calls to the API go through `apps/web/src/lib/api.ts#apiFetch`, which attaches `Authorization: Bearer <session.apiToken>` and redirects to `/login` on 401.
5. The API's `authMiddleware` (`apps/api/src/middleware/auth.ts`) verifies the JWT and sets `c.var.user: AuthUser` (`{ sub, email, iat, exp }`).

Next proxy (`apps/web/src/proxy.ts`, formerly `middleware.ts`) only gates `/dashboard/*` — everything else is open at the Next layer; the API enforces its own auth. Client-side `apiFetch` (in `apps/web/src/lib/api.ts`) handles 401 by toasting "Sesión expirada" and calling `signOut({ redirectTo: '/login' })`.

## API routing convention (load-bearing)

In `apps/api/src/index.ts`, every sub-router is mounted at the same `/api` prefix via `app.route("/api", subApp)`. To keep auth scoped correctly:

- **Do not** use `app.use("*", authMiddleware)` inside a sub-router. With Hono, that middleware bleeds across sibling sub-apps mounted at the same prefix and will protect (or break) routes you did not intend to touch.
- **Always** attach `authMiddleware` per-route: `app.get("/teams", authMiddleware, handler)`.
- The public exchange endpoint `GET /api/exchange/:token` is intentionally unauthenticated. Keep it that way — the whole point is that someone can read your duplicates list without an account.
- The `/api/auth/login` route has a per-route in-memory rate limit (`middleware/rate-limit.ts`, 10 req/min/IP). Rate-limit is attached inside the sub-app, not at the root, to avoid leaking across sibling routers.

Validation uses `@hono/zod-validator` with a hook that returns `errorResponse(c, 400, "Invalid request body")`. Errors flow through `lib/errors.ts#errorResponse`.

## Database

- Schema: `packages/db/src/schema.ts`. Tables: `users`, `teams`, `stickers`, `collection` (one row per sticker, status + quantity), `public_tokens` (one per user, used for `/exchange/:token`).
- `packages/db/src/index.ts` exports a singleton `db` (cached on `globalThis` outside production to survive Next dev HMR).
- Migrations live in `packages/db/drizzle/` and are generated by `pnpm db:generate`. Apply with `pnpm db:migrate`.
- Seeding (`packages/db/src/seed.ts`) is idempotent (`onConflictDoNothing`). It also creates the admin user from `ADMIN_EMAIL`/`ADMIN_PASSWORD` if missing.
- `packages/db` is a built package: consumers import from `@panini-tracker/db` (resolved to `dist/`). After editing schema, run `pnpm --filter @panini-tracker/db build` before the API/web type-checks will see the changes.

## Conventions

- All TS in workspaces uses `"type": "module"` (api, db) or Next's defaults (web). Imports across the api use explicit `.js` extensions because tsc emits ESM.
- `noUncheckedIndexedAccess` is on — array/record lookups are `T | undefined`. Existing code uses `const [row] = await db.select()...` then `if (!row) return errorResponse(...)`. Follow that pattern.
- Spanish-language UI strings (e.g. "Iniciar sesión", "Credenciales inválidas") are intentional — this is a Spanish-language app.
