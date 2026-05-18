import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import authRoute from "./routes/auth.js";
import collectionRoute from "./routes/collection.js";
import exchangeRoute from "./routes/exchange.js";
import importExportRoute from "./routes/import-export.js";
import stickersRoute from "./routes/stickers.js";
import teamsRoute from "./routes/teams.js";

const app = new Hono();

app.use("*", logger());

const allowedOrigins = (process.env.WEB_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  "*",
  cors({
    origin: (origin) =>
      origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0] ?? "*",
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

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  console.error("[api error]", err);
  return c.json({ error: "Internal server error" }, 500);
});

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, ({ port: boundPort }) => {
  console.log(`panini-api listening on http://localhost:${boundPort}`);
});

export default app;
