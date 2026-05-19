import { zValidator } from "@hono/zod-validator";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { z } from "zod";

import { collection, db, stickers, users } from "../lib/db.js";
import { env } from "../lib/env.js";
import { errorResponse } from "../lib/errors.js";
import { rateLimit } from "../middleware/rate-limit.js";

const app = new Hono();

const loginRateLimit = rateLimit({
  windowMs: 60_000,
  max: 10,
  keyPrefix: "auth-login",
});

const registerRateLimit = rateLimit({
  windowMs: 60_000,
  max: 5,
  keyPrefix: "auth-register",
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

const JWT_TTL_SECONDS = 60 * 60 * 24 * 7;

async function issueToken(user: { id: string; email: string }) {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    { sub: user.id, email: user.email, iat: now, exp: now + JWT_TTL_SECONDS },
    env.JWT_SECRET,
  );
}

app.post(
  "/auth/login",
  loginRateLimit,
  zValidator("json", loginSchema, (result, c) => {
    if (!result.success) return errorResponse(c, 400, "Invalid request body");
  }),
  async (c) => {
    const { email, password } = c.req.valid("json");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) return errorResponse(c, 401, "Invalid credentials");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return errorResponse(c, 401, "Invalid credentials");

    const token = await issueToken(user);

    return c.json({
      token,
      user: { id: user.id, email: user.email },
    });
  },
);

app.post(
  "/auth/register",
  registerRateLimit,
  zValidator("json", registerSchema, (result, c) => {
    if (!result.success) {
      const issue = result.error.issues[0];
      return errorResponse(c, 400, issue?.message ?? "Datos inválidos");
    }
  }),
  async (c) => {
    const { email, password } = c.req.valid("json");

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) {
      return errorResponse(c, 409, "El email ya está registrado");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [created] = await db
      .insert(users)
      .values({ email, password: passwordHash })
      .returning({ id: users.id, email: users.email });

    if (!created) return errorResponse(c, 500, "No se pudo crear el usuario");

    const stickerRows = await db
      .select({ id: stickers.id })
      .from(stickers);
    const initialRows = stickerRows.map((s) => ({
      stickerId: s.id,
      userId: created.id,
      status: "missing",
      quantity: 0,
    }));

    const batchSize = 100;
    for (let i = 0; i < initialRows.length; i += batchSize) {
      await db
        .insert(collection)
        .values(initialRows.slice(i, i + batchSize));
    }

    const token = await issueToken(created);
    return c.json({
      token,
      user: { id: created.id, email: created.email },
    });
  },
);

export default app;
