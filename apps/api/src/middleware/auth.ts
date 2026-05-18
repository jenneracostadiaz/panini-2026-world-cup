import type { MiddlewareHandler } from "hono";

// TODO: Sprint 3 — verify JWT via hono/jwt, attach c.set('user', payload)
// import { jwt } from 'hono/jwt';
// export const authMiddleware = jwt({ secret: process.env.JWT_SECRET! });

export const authMiddleware: MiddlewareHandler = async (_c, next) => {
  await next();
};
