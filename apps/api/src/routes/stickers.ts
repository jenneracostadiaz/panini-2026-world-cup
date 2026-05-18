import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { collection, db } from "../lib/db.js";
import type { AppEnv } from "../lib/env.js";
import { errorResponse } from "../lib/errors.js";
import { authMiddleware } from "../middleware/auth.js";

const app = new Hono<AppEnv>();

const updateSchema = z.object({
  status: z.enum(["owned", "missing"]),
  quantity: z.number().int().min(0),
});

app.patch(
  "/stickers/:id",
  authMiddleware,
  zValidator("json", updateSchema, (result, c) => {
    if (!result.success) return errorResponse(c, 400, "Invalid request body");
  }),
  async (c) => {
    const id = c.req.param("id");
    let { status, quantity } = c.req.valid("json");

    if (status === "missing") quantity = 0;
    if (status === "owned" && quantity === 0) quantity = 1;

    const [updated] = await db
      .update(collection)
      .set({ status, quantity, updatedAt: new Date() })
      .where(eq(collection.stickerId, id))
      .returning();

    if (!updated) return errorResponse(c, 404, "Sticker not found");
    return c.json(updated);
  },
);

export default app;
