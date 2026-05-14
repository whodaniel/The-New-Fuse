#!/usr/bin/env bash
set -euo pipefail

# Migrates ai_assets_marketplace schema/data from MCP-DRS Postgres to TNF Postgres.
# Requires: psql + pg_dump from PostgreSQL 16+ client toolchain.

PG_BIN_DIR="${PG_BIN_DIR:-/usr/local/opt/postgresql@17/bin}"
PG_DUMP_BIN="${PG_DUMP_BIN:-$PG_BIN_DIR/pg_dump}"
PSQL_BIN="${PSQL_BIN:-$PG_BIN_DIR/psql}"

SRC_URL="${SRC_URL:-}"
DST_URL="${DST_URL:-}"
DUMP_FILE="${DUMP_FILE:-/tmp/ai_assets_marketplace_migration.sql}"
APPLY_TNF_MIGRATION_0006="${APPLY_TNF_MIGRATION_0006:-true}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATION_0006="$ROOT_DIR/packages/database/drizzle/0006_add_ai_assets_marketplace_schema.sql"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing required command: $1" >&2
    exit 1
  }
}

if [[ -z "$SRC_URL" || -z "$DST_URL" ]]; then
  cat >&2 <<'EOF'
Usage:
  SRC_URL='<source database url>' \
  DST_URL='<target database url>' \
  scripts/cloud_runtime/migrate-ai-assets-marketplace-to-tnf.sh

Optional:
  PG_BIN_DIR=/usr/local/opt/postgresql@17/bin
  DUMP_FILE=/tmp/ai_assets_marketplace_migration.sql
  APPLY_TNF_MIGRATION_0006=true|false
EOF
  exit 1
fi

need_cmd "$PG_DUMP_BIN"
need_cmd "$PSQL_BIN"

echo "Dumping ai_assets_marketplace from source..."
"$PG_DUMP_BIN" "$SRC_URL" \
  --schema=ai_assets_marketplace \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists > "$DUMP_FILE"

echo "Restoring into target..."
"$PSQL_BIN" "$DST_URL" -v ON_ERROR_STOP=1 -f "$DUMP_FILE"

if [[ "$APPLY_TNF_MIGRATION_0006" == "true" ]]; then
  echo "Applying TNF migration 0006 for TNF-only objects (for example, crawl_runs)..."
  "$PSQL_BIN" "$DST_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION_0006"
fi

echo "Row counts after migration:"
"$PSQL_BIN" "$DST_URL" -v ON_ERROR_STOP=1 -c "
select 'categories' as table, count(*) from ai_assets_marketplace.categories
union all
select 'sources', count(*) from ai_assets_marketplace.sources
union all
select 'source_links', count(*) from ai_assets_marketplace.source_links
union all
select 'prompts', count(*) from ai_assets_marketplace.prompts
union all
select 'artifacts', count(*) from ai_assets_marketplace.artifacts
union all
select 'crawl_runs', count(*) from ai_assets_marketplace.crawl_runs;
"

echo "Migration complete."
