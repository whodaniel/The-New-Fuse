-- 0013_add_cli_qoder.sql
-- Adds CLI_QODER to the AgentType enum so the Qoder CLI agent persona
-- (.agent/agents/qodercli.md) has first-class identity, mirroring the
-- CLI_KILO / CLI_OPENCODE / CLI_PI first-class identity added in 0007.
--
-- Idempotent: ALTER TYPE ... ADD VALUE IF NOT EXISTS is supported by
-- Postgres 9.6+, but ADD VALUE cannot run inside a transaction block in
-- earlier versions. Postgres 12+ (Supabase default) supports it.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'CLI_QODER'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AgentType')
  ) THEN
    ALTER TYPE "AgentType" ADD VALUE 'CLI_QODER';
  END IF;
END
$$;
