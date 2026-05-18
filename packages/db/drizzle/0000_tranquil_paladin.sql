CREATE TABLE "collection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sticker_id" text NOT NULL,
	"status" text DEFAULT 'missing' NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_sticker_id_unique" UNIQUE("sticker_id")
);
--> statement-breakpoint
CREATE TABLE "public_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text DEFAULT gen_random_uuid()::text NOT NULL,
	"label" text,
	"contact_info" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "public_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "stickers" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text,
	"player_name" text NOT NULL,
	"position" integer NOT NULL,
	"is_foil" boolean DEFAULT false NOT NULL,
	"section" text DEFAULT 'team' NOT NULL,
	"icon" text
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"flag_code" text NOT NULL,
	"color" text NOT NULL,
	"confederation" text NOT NULL,
	"conf_name" text NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_sticker_id_stickers_id_fk" FOREIGN KEY ("sticker_id") REFERENCES "public"."stickers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stickers" ADD CONSTRAINT "stickers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;