#!/usr/bin/env bash
# TNF Frontend Tester — one cycle.
# Native replacement for the legacy OpenClaw `tnf-continuous-test.sh`
# that ran as a launchd KeepAlive loop under
#   com.openclaw.tnf-continuous-test.plist
# Now driven by system cron `*/5 * * * *` so we sidestep the Hermes cron
# interpreter bug (RuntimeError after shutdown).
#
# Behavior (no LLM):
#   - Probe thenewfuse.com (main, /api/health, /api, /api/auth/session, /_next/static)
#   - Append one JSONL record per cycle to
#     ~/.tnf/runtime/thenewfuse-tester/issues-YYYYMMDD.jsonl
#   - On `critical` findings, LPUSH a task to tnf:master:tasks:planning
#   - PUBLISH a heartbeat for the agent registry
#
# This script contains NO secrets and does not source .env.telegram or
# .env.tnf-telegram. Telegram alerts are delivered by the Telegram-bot
# daemon which subscribes to the bus.

set -euo pipefail

# --- Fleet-wide pause gate (2026-07-21) ---
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/scripts/lib/tnf-fleet-mode.sh"
if tnf_fleet_paused; then
  echo '{"ok":true,"skipped":"fleet-paused"}'
  exit 0
fi

export PATH="/usr/local/bin:/opt/homebrew/bin:${PATH}"

BASE_URL="https://thenewfuse.com"
RUNTIME_DIR="${HOME}/.tnf/runtime/thenewfuse-tester"
ISSUES_LOG_DIR="$RUNTIME_DIR"
STATE_FILE="$RUNTIME_DIR/state.json"
TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
DAY="$(date -u +%Y%m%d)"
LOG_FILE="$ISSUES_LOG_DIR/issues-${DAY}.jsonl"

mkdir -p "$ISSUES_LOG_DIR"

log() { printf '%s %s\n' "$TIMESTAMP" "$*"; }

report_issue() {
  local category="$1" severity="$2" description="$3" details="$4"
  local record
  record=$(jq -n \
    --arg ts "$TIMESTAMP" \
    --arg cat "$category" \
    --arg sev "$severity" \
    --arg desc "$description" \
    --arg det "$details" \
    '{timestamp:$ts, category:$cat, severity:$sev, description:$desc, details:$det}')
  printf '%s\n' "$record" >> "$LOG_FILE"
  log "ISSUE [$severity] $category: $description ($details)"

  if [ "$severity" = "critical" ] && command -v redis-cli >/dev/null 2>&1; then
    redis-cli -h 127.0.0.1 -p 6379 LPUSH tnf:master:tasks:planning "$record" >/dev/null
  fi
}

probe() {
  local label="$1" url="$2" method="${3:-GET}" expected_status="${4:-200}" expected_body_substr="${5:-}"
  local tmp status_code time_total body
  tmp=$(mktemp)
  status_code=$(curl -sS -m 10 -o "$tmp" -w '%{http_code}|%{time_total}' -X "$method" "$url" 2>/dev/null || echo "000|0.0")
  body=$(cat "$tmp" 2>/dev/null || echo "")
  rm -f "$tmp"
  local code="${status_code%%|*}"
  local tt="${status_code##*|}"

  # ok / degraded / critical classifier
  if [ "$code" = "000" ]; then
    report_issue "$label" "critical" "endpoint unreachable" "code=$code ttime=${tt}s"
    return 1
  fi
  if [ "$code" != "$expected_status" ]; then
    local sev="warning"
    # Treat auth 401/403 as informational, not critical — site may not have public session.
    if [ "$code" = "401" ] || [ "$code" = "403" ]; then
      sev="info"
    fi
    report_issue "$label" "$sev" "non-expected status" "code=$code expected=$expected_status ttime=${tt}s"
    return 0
  fi
  if [ -n "$expected_body_substr" ] && [ "${body#*$expected_body_substr}" = "$body" ]; then
    report_issue "$label" "warning" "expected body substring missing" "expected=$expected_body_substr body=${body:0:120}"
    return 0
  fi
  log "OK  $label code=$code ttime=${tt}s"
  return 0
}

CYCLE_START=$(date +%s)

# Frontend main page
probe "frontend-index" "$BASE_URL/" GET 200 "" >/dev/null || true
# API health (most reliable; body must contain "healthy")
probe "api-health" "$BASE_URL/api/health" GET 200 "healthy" >/dev/null || true
# API gateway (anything but 404 and 000)
api_code=$(curl -sS -m 10 -o /dev/null -w '%{http_code}' "$BASE_URL/api" 2>/dev/null || echo "000")
if [ "$api_code" = "000" ]; then
  report_issue "api-gateway" "critical" "api gateway timeout" "code=000"
elif [ "$api_code" = "404" ]; then
  report_issue "api-gateway" "warning" "api gateway 404" "code=404"
else
  log "OK  api-gateway code=$api_code"
fi
# Auth session (informational)
probe "auth-session" "$BASE_URL/api/auth/session" GET 401 "" >/dev/null || true
# Static assets (informational)
next_code=$(curl -sS -m 10 -o /dev/null -w '%{http_code}' "$BASE_URL/_next/static" 2>/dev/null || echo "000")
log "INFO next-static code=$next_code"

CYCLE_END=$(date +%s)
DURATION=$((CYCLE_END - CYCLE_START))
TODAY_COUNT=$(wc -l < "$LOG_FILE" 2>/dev/null | tr -d '[:space:]' || echo 0)
[ -z "$TODAY_COUNT" ] && TODAY_COUNT=0
log "cycle duration=${DURATION}s issues_today=${TODAY_COUNT}"

# Heartbeat into agent registry — must always run, even if state.json fails.
if command -v redis-cli >/dev/null 2>&1; then
  payload=$(jq -n \
    --arg ts "$TIMESTAMP" \
    --argjson dur "$DURATION" \
    --argjson count "$TODAY_COUNT" \
    '{agentId:"agent:thenewfuse-frontend-tester", lastCycleAt:$ts, cycleDurationSec:$dur, issuesToday:$count}')
  if [ -n "$payload" ]; then
    redis-cli -h 127.0.0.1 -p 6379 HSET tnf:agent-registry "agent:thenewfuse-frontend-tester" "$payload" >/dev/null || true
    redis-cli -h 127.0.0.1 -p 6379 PUBLISH tnf:bus:ingress "$payload" >/dev/null || true
  fi
fi

# Save cycle state (best-effort; failure here must not abort the run).
if command -v jq >/dev/null 2>&1; then
  if ! jq -n \
    --arg ts "$TIMESTAMP" \
    --argjson dur "$DURATION" \
    --argjson count "$TODAY_COUNT" \
    '{lastAt:$ts,lastDurationSec:$dur,issuesToday:$count}' > "$STATE_FILE.tmp" 2>/dev/null; then
    log "WARN  state.json write skipped (jq parse failed)"
  else
    mv "$STATE_FILE.tmp" "$STATE_FILE"
  fi
fi

exit 0
