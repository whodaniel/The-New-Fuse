CREATE TABLE IF NOT EXISTS "spaces" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "name" varchar(255) NOT NULL,
  "subdomain" varchar(63) NOT NULL,
  "custom_domains" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "plan" varchar(32) DEFAULT 'free' NOT NULL,
  "status" varchar(32) DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "space_routes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "space_id" uuid NOT NULL,
  "path" varchar(512) NOT NULL,
  "route_type" varchar(16) NOT NULL,
  "code" text NOT NULL,
  "is_public" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "space_assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "space_id" uuid NOT NULL,
  "asset_path" varchar(512) NOT NULL,
  "file_size" integer NOT NULL,
  "mime_type" varchar(255) NOT NULL,
  "storage_key" text NOT NULL,
  "uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'spaces_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "spaces"
    ADD CONSTRAINT "spaces_user_id_users_id_fk"
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
    WHERE conname = 'space_routes_space_id_spaces_id_fk'
  ) THEN
    ALTER TABLE "space_routes"
    ADD CONSTRAINT "space_routes_space_id_spaces_id_fk"
    FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id")
    ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'space_assets_space_id_spaces_id_fk'
  ) THEN
    ALTER TABLE "space_assets"
    ADD CONSTRAINT "space_assets_space_id_spaces_id_fk"
    FOREIGN KEY ("space_id") REFERENCES "public"."spaces"("id")
    ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "spaces_subdomain_unique" ON "spaces" ("subdomain");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "space_routes_space_id_path_unique" ON "space_routes" ("space_id","path");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "space_assets_space_id_asset_path_unique" ON "space_assets" ("space_id","asset_path");
