import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";

import { collection, db, stickers } from "../lib/db.js";
import type { AppEnv } from "../lib/env.js";
import { authMiddleware } from "../middleware/auth.js";

const app = new Hono<AppEnv>();

type SectionId = "intro" | "museum" | "cocacola";

const SECTION_META: Array<{ id: SectionId; name: string; description: string }> = [
  {
    id: "intro",
    name: "Presentación FIFA 2026",
    description: "Las figuritas introductorias del álbum.",
  },
  {
    id: "museum",
    name: "Historia del Mundial",
    description: "Un foil por cada Copa del Mundo desde 1930.",
  },
  {
    id: "cocacola",
    name: "Coca-Cola",
    description: "Edición especial Coca-Cola.",
  },
];

app.get("/special-sections", authMiddleware, async (c) => {
  const userId = c.get("user").sub;
  const ids = SECTION_META.map((s) => s.id);

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
    .leftJoin(
      collection,
      and(
        eq(collection.stickerId, stickers.id),
        eq(collection.userId, userId),
      ),
    )
    .where(inArray(stickers.section, ids))
    .orderBy(stickers.position);

  const bySection = new Map<SectionId, typeof stickerRows>();
  for (const row of stickerRows) {
    const id = row.section as SectionId;
    const list = bySection.get(id) ?? [];
    list.push(row);
    bySection.set(id, list);
  }

  return c.json(
    SECTION_META.map((meta) => {
      const items = (bySection.get(meta.id) ?? []).map((s) => ({
        id: s.id,
        playerName: s.playerName,
        position: s.position,
        isFoil: s.isFoil,
        status: (s.status ?? "missing") as "owned" | "missing",
        quantity: s.quantity ?? 0,
      }));
      const total = items.length;
      const owned = items.filter((s) => s.status === "owned").length;
      const repeated = items.reduce(
        (acc, s) => acc + (s.quantity > 1 ? s.quantity - 1 : 0),
        0,
      );
      return {
        id: meta.id,
        name: meta.name,
        description: meta.description,
        total,
        owned,
        repeated,
        progressPct: total > 0 ? Math.round((owned / total) * 100) : 0,
        stickers: items,
      };
    }),
  );
});

export default app;
