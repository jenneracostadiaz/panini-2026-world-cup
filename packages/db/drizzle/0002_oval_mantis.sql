-- Sprint 7: multi-user collection. Existing global collection rows are
-- discarded; per spec, collections are re-initialised at registration.
DELETE FROM "collection";--> statement-breakpoint

-- Drop legacy intro/museum stickers from prior seeds. New seed inserts
-- FWC-*, MUS-{year}, CC-* with different IDs; without this cleanup,
-- the orphan rows would inflate the sticker count past 906.
DELETE FROM "stickers" WHERE "id" LIKE 'INT-%';--> statement-breakpoint
DELETE FROM "stickers" WHERE "id" IN ('MUS-1','MUS-2','MUS-3','MUS-4','MUS-5','MUS-6','MUS-7','MUS-8','MUS-9','MUS-10','MUS-11');--> statement-breakpoint

ALTER TABLE "collection" DROP CONSTRAINT "collection_sticker_id_unique";--> statement-breakpoint
ALTER TABLE "collection" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_sticker_user_unique" UNIQUE("sticker_id","user_id");
