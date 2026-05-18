import { zValidator } from "@hono/zod-validator";
import { eq, inArray, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { collection, db, stickers, teams } from "../lib/db.js";
import type { AppEnv } from "../lib/env.js";
import { errorResponse } from "../lib/errors.js";
import { authMiddleware } from "../middleware/auth.js";

const app = new Hono<AppEnv>();

const bulkSchema = z.object({
  status: z.enum(["owned", "missing"]),
});

const validatorErrorHook = (
  result: { success: boolean },
  c: Parameters<Parameters<typeof zValidator>[2] & object>[1],
) => {
  if (!result.success) return errorResponse(c, 400, "Invalid request body");
};

app.get("/teams", authMiddleware, async (c) => {
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      code: teams.code,
      flagCode: teams.flagCode,
      color: teams.color,
      confederation: teams.confederation,
      confName: teams.confName,
      total: sql<number>`COUNT(${stickers.id})::int`,
      owned: sql<number>`COUNT(CASE WHEN ${collection.status} = 'owned' THEN 1 END)::int`,
      missing: sql<number>`COUNT(CASE WHEN ${collection.status} = 'missing' THEN 1 END)::int`,
      repeated: sql<number>`COALESCE(SUM(CASE WHEN ${collection.quantity} > 1 THEN ${collection.quantity} - 1 ELSE 0 END), 0)::int`,
    })
    .from(teams)
    .leftJoin(stickers, eq(stickers.teamId, teams.id))
    .leftJoin(collection, eq(collection.stickerId, stickers.id))
    .groupBy(teams.id)
    .orderBy(teams.sortOrder);

  const grouped = new Map<
    string,
    { confederation: string; confName: string; teams: typeof out }
  >();
  const out: Array<
    Omit<(typeof rows)[number], "total" | "owned" | "missing" | "repeated"> & {
      total: number;
      owned: number;
      missing: number;
      repeated: number;
      progressPct: number;
    }
  > = [];

  for (const r of rows) {
    const progressPct =
      r.total > 0 ? Math.round((r.owned / r.total) * 100) : 0;
    const teamEntry = { ...r, progressPct };
    let group = grouped.get(r.confederation);
    if (!group) {
      group = { confederation: r.confederation, confName: r.confName, teams: [] };
      grouped.set(r.confederation, group);
    }
    group.teams.push(teamEntry);
  }

  return c.json(Array.from(grouped.values()));
});

app.get("/teams/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const [team] = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
  if (!team) return errorResponse(c, 404, "Team not found");

  const stickerRows = await db
    .select({
      id: stickers.id,
      playerName: stickers.playerName,
      position: stickers.position,
      isFoil: stickers.isFoil,
      section: stickers.section,
      status: collection.status,
      quantity: collection.quantity,
    })
    .from(stickers)
    .leftJoin(collection, eq(collection.stickerId, stickers.id))
    .where(eq(stickers.teamId, id))
    .orderBy(stickers.position);

  return c.json({
    ...team,
    stickers: stickerRows.map((s) => ({
      ...s,
      status: s.status ?? "missing",
      quantity: s.quantity ?? 0,
    })),
  });
});

app.patch(
  "/teams/:id/stickers/bulk",
  authMiddleware,
  zValidator("json", bulkSchema, validatorErrorHook),
  async (c) => {
    const id = c.req.param("id");
    const { status } = c.req.valid("json");

    const [team] = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.id, id))
      .limit(1);
    if (!team) return errorResponse(c, 404, "Team not found");

    const stickerIds = await db
      .select({ id: stickers.id })
      .from(stickers)
      .where(eq(stickers.teamId, id));

    if (stickerIds.length === 0) return c.json({ updated: 0 });

    const ids = stickerIds.map((s) => s.id);

    const updated = await db
      .update(collection)
      .set({
        status,
        quantity:
          status === "missing"
            ? 0
            : sql`GREATEST(${collection.quantity}, 1)`,
        updatedAt: new Date(),
      })
      .where(inArray(collection.stickerId, ids))
      .returning({ id: collection.id });

    return c.json({ updated: updated.length });
  },
);

export default app;
