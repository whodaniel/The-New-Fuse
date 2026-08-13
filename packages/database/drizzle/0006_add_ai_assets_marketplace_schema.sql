CREATE SCHEMA IF NOT EXISTS "ai_assets_marketplace";

CREATE TABLE IF NOT EXISTS "ai_assets_marketplace"."categories" (
  "id" integer PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_assets_categories_name_uq"
  ON "ai_assets_marketplace"."categories" ("name");

CREATE TABLE IF NOT EXISTS "ai_assets_marketplace"."sources" (
  "id" integer PRIMARY KEY NOT NULL,
  "category_id" integer NOT NULL,
  "name" text NOT NULL,
  "url" text NOT NULL,
  "title" text,
  "brief" text,
  "source_type" varchar(80),
  "created_at" text,
  "updated_at" text
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_assets_sources_name_url_uq"
  ON "ai_assets_marketplace"."sources" ("name", "url");
CREATE INDEX IF NOT EXISTS "ai_assets_sources_category_id_idx"
  ON "ai_assets_marketplace"."sources" ("category_id");
CREATE INDEX IF NOT EXISTS "ai_assets_sources_url_idx"
  ON "ai_assets_marketplace"."sources" ("url");

CREATE TABLE IF NOT EXISTS "ai_assets_marketplace"."source_links" (
  "id" integer PRIMARY KEY NOT NULL,
  "source_id" integer NOT NULL,
  "link_url" text NOT NULL,
  "anchor" text
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_assets_source_links_source_url_uq"
  ON "ai_assets_marketplace"."source_links" ("source_id", "link_url");
CREATE INDEX IF NOT EXISTS "ai_assets_source_links_source_id_idx"
  ON "ai_assets_marketplace"."source_links" ("source_id");
CREATE INDEX IF NOT EXISTS "ai_assets_source_links_link_url_idx"
  ON "ai_assets_marketplace"."source_links" ("link_url");

CREATE TABLE IF NOT EXISTS "ai_assets_marketplace"."prompts" (
  "id" integer PRIMARY KEY NOT NULL,
  "source_id" integer NOT NULL,
  "title" text,
  "prompt_text" text NOT NULL,
  "prompt_hash" varchar(128) NOT NULL,
  "url" text,
  "license" text,
  "tags" text,
  "created_at" text
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_assets_prompts_source_hash_uq"
  ON "ai_assets_marketplace"."prompts" ("source_id", "prompt_hash");
CREATE INDEX IF NOT EXISTS "ai_assets_prompts_source_id_idx"
  ON "ai_assets_marketplace"."prompts" ("source_id");
CREATE INDEX IF NOT EXISTS "ai_assets_prompts_prompt_hash_idx"
  ON "ai_assets_marketplace"."prompts" ("prompt_hash");

CREATE TABLE IF NOT EXISTS "ai_assets_marketplace"."artifacts" (
  "filename" text PRIMARY KEY NOT NULL,
  "content_type" text NOT NULL,
  "content_text" text,
  "content_bytea" bytea,
  "uploaded_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "ai_assets_marketplace"."crawl_runs" (
  "id" text PRIMARY KEY NOT NULL,
  "status" varchar(32) NOT NULL,
  "started_at" timestamptz DEFAULT now() NOT NULL,
  "finished_at" timestamptz,
  "stats" jsonb,
  "error" text
);

CREATE INDEX IF NOT EXISTS "ai_assets_crawl_runs_status_idx"
  ON "ai_assets_marketplace"."crawl_runs" ("status");
CREATE INDEX IF NOT EXISTS "ai_assets_crawl_runs_started_at_idx"
  ON "ai_assets_marketplace"."crawl_runs" ("started_at");
