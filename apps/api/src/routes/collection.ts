import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";

import { collection, db } from "../lib/db.js";
import type { AppEnv } from "../lib/env.js";
import { authMiddleware } from "../middleware/auth.js";

const app = new Hono<AppEnv>();

app.get("/collection/summary", authMiddleware, async (c) => {
  const userId = c.get("user").sub;

  const [row] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      owned: sql<number>`COUNT(CASE WHEN ${collection.status} = 'owned' THEN 1 END)::int`,
      missing: sql<number>`COUNT(CASE WHEN ${collection.status} = 'missing' THEN 1 END)::int`,
      repeated: sql<number>`COALESCE(SUM(CASE WHEN ${collection.quantity} > 1 THEN ${collection.quantity} - 1 ELSE 0 END), 0)::int`,
    })
    .from(collection)
    .where(eq(collection.userId, userId));

  const total = row?.total ?? 0;
  const owned = row?.owned ?? 0;
  const progressPct = total > 0 ? Math.round((owned / total) * 100) : 0;

  return c.json({
    total,
    owned,
    missing: row?.missing ?? 0,
    repeated: row?.repeated ?? 0,
    progressPct,
  });
});

export default app;
