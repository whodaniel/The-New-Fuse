#!/usr/bin/env bash
set -euo pipefail

ROOT="${TNF_REPO_ROOT:-$HOME/Desktop/A1-Inter-LLM-Com/The-New-Fuse}"
API_BASE_URL="${TNF_API_BASE_URL:-}"
TOKEN="${TNF_BEARER_TOKEN:-}"
TASK_ID="${TNF_TASK_ID:-}"

run_build_checks() {
  echo "[1/3] Building database package"
  (cd "$ROOT" && pnpm --filter @the-new-fuse/database run build)

  echo "[2/3] Type-checking API server"
  (cd "$ROOT" && pnpm --filter @the-new-fuse/api-server run type-check)

  echo "[3/3] Building API server"
  (cd "$ROOT" && pnpm --filter @the-new-fuse/api-server run build)
}

run_api_smoke() {
  if [[ -z "$API_BASE_URL" || -z "$TOKEN" || -z "$TASK_ID" ]]; then
    echo "Skipping API smoke checks; set TNF_API_BASE_URL, TNF_BEARER_TOKEN, TNF_TASK_ID to enable."
    return 0
  fi

  echo "Checking execution logs endpoint"
  curl -fsS -H "Authorization: Bearer $TOKEN" \
    "$API_BASE_URL/api/tasks/$TASK_ID/execution-logs" >/dev/null

  echo "Posting execution log"
  curl -fsS -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"level":"info","message":"pipeline smoke log","actor":"task-pipeline-smoke","source":"task-pipeline-smoke","stage":"smoke"}' \
    "$API_BASE_URL/api/tasks/$TASK_ID/execution-logs" >/dev/null

  echo "Execution-log smoke checks passed."
}

if [[ "${TNF_SKIP_BUILD:-0}" != "1" ]]; then
  run_build_checks
fi

run_api_smoke

echo "TNF task production pipeline smoke run complete."
