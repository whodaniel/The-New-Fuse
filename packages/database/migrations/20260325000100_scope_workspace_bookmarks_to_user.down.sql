DROP INDEX IF EXISTS "workspace_bookmarks_workspace_user_url_unique";

CREATE UNIQUE INDEX IF NOT EXISTS "workspace_bookmarks_workspace_url_unique"
  ON "workspace_bookmarks" ("workspace_id", "url");
