import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { collection, db, stickers, toISOString } from "../lib/db.js";
import type { AppEnv } from "../lib/env.js";
import { errorResponse } from "../lib/errors.js";
import { authMiddleware } from "../middleware/auth.js";

const app = new Hono<AppEnv>();

const importSchema = z.object({
  collection: z.array(
    z.object({
      stickerId: z.string().min(1),
      status: z.enum(["owned", "missing"]),
      quantity: z.number().int().min(0),
    }),
  ),
});

app.get("/collection/export", authMiddleware, async (c) => {
  const userId = c.get("user").sub;

  const rows = await db
    .select({
      stickerId: collection.stickerId,
      status: collection.status,
      quantity: collection.quantity,
    })
    .from(collection)
    .where(eq(collection.userId, userId))
    .orderBy(collection.stickerId);

  return c.json({
    exportedAt: toISOString(new Date()),
    collection: rows,
  });
});

app.post(
  "/collection/import",
  authMiddleware,
  zValidator("json", importSchema, (result, c) => {
    if (!result.success) return errorResponse(c, 400, "Invalid request body");
  }),
  async (c) => {
    const { collection: entries } = c.req.valid("json");
    const userId = c.get("user").sub;

    const existing = await db
      .select({ id: stickers.id })
      .from(stickers);
    const validIds = new Set(existing.map((s) => s.id));

    const errors: string[] = [];
    let imported = 0;

    for (const e of entries) {
      if (!validIds.has(e.stickerId)) {
        errors.push(`${e.stickerId}: sticker does not exist`);
        continue;
      }
      try {
        const normalizedQty =
          e.status === "missing" ? 0 : Math.max(e.quantity, 1);
        await db
          .insert(collection)
          .values({
            stickerId: e.stickerId,
            userId,
            status: e.status,
            quantity: normalizedQty,
          })
          .onConflictDoUpdate({
            target: [collection.stickerId, collection.userId],
            set: {
              status: e.status,
              quantity: normalizedQty,
              updatedAt: new Date(),
            },
          });
        imported++;
      } catch (err) {
        errors.push(`${e.stickerId}: ${(err as Error).message}`);
      }
    }

    return c.json({ imported, errors });
  },
);

export default app;
