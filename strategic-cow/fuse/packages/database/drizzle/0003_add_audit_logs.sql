-- Migration: Add Audit Logs Table
-- Purpose: Comprehensive audit logging for compliance and security monitoring
-- Author: System
-- Date: 2026-01-25

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "action" VARCHAR(255) NOT NULL,
  "resource_type" VARCHAR(100),
  "resource_id" UUID,
  "details" JSONB,
  "ip_address" VARCHAR(45),
  "user_agent" TEXT,
  "status" VARCHAR(50) NOT NULL DEFAULT 'success',
  "error_message" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_resource_idx" ON "audit_logs"("resource_type", "resource_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");

-- Add comment
COMMENT ON TABLE "audit_logs" IS 'Comprehensive audit trail for all administrative and sensitive operations';
