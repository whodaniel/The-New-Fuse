-- Persist workspace-scoped bookmarks for quick-link management
CREATE TABLE IF NOT EXISTS "workspace_bookmarks" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "title" varchar(255) NOT NULL,
  "url" text NOT NULL,
  "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "note" text,
  "created_by_user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "workspace_bookmarks_workspace_url_unique"
  ON "workspace_bookmarks" ("workspace_id", "url");
CREATE INDEX IF NOT EXISTS "idx_workspace_bookmarks_workspace_id"
  ON "workspace_bookmarks" ("workspace_id");
