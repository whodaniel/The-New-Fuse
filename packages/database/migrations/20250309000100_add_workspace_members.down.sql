DROP TABLE IF EXISTS "workspace_members";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkspaceMemberRole') THEN
    DROP TYPE "WorkspaceMemberRole";
  END IF;
END $$;
