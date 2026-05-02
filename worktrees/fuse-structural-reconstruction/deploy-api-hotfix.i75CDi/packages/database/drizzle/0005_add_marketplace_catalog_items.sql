CREATE TABLE IF NOT EXISTS "marketplace_catalog_items" (
  "id" text PRIMARY KEY NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "kind" varchar(40) NOT NULL,
  "category" varchar(120) NOT NULL,
  "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "rating" real DEFAULT 0 NOT NULL,
  "total_runs" integer DEFAULT 0 NOT NULL,
  "success_rate" real DEFAULT 0 NOT NULL,
  "price_per_run" real DEFAULT 0 NOT NULL,
  "status" varchar(20) DEFAULT 'online' NOT NULL,
  "publication_status" varchar(20) DEFAULT 'draft' NOT NULL,
  "launch_url" text,
  "avatar_url" text,
  "created_by" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "marketplace_catalog_items_slug_uq"
  ON "marketplace_catalog_items" ("slug");

CREATE INDEX IF NOT EXISTS "marketplace_catalog_items_kind_idx"
  ON "marketplace_catalog_items" ("kind");

CREATE INDEX IF NOT EXISTS "marketplace_catalog_items_publication_idx"
  ON "marketplace_catalog_items" ("publication_status");

CREATE INDEX IF NOT EXISTS "marketplace_catalog_items_updated_at_idx"
  ON "marketplace_catalog_items" ("updated_at");
