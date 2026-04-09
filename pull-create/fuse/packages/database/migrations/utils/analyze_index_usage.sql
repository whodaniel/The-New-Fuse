-- ============================================================================
-- Index Usage Analysis Script
-- Date: 2024-07-25
-- Description: This script provides queries to analyze the usage of
--              indexes in the database.
-- ============================================================================

-- ============================================================================
-- Query to check all user indexes and their usage
-- ============================================================================

SELECT
    relname AS table_name,
    indexrelname AS index_name,
    idx_scan AS number_of_scans,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM
    pg_stat_user_indexes
ORDER BY
    number_of_scans DESC,
    index_size DESC;


-- ============================================================================
-- Query to find unused indexes
-- ============================================================================

SELECT
    relname AS table_name,
    indexrelname AS index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM
    pg_stat_user_indexes
WHERE
    idx_scan = 0
ORDER BY
    index_size DESC;


-- ============================================================================
-- Query to see details for a specific index
-- ============================================================================

SELECT
    *
FROM
    pg_indexes
WHERE
    tablename = 'agent_registrations' AND indexname = 'idx_agent_registrations_agent_id';
