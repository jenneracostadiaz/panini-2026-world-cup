import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) =>
  c.json({
    status: "ok",
    service: "panini-api",
  }),
);

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, ({ port: boundPort }) => {
  console.log(`panini-api listening on http://localhost:${boundPort}`);
});

export default app;
