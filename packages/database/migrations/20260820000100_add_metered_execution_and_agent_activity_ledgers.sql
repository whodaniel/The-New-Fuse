-- TNF local-first SaaS economics + cross-agent activity ledgers
--
-- Security posture: RLS is enabled and FORCEd on tenant/workspace-scoped tables.
-- This migration intentionally installs no direct end-user policies. Hosted
-- control-plane services should access these tables through a privileged server
-- role after authority checks, or a later migration may add narrowly scoped
-- workspace policies once the canonical auth/RLS helper contract is settled.

CREATE TABLE IF NOT EXISTS "tnf_execution_budget_envelopes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_ref" text NOT NULL,
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "period" varchar(32) NOT NULL DEFAULT 'month',
  "currency" varchar(8) NOT NULL DEFAULT 'USD',
  "soft_limit_usd" numeric(14,6),
  "hard_limit_usd" numeric(14,6) NOT NULL CHECK ("hard_limit_usd" >= 0),
  "reserved_usd" numeric(14,6) NOT NULL DEFAULT 0 CHECK ("reserved_usd" >= 0),
  "period_starts_at" timestamptz NOT NULL,
  "period_ends_at" timestamptz NOT NULL,
  "status" varchar(24) NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'paused', 'closed')),
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CHECK ("period_ends_at" > "period_starts_at"),
  CHECK ("soft_limit_usd" IS NULL OR "soft_limit_usd" >= 0),
  CHECK ("soft_limit_usd" IS NULL OR "soft_limit_usd" <= "hard_limit_usd")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tnf_budget_envelopes_scope_period_unique"
  ON "tnf_execution_budget_envelopes" ("tenant_ref", "workspace_id", "period", "period_starts_at", "period_ends_at");
CREATE INDEX IF NOT EXISTS "tnf_budget_envelopes_workspace_status_idx"
  ON "tnf_execution_budget_envelopes" ("workspace_id", "status", "period_ends_at");

