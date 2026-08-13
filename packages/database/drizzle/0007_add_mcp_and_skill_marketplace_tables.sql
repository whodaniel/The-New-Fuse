CREATE TABLE IF NOT EXISTS "ai_assets_marketplace"."skill_marketplace_entries" (
  "id" integer PRIMARY KEY NOT NULL,
  "source" text NOT NULL,
  "entry_url" text NOT NULL,
  "title" text,
  "brief" text,
  "tags" text,
  "discovered_at" text
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_assets_skill_marketplace_entries_source_url_uq"
  ON "ai_assets_marketplace"."skill_marketplace_entries" ("source", "entry_url");
CREATE INDEX IF NOT EXISTS "ai_assets_skill_marketplace_entries_source_idx"
  ON "ai_assets_marketplace"."skill_marketplace_entries" ("source");

CREATE TABLE IF NOT EXISTS "ai_assets_marketplace"."mcp_categories" (
  "id" integer PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_assets_mcp_categories_name_uq"
  ON "ai_assets_marketplace"."mcp_categories" ("name");

CREATE TABLE IF NOT EXISTS "ai_assets_marketplace"."mcp_sources" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "ai_assets_mcp_sources_name_url_uq"
  ON "ai_assets_marketplace"."mcp_sources" ("name", "url");
CREATE INDEX IF NOT EXISTS "ai_assets_mcp_sources_category_id_idx"
  ON "ai_assets_marketplace"."mcp_sources" ("category_id");
CREATE INDEX IF NOT EXISTS "ai_assets_mcp_sources_url_idx"
  ON "ai_assets_marketplace"."mcp_sources" ("url");

CREATE TABLE IF NOT EXISTS "ai_assets_marketplace"."mcp_links" (
  "id" integer PRIMARY KEY NOT NULL,
  "source_id" integer NOT NULL,
  "link_url" text NOT NULL,
  "anchor" text
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_assets_mcp_links_source_url_uq"
  ON "ai_assets_marketplace"."mcp_links" ("source_id", "link_url");
CREATE INDEX IF NOT EXISTS "ai_assets_mcp_links_source_id_idx"
  ON "ai_assets_marketplace"."mcp_links" ("source_id");
CREATE INDEX IF NOT EXISTS "ai_assets_mcp_links_link_url_idx"
  ON "ai_assets_marketplace"."mcp_links" ("link_url");

CREATE TABLE IF NOT EXISTS "ai_assets_marketplace"."mcp_servers" (
  "id" integer PRIMARY KEY NOT NULL,
  "source_id" integer,
  "server_name" text NOT NULL,
  "server_url" text,
  "repo_url" text,
  "description" text,
  "tags" text,
  "maintainer" text,
  "stars" integer,
  "license" text,
  "transport" text,
  "created_at" text
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_assets_mcp_servers_server_repo_uq"
  ON "ai_assets_marketplace"."mcp_servers" ("server_url", "repo_url");
CREATE INDEX IF NOT EXISTS "ai_assets_mcp_servers_source_id_idx"
  ON "ai_assets_marketplace"."mcp_servers" ("source_id");
CREATE INDEX IF NOT EXISTS "ai_assets_mcp_servers_server_url_idx"
  ON "ai_assets_marketplace"."mcp_servers" ("server_url");
CREATE INDEX IF NOT EXISTS "ai_assets_mcp_servers_repo_url_idx"
  ON "ai_assets_marketplace"."mcp_servers" ("repo_url");
