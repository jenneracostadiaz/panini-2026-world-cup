import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { env } from "./lib/env.js";
import authRoute from "./routes/auth.js";
import collectionRoute from "./routes/collection.js";
import exchangeRoute from "./routes/exchange.js";
import importExportRoute from "./routes/import-export.js";
import specialSectionsRoute from "./routes/special-sections.js";
import stickersRoute from "./routes/stickers.js";
import teamsRoute from "./routes/teams.js";

const app = new Hono();

app.use("*", logger());

app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
});

const allowedOrigins = (env.ALLOWED_ORIGIN ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOrigin: (origin: string) => string | null =
  allowedOrigins.length > 0
    ? (origin) => (allowedOrigins.includes(origin) ? origin : null)
    : env.NODE_ENV === "production"
      ? () => null
      : (origin) => origin;

app.use(
  "*",
  cors({
    origin: corsOrigin,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  }),
);

app.get("/", (c) =>
  c.json({ status: "ok", service: "panini-api" }),
);

app.route("/api", authRoute);
app.route("/api", teamsRoute);
app.route("/api", stickersRoute);
app.route("/api", collectionRoute);
app.route("/api", importExportRoute);
app.route("/api", exchangeRoute);
app.route("/api", specialSectionsRoute);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  console.error("[api error]", err);
  return c.json({ error: "Internal server error" }, 500);
});

serve({ fetch: app.fetch, port: env.PORT }, ({ port: boundPort }) => {
  console.log(`panini-api listening on http://localhost:${boundPort}`);
});

export default app;
