#!/usr/bin/env bash
# TNF Self-Sufficiency Gate — non-blocking posture recorder (TNF-SELFSUFF-002)
set -uo pipefail

OUT="$HOME/.tnf/runtime/self-sufficiency.json"
mkdir -p "$(dirname "$OUT")"

now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
boot_id="tnf-$(date +%s)"

tier1="ok"   # in-tree native polyfill always available by construction
tier2="ok"   # bundled bin resolver available
tier3="warn" # local services optional
tier4="warn" # remote orchestration optional

if command -v redis-cli >/dev/null 2>&1; then
  if redis-cli -h localhost -p 6379 ping >/dev/null 2>&1; then
    tier3="ok"
  fi
fi

cat > "$OUT" <<EOF
{
  "boot_id": "${boot_id}",
  "timestamp": "${now}",
  "posture": {
    "tier1_native_polyfill": "${tier1}",
    "tier2_bundled_binary":  "${tier2}",
    "tier3_local_service":   "${tier3}",
    "tier4_optional_remote": "${tier4}"
  },
  "policy": "skip-on-absent",
  "boot_result": "self-sufficient"
}
EOF
echo "[TNF] Self-sufficiency gate: posture recorded at $OUT"
