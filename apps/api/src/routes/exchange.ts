import { zValidator } from "@hono/zod-validator";
import { eq, gt, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import {
  collection,
  db,
  publicTokens,
  stickers,
  teams,
} from "../lib/db.js";
import { errorResponse } from "../lib/errors.js";

const app = new Hono();

const tokenSchema = z.object({
  label: z.string().min(1),
  contactInfo: z.string().optional(),
});

// Public — no auth even in Sprint 3
app.get("/exchange/:token", async (c) => {
  const tokenParam = c.req.param("token");

  const [tokenRow] = await db
    .select()
    .from(publicTokens)
    .where(eq(publicTokens.token, tokenParam))
    .limit(1);

  if (!tokenRow) return errorResponse(c, 404, "Token not found");

  const repeatedRows = await db
    .select({
      teamId: teams.id,
      teamName: teams.name,
      teamFlag: teams.flagCode,
      teamSort: teams.sortOrder,
      stickerId: stickers.id,
      playerName: stickers.playerName,
      position: stickers.position,
      quantity: collection.quantity,
    })
    .from(collection)
    .innerJoin(stickers, eq(stickers.id, collection.stickerId))
    .innerJoin(teams, eq(teams.id, stickers.teamId))
    .where(gt(collection.quantity, 1))
    .orderBy(teams.sortOrder, stickers.position);

  const summaryRows = await db
    .select({ max: sql<Date | null>`MAX(${collection.updatedAt})` })
    .from(collection);
  const maxUpdated = summaryRows[0]?.max ?? null;

  const grouped = new Map<
    string,
    {
      teamId: string;
      teamName: string;
      teamFlag: string;
      stickers: Array<{
        id: string;
        playerName: string;
        position: number;
        quantity: number;
      }>;
    }
  >();

  for (const r of repeatedRows) {
    let group = grouped.get(r.teamId);
    if (!group) {
      group = {
        teamId: r.teamId,
        teamName: r.teamName,
        teamFlag: r.teamFlag,
        stickers: [],
      };
      grouped.set(r.teamId, group);
    }
    group.stickers.push({
      id: r.stickerId,
      playerName: r.playerName,
      position: r.position,
      quantity: r.quantity - 1,
    });
  }

  return c.json({
    label: tokenRow.label,
    contactInfo: tokenRow.contactInfo,
    updatedAt: new Date(maxUpdated ?? tokenRow.createdAt).toISOString(),
    repeated: Array.from(grouped.values()),
  });
});

// TODO: Sprint 3 — app.use(authMiddleware) for the POST below only
app.post(
  "/exchange/token",
  zValidator("json", tokenSchema, (result, c) => {
    if (!result.success) return errorResponse(c, 400, "Invalid request body");
  }),
  async (c) => {
    const { label, contactInfo } = c.req.valid("json");

    const [existing] = await db
      .select()
      .from(publicTokens)
      .orderBy(publicTokens.createdAt)
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(publicTokens)
        .set({ label, contactInfo: contactInfo ?? null })
        .where(eq(publicTokens.id, existing.id))
        .returning();
      return c.json({
        token: updated!.token,
        label: updated!.label,
        contactInfo: updated!.contactInfo,
      });
    }

    const [created] = await db
      .insert(publicTokens)
      .values({ label, contactInfo: contactInfo ?? null })
      .returning();

    return c.json({
      token: created!.token,
      label: created!.label,
      contactInfo: created!.contactInfo,
    });
  },
);

export default app;
