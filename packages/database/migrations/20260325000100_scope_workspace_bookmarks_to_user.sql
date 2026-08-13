-- Scope workspace bookmark URL uniqueness to the creating user for multi-tenant privacy.
DROP INDEX IF EXISTS "workspace_bookmarks_workspace_url_unique";
DROP INDEX IF EXISTS "workspace_bookmarks_workspace_id_url_unique";

CREATE UNIQUE INDEX IF NOT EXISTS "workspace_bookmarks_workspace_user_url_unique"
  ON "workspace_bookmarks" ("workspace_id", "created_by_user_id", "url");
