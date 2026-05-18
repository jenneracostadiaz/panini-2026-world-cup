import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: url ?? "postgresql://user:password@localhost:5432/panini_tracker",
  },
  strict: true,
  verbose: true,
});
