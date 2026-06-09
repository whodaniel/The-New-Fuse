ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "custom_instructions" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "mcp_config" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "environment_keys" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "resource_quotas" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "settings" jsonb;--> statement-breakpoint
