ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "custom_instructions" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "mcp_config" jsonb;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "environment_keys" jsonb;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "resource_quotas" jsonb;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "settings" jsonb;
