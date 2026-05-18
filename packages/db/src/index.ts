import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.js";

type DbSchema = typeof schema;
type Database = PostgresJsDatabase<DbSchema>;

declare global {
  // eslint-disable-next-line no-var
  var __paniniDb: { db: Database; client: ReturnType<typeof postgres> } | undefined;
}

function createDb(): { db: Database; client: ReturnType<typeof postgres> } {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const client = postgres(url, { prepare: false });
  const db = drizzle(client, { schema });
  return { db, client };
}

const instance = globalThis.__paniniDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalThis.__paniniDb = instance;
}

export const db: Database = instance.db;
export const sqlClient = instance.client;

export * from "./schema.js";
