#!/usr/bin/env bash
# Uploads the wordcount dataset to Supabase Storage so wordcount_report.html
# (which fetches it at runtime) stays under the Cloudflare Pages 25 MiB limit.
# Usage: SUPABASE_SERVICE_ROLE_KEY=... bash scripts/semantic-graph/upload_wordcount_dataset.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SRC="${1:-$ROOT/concordance_results/wordcount_full.tsv.gz}"
SUPABASE_URL="${SUPABASE_URL:-https://wslydgtgindrywldatbv.supabase.co}"
DEST="wordcount/wordcount.tsv.gz"
BUCKET="concordance"

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "SUPABASE_SERVICE_ROLE_KEY is required" >&2; exit 2
fi
[[ -f "$SRC" ]] || { echo "Dataset not found: $SRC" >&2; exit 2; }

echo "Uploading $SRC ($(du -h "$SRC" | cut -f1)) -> $BUCKET/$DEST"
curl -sfS -X POST \
  "$SUPABASE_URL/storage/v1/object/$BUCKET/$DEST" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "x-upsert: true" \
  -H "Content-Type: application/gzip" \
  --data-binary @"$SRC"
echo
echo "Verify: curl -sI $SUPABASE_URL/storage/v1/object/public/$BUCKET/$DEST | head -1"
