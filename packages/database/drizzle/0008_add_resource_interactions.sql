CREATE TABLE IF NOT EXISTS "resource_favorites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "resource_id" varchar(255) NOT NULL,
  "user_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resource_shares" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "resource_id" varchar(255) NOT NULL,
  "from_user_id" uuid NOT NULL,
  "to_agent_id" varchar(255) NOT NULL,
  "notes" text,
  "shared_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'resource_favorites_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "resource_favorites"
    ADD CONSTRAINT "resource_favorites_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'resource_shares_from_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "resource_shares"
    ADD CONSTRAINT "resource_shares_from_user_id_users_id_fk"
    FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "resource_favorites_resource_user_unique" ON "resource_favorites" ("resource_id","user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_resource_favorites_user_id" ON "resource_favorites" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_resource_favorites_resource_id" ON "resource_favorites" ("resource_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_resource_shares_from_user_id" ON "resource_shares" ("from_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_resource_shares_to_agent_id" ON "resource_shares" ("to_agent_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_resource_shares_resource_id" ON "resource_shares" ("resource_id");
