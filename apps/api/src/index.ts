import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";

import collectionRoute from "./routes/collection.js";
import exchangeRoute from "./routes/exchange.js";
import importExportRoute from "./routes/import-export.js";
import stickersRoute from "./routes/stickers.js";
import teamsRoute from "./routes/teams.js";

const app = new Hono();

app.use("*", logger());

app.get("/", (c) =>
  c.json({ status: "ok", service: "panini-api" }),
);

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
