# Panini Tracker 2026

Tracker para el álbum Panini del Mundial 2026: marcar pegadas, contar repetidas, generar un link público para intercambiar con amigos.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router, RSC, Turbopack), React 19, Tailwind CSS v4, shadcn/ui, Sonner |
| Backend | Hono sobre `@hono/node-server`, JWT (HS256), Zod |
| Auth | NextAuth v5 (Credentials), JWT de la API guardado en `session.apiToken` |
| DB | PostgreSQL + Drizzle ORM (`postgres-js`) |
| Build | pnpm workspaces (10.33.2), TypeScript 5.6, Node 20+ |
| Deploy | Docker multi-stage (Node 20 Alpine), Coolify |

## Estructura

```
.
├── apps
│   ├── api       # Hono API (puerto 3001)
│   └── web       # Next.js (puerto 3000)
├── packages
│   ├── db        # Drizzle schema + migraciones + cliente compartido
│   └── typescript-config  # tsconfigs base/nextjs/hono
├── .env.example
├── pnpm-workspace.yaml
└── package.json
```

Cada workspace expone los scripts `dev`, `build`, `lint`. La DB también expone `db:generate`, `db:migrate`, `db:studio`, `db:seed`.

## Desarrollo local

**Prerequisitos**: Node 20+, pnpm 10.33.2 (vía Corepack), PostgreSQL accesible.

```bash
# 1. clonar e instalar
pnpm install

# 2. configurar variables de entorno
cp .env.example .env
# editar .env: DATABASE_URL apuntando a tu Postgres local
# y opcionalmente cambiar JWT_SECRET y NEXTAUTH_SECRET

# 3. (sólo la primera vez) crear schema y semilla
pnpm db:migrate
pnpm db:seed
# crea admin@panini.local con el password de ADMIN_PASSWORD

# 4. levantar todo en paralelo
pnpm dev
# web: http://localhost:3000
# api: http://localhost:3001
```

**Loading de envs** — cada herramienta lee su propio archivo:

- Next (`apps/web`): lee `apps/web/.env.local` automáticamente. Copiá las vars `NEXT_PUBLIC_*` y `NEXTAUTH_*` ahí.
- `apps/api` y scripts de `packages/db`: cargan el `.env` raíz con `--env-file=../../.env`.
- `drizzle-kit`: lee `process.env.DATABASE_URL` del shell; exportá la var si vas a correr `db:studio` o `db:generate` manualmente.

## Deploy en Coolify

Orden de deploy: **DB → API → Web**. Coolify levanta cada servicio desde el Dockerfile del workspace; el monorepo es el build context.

### 1. PostgreSQL

Crear un recurso PostgreSQL desde Coolify (Resources → Databases → PostgreSQL). Versión 16+. Anotar la connection string interna; será el `DATABASE_URL` de la API.

### 2. API (`apps/api`)

- **Build pack**: Dockerfile
- **Dockerfile location**: `apps/api/Dockerfile`
- **Build context**: raíz del repo (`.`)
- **Port**: `3001`
- **Healthcheck**: ya viene en el Dockerfile (`wget http://localhost:3001/`)

Variables de entorno (Build + Runtime):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Connection string interna del Postgres de Coolify |
| `JWT_SECRET` | String aleatorio largo (≥32 chars). **Distinto de NEXTAUTH_SECRET** |
| `ALLOWED_ORIGIN` | Origen público del web service, ej. `https://panini.example.com` |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |

### 3. Web (`apps/web`)

- **Dockerfile location**: `apps/web/Dockerfile`
- **Build context**: raíz del repo
- **Port**: `3000`

Las vars `NEXT_PUBLIC_*` y `NEXTAUTH_*` se inyectan **al build time** (Next las hornea). En Coolify, pasalas como **Build Arguments**:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL pública de la API, ej. `https://api.panini.example.com` |
| `NEXT_PUBLIC_APP_URL` | URL pública de esta app, ej. `https://panini.example.com` |
| `NEXTAUTH_URL` | Igual que `NEXT_PUBLIC_APP_URL` |
| `NEXTAUTH_SECRET` | String aleatorio largo (≥32 chars). **Distinto de JWT_SECRET** |

Después del primer deploy, redeployá la web si cambiás cualquiera de esas (no basta con reiniciar — están horneadas en el bundle).

### 4. Verificar

```bash
# health de la api
curl https://api.panini.example.com/
# {"status":"ok","service":"panini-api"}

# health del web (sigue el redirect a /login)
curl -L https://panini.example.com/
```

Coolify marca los servicios como healthy cuando el `HEALTHCHECK` del Dockerfile retorna 0 — visible en el dashboard de cada container.

### Bootstrap de admin en producción

La primera vez, conectate a la DB de producción y corré la migración + seed:

```bash
DATABASE_URL=postgres://... \
ADMIN_EMAIL=admin@tudominio.com \
ADMIN_PASSWORD=$(openssl rand -base64 24) \
  pnpm db:migrate && pnpm db:seed
```

Guardá el password generado en tu password manager.

## Variables de entorno

| Variable | Donde se usa | Requerida | Descripción |
|---|---|---|---|
| `DATABASE_URL` | api, db scripts | sí | Postgres connection string |
| `JWT_SECRET` | api | sí | Firma los JWT que devuelve `/api/auth/login` (HS256). ≥8 chars |
| `PORT` | api | no (default 3001) | Puerto del servidor Hono |
| `ALLOWED_ORIGIN` | api | recomendado | Origen del web (CSV para múltiples). Sin esto, en producción se bloquea todo CORS |
| `NODE_ENV` | api | no | `development` \| `production` \| `test` |
| `NEXT_PUBLIC_API_URL` | web | sí | URL pública de la API (cliente + servidor) |
| `NEXT_PUBLIC_APP_URL` | web | sí | URL pública del propio web (usado en links de intercambio) |
| `NEXTAUTH_URL` | web | sí | Mismo valor que `NEXT_PUBLIC_APP_URL` |
| `NEXTAUTH_SECRET` | web | sí | Firma las sesiones de NextAuth. ≥8 chars. **Distinto de JWT_SECRET** |
| `ADMIN_EMAIL` | db seed | no (default `admin@panini.local`) | Email del admin que se crea al sembrar |
| `ADMIN_PASSWORD` | db seed | no (default `changeme123`) | Password inicial del admin |

## Comandos de DB

| Comando | Qué hace |
|---|---|
| `pnpm db:generate` | Genera una nueva migración a partir de `packages/db/src/schema.ts` |
| `pnpm db:migrate` | Aplica las migraciones pendientes contra `DATABASE_URL` |
| `pnpm db:seed` | Inserta equipos, stickers, colección y admin user (idempotente) |
| `pnpm db:studio` | Abre Drizzle Studio (UI web) contra la DB |

## Comandos útiles

```bash
pnpm dev               # web + api en paralelo
pnpm build             # build todo (db → api/web)
pnpm lint              # tsc --noEmit en cada workspace + next lint

# Filtrado por workspace
pnpm --filter @panini-tracker/api dev
pnpm --filter @panini-tracker/web build

# Docker (verificación local)
docker build -f apps/api/Dockerfile -t panini-api .
docker build -f apps/web/Dockerfile -t panini-web \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 \
  --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  --build-arg NEXTAUTH_URL=http://localhost:3000 \
  --build-arg NEXTAUTH_SECRET=changeme \
  .
```
