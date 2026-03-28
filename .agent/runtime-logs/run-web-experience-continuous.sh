#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NODE_BIN="${TNF_WEB_EXPERIENCE_NODE_BIN:-$(command -v node)}"

export PATH="$(dirname "$NODE_BIN"):/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd "$ROOT_DIR"

while true; do
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] continuous cycle start"
  if "$NODE_BIN" scripts/railway/launch-openclaw-qa-swarm.mjs \
      --services openclaw-cloud,openclaw-primary,openclaw-sandbox-cloud,openclaw-oc004 \
      --agents-per-service 2 \
      --workspace tnf-web-experience-continuous \
      --session continuous \
      --timeout-ms 120000; then
    rc=0
  else
    rc=$?
  fi
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] continuous cycle end rc=$rc"
  if [[ "$rc" -eq 0 ]]; then
    sleep 1800
  else
    sleep 120
  fi
done
