#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
sql_path="${repo_root}/docs/protocols/reports/sql/librarian_rls_blueprint_2026-05-05.sql"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required in environment." >&2
  exit 1
fi

if [[ ! -f "${sql_path}" ]]; then
  echo "SQL file not found: ${sql_path}" >&2
  exit 1
fi

tmp_sql="$(mktemp /tmp/librarian-rls-validate.XXXXXX.sql)"
trap 'rm -f "${tmp_sql}"' EXIT

# Force rollback for safety by replacing terminal COMMIT.
sed 's/^COMMIT;$/ROLLBACK;/' "${sql_path}" > "${tmp_sql}"

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${tmp_sql}"

