-- ============================================================================
-- Performance Testing Script for agent_registrations Index
-- Date: 2024-07-25
-- Description: This script provides a template for how to test the
--              performance of the new index on `agent_registregistrations`.
-- ============================================================================

-- To use this script:
-- 1. Connect to the database using `psql`.
-- 2. Run the queries before and after applying the migration.
-- 3. Compare the "Execution Time" from the query plans.

-- ============================================================================
-- STEP 1: Run the rollback migration (if the index is already applied)
-- ============================================================================
-- `psql -f packages/database/migrations/20240725120000_add_performance_indexes.down.sql`


-- ============================================================================
-- STEP 2: Analyze the query plan WITHOUT the index
-- ============================================================================

EXPLAIN ANALYZE
SELECT * FROM "agent_registrations" WHERE "agentId" = '<some-agent-id>';

-- Note the "Execution Time" from the output. It should show a Sequential Scan.


-- ============================================================================
-- STEP 3: Apply the new migration
-- ============================================================================
-- `psql -f packages/database/migrations/20240725120000_add_performance_indexes.sql`


-- ============================================================================
-- STEP 4: Analyze the query plan WITH the index
-- ============================================================================

EXPLAIN ANALYZE
SELECT * FROM "agent_registrations" WHERE "agentId" = '<some-agent-id>';

-- Note the "Execution Time" from the output. It should now show an Index Scan
-- and the execution time should be significantly lower.
