#!/usr/bin/env bash
set -euo pipefail

REPO=""
BASE_URL="https://thenewfuse.com"
API_URL="https://api.thenewfuse.com"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --base-url) BASE_URL="$2"; shift 2 ;;
    --api-url) API_URL="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$REPO" ]]; then
  echo "--repo is required" >&2
  exit 2
fi

cd "$REPO"

echo "[1/5] Build frontend"
pnpm --filter @the-new-fuse/frontend-app run build

echo "[2/5] Live link crawl"
cd apps/frontend
LIVE_AUDIT_MAX_DEPTH=5 LIVE_AUDIT_MAX_PAGES=500 LIVE_AUDIT_MAX_EXTERNAL=400 FAIL_ON_BROKEN=1 pnpm run audit:live-links

echo "[3/5] Route semantic audit"
SEMANTIC_AUDIT_BASE_URL="$BASE_URL" FAIL_ON_SEMANTIC_ISSUES=1 pnpm run audit:all-routes-semantic

echo "[4/5] Auth path audit"
AUTH_AUDIT_PUBLIC_BASE_URL="$BASE_URL" AUTH_AUDIT_API_BASE_URL="$API_URL" FAIL_ON_AUTH_ISSUES=1 pnpm run audit:auth-paths

cd "$REPO"
echo "[5/5] Generate Mermaid map"
python3 /Users/<owner>/.codex/skills/tnf-stack-self-improvement-loop/scripts/generate_master_mermaid.py \
  --repo "$REPO" \
  --out "$REPO/docs/architecture/tnf-master-framework.mmd"

echo "Loop complete"
