import { zValidator } from "@hono/zod-validator";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { z } from "zod";

import { db, users } from "../lib/db.js";
import { errorResponse } from "../lib/errors.js";

const app = new Hono();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

app.post(
  "/auth/login",
  zValidator("json", loginSchema, (result, c) => {
    if (!result.success) return errorResponse(c, 400, "Invalid request body");
  }),
  async (c) => {
    const { email, password } = c.req.valid("json");
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("[auth] JWT_SECRET is not set");
      return errorResponse(c, 500, "Internal server error");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) return errorResponse(c, 401, "Invalid credentials");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return errorResponse(c, 401, "Invalid credentials");

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 60 * 60 * 24 * 7;
    const token = await sign(
      { sub: user.id, email: user.email, iat: now, exp },
      secret,
    );

    return c.json({
      token,
      user: { id: user.id, email: user.email },
    });
  },
);

export default app;
