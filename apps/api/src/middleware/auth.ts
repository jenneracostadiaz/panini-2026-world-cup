import type { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";

import type { AppEnv, AuthUser } from "../lib/env.js";
import { errorResponse } from "../lib/errors.js";

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return errorResponse(c, 401, "Unauthorized");
  }

  const token = header.slice(7).trim();
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("[auth] JWT_SECRET is not set");
    return errorResponse(c, 500, "Internal server error");
  }

  try {
    const payload = (await verify(token, secret, "HS256")) as AuthUser;
    c.set("user", payload);
    await next();
  } catch {
    return errorResponse(c, 401, "Unauthorized");
  }
};
