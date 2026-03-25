DROP TABLE IF EXISTS "workspace_domains";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkspaceDomainStatus') THEN
    DROP TYPE "WorkspaceDomainStatus";
  END IF;
END $$;
