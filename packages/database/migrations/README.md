# Database Migrations

This directory contains all the SQL migration files for the database.

## Naming Convention

Migrations should be named using a timestamp format:
`YYYYMMDDHHMMSS_description.sql`. For example,
`20240725120000_add_performance_indexes.sql`.

Rollback migrations should be named with the same timestamp and a `.down.sql`
suffix. For example, `20240725120000_add_performance_indexes.down.sql`.

## Indexing Strategy

Our general indexing strategy is as follows:

1.  **Index all foreign keys:** This is the most basic and important rule.
2.  **Use `CONCURRENTLY`:** All indexes should be created with
    `CREATE INDEX CONCURRENTLY` to avoid locking the table during creation.
3.  **Use `IF NOT EXISTS`:** All `CREATE` statements should include
    `IF NOT EXISTS` to make migrations idempotent.
4.  **Composite Indexes:** Create composite indexes for queries that frequently
    filter on multiple columns.
5.  **Naming Convention:** Indexes should be named `idx_<table>_<column(s)>`.

## New Migrations

- `20240725120000_add_performance_indexes.sql`: Adds a missing index to the
  `agent_registrations` table and analyzes other potential indexes.
