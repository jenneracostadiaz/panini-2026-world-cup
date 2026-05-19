import type { MiddlewareHandler } from "hono";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyPrefix: string;
};

function clientKey(c: Parameters<MiddlewareHandler>[0], prefix: string): string {
  const fwd = c.req.header("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || c.req.header("x-real-ip") || "unknown";
  return `${prefix}:${ip}`;
}

export function rateLimit(opts: RateLimitOptions): MiddlewareHandler {
  return async (c, next) => {
    const now = Date.now();
    const key = clientKey(c, opts.keyPrefix);
    const bucket = buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    } else {
      bucket.count += 1;
      if (bucket.count > opts.max) {
        const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
        c.header("Retry-After", String(retryAfter));
        return c.json(
          { error: "Too many requests", retryAfter },
          429,
        );
      }
    }

    await next();
  };
}
