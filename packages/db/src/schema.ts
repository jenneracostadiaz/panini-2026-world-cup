import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  flagCode: text("flag_code").notNull(),
  color: text("color").notNull(),
  confederation: text("confederation").notNull(),
  confName: text("conf_name").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const stickers = pgTable("stickers", {
  id: text("id").primaryKey(),
  teamId: text("team_id").references(() => teams.id, { onDelete: "cascade" }),
  playerName: text("player_name").notNull(),
  position: integer("position").notNull(),
  isFoil: boolean("is_foil").notNull().default(false),
  section: text("section").notNull().default("team"),
  icon: text("icon"),
});

export const collection = pgTable("collection", {
  id: uuid("id").primaryKey().defaultRandom(),
  stickerId: text("sticker_id")
    .notNull()
    .unique()
    .references(() => stickers.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("missing"),
  quantity: integer("quantity").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const publicTokens = pgTable("public_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token")
    .notNull()
    .unique()
    .default(sql`gen_random_uuid()::text`),
  label: text("label"),
  contactInfo: text("contact_info"),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export type Sticker = typeof stickers.$inferSelect;
export type NewSticker = typeof stickers.$inferInsert;

export type CollectionEntry = typeof collection.$inferSelect;
export type NewCollectionEntry = typeof collection.$inferInsert;

export type PublicToken = typeof publicTokens.$inferSelect;
export type NewPublicToken = typeof publicTokens.$inferInsert;