CREATE TABLE IF NOT EXISTS "tnf_execution_authorizations" (
  "authorization_id" text PRIMARY KEY,
  "tenant_ref" text NOT NULL,
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "capability" text NOT NULL,
  "entitlement_tier" text NOT NULL,
  "funding_tier" varchar(40) NOT NULL,
  "decision" varchar(32) NOT NULL CHECK ("decision" IN ('allow-local', 'allow-free', 'allow-metered', 'defer', 'deny')),
  "reason" text NOT NULL,
  "provider" text,
  "route" text,
  "estimated_cost_usd" numeric(14,6) CHECK ("estimated_cost_usd" IS NULL OR "estimated_cost_usd" >= 0),
  "idempotency_key" text NOT NULL,
  "requested_at" timestamptz NOT NULL,
  "authorized_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz,
  "request_json" jsonb NOT NULL,
  "selected_route_json" jsonb,
  "budget_snapshot_json" jsonb,
  "reauthorized_at" timestamptz,
  "reauthorization_decision" varchar(32) CHECK ("reauthorization_decision" IS NULL OR "reauthorization_decision" IN ('allow-local', 'allow-free', 'allow-metered', 'defer', 'deny')),
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "tnf_execution_authorizations_idempotency_unique"
  ON "tnf_execution_authorizations" ("tenant_ref", "workspace_id", "idempotency_key");
CREATE INDEX IF NOT EXISTS "tnf_execution_authorizations_workspace_created_idx"
  ON "tnf_execution_authorizations" ("workspace_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "tnf_execution_authorizations_provider_idx"
  ON "tnf_execution_authorizations" ("provider", "created_at" DESC) WHERE "provider" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "tnf_usage_receipts" (
  "receipt_id" text PRIMARY KEY,
  "authorization_id" text REFERENCES "tnf_execution_authorizations"("authorization_id") ON DELETE SET NULL,
  "tenant_ref" text NOT NULL,
  "workspace_id" uuid NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "capability" text NOT NULL,
  "provider" text NOT NULL,
  "route" text NOT NULL,
  "provider_operation_id" text,
  "idempotency_key" text NOT NULL,
  "estimated_cost_usd" numeric(14,6) NOT NULL DEFAULT 0 CHECK ("estimated_cost_usd" >= 0),
  "actual_cost_usd" numeric(14,6) CHECK ("actual_cost_usd" IS NULL OR "actual_cost_usd" >= 0),
  "metered_units" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "started_at" timestamptz NOT NULL,
  "completed_at" timestamptz,
  "outcome" varchar(24) NOT NULL CHECK ("outcome" IN ('succeeded', 'failed', 'cancelled', 'deferred')),
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CHECK ("completed_at" IS NULL OR "completed_at" >= "started_at")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tnf_usage_receipts_provider_operation_unique"
  ON "tnf_usage_receipts" ("provider", "provider_operation_id") WHERE "provider_operation_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "tnf_usage_receipts_workspace_completed_idx"
  ON "tnf_usage_receipts" ("workspace_id", "completed_at" DESC);
CREATE INDEX IF NOT EXISTS "tnf_usage_receipts_capability_idx"
  ON "tnf_usage_receipts" ("capability", "completed_at" DESC);
CREATE INDEX IF NOT EXISTS "tnf_usage_receipts_authorization_idx"
  ON "tnf_usage_receipts" ("authorization_id") WHERE "authorization_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "tnf_agent_instance_snapshots" (
  "snapshot_id" text PRIMARY KEY,
  "platform" text NOT NULL,
  "product" text,
  "instance_ref" text NOT NULL,
  "subject_ref" text,
  "workspace_id" uuid REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "workspace_ref" text,
  "captured_at" timestamptz NOT NULL,
  "expires_at" timestamptz,
  "capabilities" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "connectors" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "schedules" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "active_task_refs" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "provenance" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "tnf_agent_snapshots_instance_latest_idx"
  ON "tnf_agent_instance_snapshots" ("platform", "instance_ref", "captured_at" DESC);
CREATE INDEX IF NOT EXISTS "tnf_agent_snapshots_workspace_latest_idx"
  ON "tnf_agent_instance_snapshots" ("workspace_id", "captured_at" DESC) WHERE "workspace_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "tnf_agent_activity_receipts" (
  "receipt_id" text PRIMARY KEY,
  "platform" text NOT NULL,
  "product" text,
  "instance_ref" text NOT NULL,
  "subject_ref" text,
  "workspace_id" uuid REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "workspace_ref" text,
  "task_ref" text NOT NULL,
  "parent_task_ref" text,
  "capability_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "started_at" timestamptz NOT NULL,
  "completed_at" timestamptz,
  "outcome" varchar(24) NOT NULL CHECK ("outcome" IN ('succeeded', 'failed', 'cancelled', 'deferred', 'in-progress')),
  "summary" text NOT NULL,
  "artifact_refs" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "external_operation_refs" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "cost_authorization_ref" text REFERENCES "tnf_execution_authorizations"("authorization_id") ON DELETE SET NULL,
  "metered_usage_ref" text REFERENCES "tnf_usage_receipts"("receipt_id") ON DELETE SET NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "provenance" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CHECK ("completed_at" IS NULL OR "completed_at" >= "started_at")
);

CREATE INDEX IF NOT EXISTS "tnf_agent_activity_instance_idx"
  ON "tnf_agent_activity_receipts" ("platform", "instance_ref", "started_at" DESC);
CREATE INDEX IF NOT EXISTS "tnf_agent_activity_workspace_idx"
  ON "tnf_agent_activity_receipts" ("workspace_id", "started_at" DESC) WHERE "workspace_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "tnf_agent_activity_task_idx"
  ON "tnf_agent_activity_receipts" ("task_ref", "started_at" DESC);

-- Fail closed for ordinary database roles. The hosted executor/service role is
-- expected to apply authority and workspace membership checks before access.
ALTER TABLE "tnf_execution_budget_envelopes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tnf_execution_budget_envelopes" FORCE ROW LEVEL SECURITY;
ALTER TABLE "tnf_execution_authorizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tnf_execution_authorizations" FORCE ROW LEVEL SECURITY;
ALTER TABLE "tnf_usage_receipts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tnf_usage_receipts" FORCE ROW LEVEL SECURITY;
ALTER TABLE "tnf_agent_instance_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tnf_agent_instance_snapshots" FORCE ROW LEVEL SECURITY;
ALTER TABLE "tnf_agent_activity_receipts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tnf_agent_activity_receipts" FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE "tnf_execution_budget_envelopes" IS 'Tenant/workspace spend envelopes; entitlement remains a separate concern.';
COMMENT ON TABLE "tnf_execution_authorizations" IS 'Authorization decisions before enqueue and reauthorization immediately before provider execution.';
COMMENT ON TABLE "tnf_usage_receipts" IS 'Normalized provider usage/cost receipts for reconciliation and unit economics.';
COMMENT ON TABLE "tnf_agent_instance_snapshots" IS 'Permissioned point-in-time agent platform instance capability/connector/schedule state; no raw secrets.';
COMMENT ON TABLE "tnf_agent_activity_receipts" IS 'Normalized cross-agent activity receipts for interoperable TNF orientation and audit.';
