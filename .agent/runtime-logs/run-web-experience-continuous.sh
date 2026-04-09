#!/usr/bin/env bash
set -u
export PATH="/path/to/.nvm/versions/node/v24.12.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd /path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse || exit 1
while true; do
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] continuous cycle start"
  /path/to/.nvm/versions/node/v24.12.0/bin/node scripts/railway/launch-openclaw-qa-swarm.mjs \
    --services openclaw-cloud,openclaw-primary,openclaw-sandbox-cloud,openclaw-oc004 \
    --agents-per-service 2 \
    --workspace tnf-web-experience-continuous \
    --session continuous \
    --timeout-ms 120000
  rc=$?
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] continuous cycle end rc=$rc"
  if [[ "$rc" -eq 0 ]]; then
    sleep 1800
  else
    sleep 120
  fi
done
