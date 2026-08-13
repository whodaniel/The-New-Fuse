-- Workspace membership support
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkspaceMemberRole') THEN
    CREATE TYPE "WorkspaceMemberRole" AS ENUM ('owner', 'admin', 'member', 'viewer');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "workspace_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" "WorkspaceMemberRole" NOT NULL DEFAULT 'member',
  "added_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("workspace_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "idx_workspace_members_workspace_id" ON "workspace_members" ("workspace_id");
CREATE INDEX IF NOT EXISTS "idx_workspace_members_user_id" ON "workspace_members" ("user_id");

INSERT INTO "workspace_members" ("workspace_id", "user_id", "role", "added_by_user_id", "created_at", "updated_at")
SELECT w."id", w."owner_id", 'owner', w."owner_id", w."created_at", w."updated_at"
FROM "workspaces" w
WHERE NOT EXISTS (
  SELECT 1
  FROM "workspace_members" wm
  WHERE wm."workspace_id" = w."id" AND wm."user_id" = w."owner_id"
);
