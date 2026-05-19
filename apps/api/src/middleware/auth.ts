import type { MiddlewareHandler } from "hono";
import { verify } from "hono/jwt";

import { env, type AppEnv, type AuthUser } from "../lib/env.js";
import { errorResponse } from "../lib/errors.js";

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return errorResponse(c, 401, "Unauthorized");
  }

  const token = header.slice(7).trim();

  try {
    const payload = (await verify(token, env.JWT_SECRET, "HS256")) as AuthUser;
    c.set("user", payload);
    await next();
  } catch {
    return errorResponse(c, 401, "Unauthorized");
  }
};
