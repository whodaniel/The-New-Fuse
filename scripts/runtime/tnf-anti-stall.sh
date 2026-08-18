#!/usr/bin/env bash
# TNF anti-stall continuity probe — Inspect → Act → Verify for autonomy stack.
# Invoked by Cursor agent loop / operators. Exit 0 = healthy or healed; 1 = blocked.
set -euo pipefail

# --- Fleet-wide pause gate (2026-07-21) ---
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/scripts/lib/tnf-fleet-mode.sh"
if tnf_fleet_paused; then
  echo '{"ok":true,"skipped":"fleet-paused"}'
  exit 0
fi


ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
export TNF_SUPER_ADMIN_INPUT_TOKEN="${TNF_SUPER_ADMIN_INPUT_TOKEN:-${TNF_SUPER_ADMIN_TOKEN:-}}"
LOG_DIR="$ROOT/.agent/runtime-logs"
mkdir -p "$LOG_DIR"
REPORT="$LOG_DIR/anti-stall-latest.json"
NOW="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ok_full_auto=0
ok_daemon=0
ok_relay=0
ok_redis=0
actions=()

if pgrep -f "full-auto start" >/dev/null 2>&1; then
  ok_full_auto=1
else
  actions+=("restarted_full_auto_daemon")
  ./tnf full-auto daemon start --interval-minutes 30 --max-cycles 0 --broadcast --skip-strict-status --skip-build >/dev/null 2>&1 || true
  sleep 2
  pgrep -f "full-auto start" >/dev/null 2>&1 && ok_full_auto=1 || true
fi

if pgrep -f "tnf-agent-daemon" >/dev/null 2>&1; then
  ok_daemon=1
else
  actions+=("restarted_agent_daemon")
  ./tnf alive up >/dev/null 2>&1 || true
  sleep 2
  pgrep -f "tnf-agent-daemon" >/dev/null 2>&1 && ok_daemon=1 || true
fi

if curl -fsS --max-time 2 "http://127.0.0.1:3000/health" 2>/dev/null | grep -q '"relay":"running"'; then
  ok_relay=1
else
  actions+=("restarted_factory_boot")
  bash scripts/orchestrator/factory-boot.sh >/dev/null 2>&1 || true
  sleep 2
  curl -fsS --max-time 2 "http://127.0.0.1:3000/health" 2>/dev/null | grep -q '"relay":"running"' && ok_relay=1 || true
fi

if redis-cli ping 2>/dev/null | grep -q PONG; then
  ok_redis=1
else
  actions+=("started_redis")
  if [[ -x "scripts/runtime/redis-local-bootstrap.sh" ]]; then
    bash scripts/runtime/redis-local-bootstrap.sh start >/dev/null 2>&1 || true
  else
    redis-server --daemonize yes --port 6379 --bind 127.0.0.1 >/dev/null 2>&1 || true
  fi
  sleep 1
  redis-cli ping 2>/dev/null | grep -q PONG && ok_redis=1 || true
fi

healthy=0
if [[ "$ok_full_auto" -eq 1 && "$ok_daemon" -eq 1 && "$ok_relay" -eq 1 && "$ok_redis" -eq 1 ]]; then
  healthy=1
fi

actions_json="[]"
if [[ ${#actions[@]} -gt 0 ]]; then
  actions_json=$(printf '%s\n' "${actions[@]}" | jq -R -s 'split("\n") | map(select(length>0))')
fi

cat > "$REPORT" <<EOF
{
  "timestamp": "$NOW",
  "healthy": $([[ "$healthy" -eq 1 ]] && echo true || echo false),
  "checks": {
    "full_auto_daemon": $([[ "$ok_full_auto" -eq 1 ]] && echo true || echo false),
    "agent_daemon": $([[ "$ok_daemon" -eq 1 ]] && echo true || echo false),
    "relay": $([[ "$ok_relay" -eq 1 ]] && echo true || echo false),
    "redis": $([[ "$ok_redis" -eq 1 ]] && echo true || echo false)
  },
  "actions": $actions_json,
  "protocol": "docs/protocols/TNF_AUTONOMOUS_CONTINUITY_PROTOCOL.md"
}
EOF

echo "[anti-stall] healthy=$healthy full_auto=$ok_full_auto daemon=$ok_daemon relay=$ok_relay redis=$ok_redis"
echo "[anti-stall] receipt=$REPORT"
[[ "$healthy" -eq 1 ]]
