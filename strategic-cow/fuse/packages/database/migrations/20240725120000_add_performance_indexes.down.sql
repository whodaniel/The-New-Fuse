-- ============================================================================
-- Rollback for Add Performance Indexes
-- Date: 2024-07-25
-- Description: This migration drops the index on the `agent_registrations`
--              table's `agentId` column.
-- ============================================================================

DROP INDEX CONCURRENTLY IF EXISTS idx_agent_registrations_agent_id;
