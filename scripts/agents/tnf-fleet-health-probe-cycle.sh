#!/usr/bin/env bash

# --- tnf dependency preflight ------------------------------------------
# cron runs with a minimal PATH. These scripts have no 'set -e', so a
# missing binary previously produced 'command not found', an exit code of
# 0, and a cycle that cron recorded as successful while doing nothing.
# Fail loudly at the top instead.
for _tnf_bin in curl jq redis-cli; do
  command -v "$_tnf_bin" >/dev/null 2>&1 || {
    echo "FATAL: required binary '$_tnf_bin' not found. PATH=$PATH" >&2
    exit 127
  }
done
# --- end tnf dependency preflight -----------------------------------

# TNF Fleet Health Probe — one cycle.
# Native replacement for legacy OpenClaw launchd agents
#   com.openclaw.picoclaw-fleet  (10 min, probed Railway picoclaw)
#   com.openclaw.mesh-health     (15 min, probed OpenClaw Railway)
# Both are deprecated — Railway is gone. This script probes the TNF-native
# fleet only, reading endpoints from ~/.tnf/config/fleet-endpoints.json.
#
# Behavior (no LLM, no Railway):
#   - Load endpoint list from config; refuse to start if config missing
#   - HTTP GET each endpoint with 10 s timeout
#   - Compare to previous state in state.json
#   - On state change OR every 8th cycle, PUBLISH to tnf:bus:ingress
#   - Telegram fanout is owned downstream (Telegram-bot daemon), not here
#   - NO telegram token in this file; if Telegram needs the URL list, it
#     reads the same config
#
# Run by system cron `*/15 * * * *`.

set -euo pipefail

# --- Fleet-wide pause gate (2026-07-21) ---
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/scripts/lib/tnf-fleet-mode.sh"
if tnf_fleet_paused; then
  echo '{"ok":true,"skipped":"fleet-paused"}'
  exit 0
fi

export PATH="/usr/local/bin:/opt/homebrew/bin:${PATH}"

CONFIG="${TNF_FLEET_CONFIG:-${HOME}/.tnf/config/fleet-endpoints.json}"
RUNTIME_DIR="${HOME}/.tnf/runtime/fleet-health"
STATE_FILE="$RUNTIME_DIR/state.json"
RUN_COUNTER_FILE="$RUNTIME_DIR/run-counter.json"
CYCLES_DIR="$RUNTIME_DIR/cycles"
DAY="$(date -u +%Y%m%d)"
LOG_FILE="$CYCLES_DIR/cycles-${DAY}.jsonl"

mkdir -p "$CYCLES_DIR"

if [ ! -f "$CONFIG" ]; then
  echo "FATAL: missing config $CONFIG" >&2
  exit 2
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "FATAL: jq required" >&2
  exit 2
fi

TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Increment and load run counter (drives the "every 8th cycle" heartbeat)
PREV_RUN=0
if [ -f "$RUN_COUNTER_FILE" ]; then
  PREV_RUN=$(jq -r '.count // 0' "$RUN_COUNTER_FILE" 2>/dev/null | tr -d '[:space:]' || echo 0)
  [ -z "$PREV_RUN" ] && PREV_RUN=0
fi
RUN_COUNTER=$((PREV_RUN + 1))

# Load previous state (per-endpoint string maps)
PREV_STATE_JSON="{}"
if [ -f "$STATE_FILE" ]; then
  PREV_STATE_JSON=$(cat "$STATE_FILE" 2>/dev/null || echo "{}")
fi

# Walk endpoint list
ENDPOINT_COUNT=$(jq 'length' "$CONFIG")
RESULTS=()
CHANGED=false
NEW_STATE_OBJECT="{}"
UNHEALTHY=()

for i in $(seq 0 $((ENDPOINT_COUNT - 1))); do
  NAME=$(jq -r ".[$i].name" "$CONFIG")
  URL=$(jq -r ".[$i].url" "$CONFIG")
  EXPECT=$(jq -r ".[$i].expectInBody // empty" "$CONFIG")
  CATEGORY=$(jq -r ".[$i].category // \"\"" "$CONFIG")

  # Hard guard against Railway URLs — never probe them, surface config-error
  case "$URL" in
    *.up.railway.app|*.railway.app)
      {
        echo "{\"timestamp\":\"$TIMESTAMP\",\"name\":\"$NAME\",\"verdict\":\"config-error\",\"url\":\"$URL\",\"note\":\"railway-deprecated\"}"
      } >> "$LOG_FILE"
      CHANGED=true
      continue
      ;;
  esac

  tmp=$(mktemp)
  CODE=$(curl -sS -m 10 -o "$tmp" -w '%{http_code}' "$URL" 2>/dev/null || echo "000")
  TT=$(curl -sS -m 10 -o /dev/null -w '%{time_total}' "$URL" 2>/dev/null || echo "0.0")
  BODY=$(cat "$tmp" 2>/dev/null || echo "")
  rm -f "$tmp"

  # State classification
  VERDICT="unhealthy"
  if [ "$CODE" = "000" ]; then
    VERDICT="unhealthy"
  elif [ "${CODE:0:1}" = "2" ]; then
    if [ -z "$EXPECT" ] || [ "${BODY#*$EXPECT}" != "$BODY" ]; then
      # response time check
      if [ "${TT%.*}" -lt 3 ] 2>/dev/null || [ "${TT%%.*}" -lt 3 ] 2>/dev/null; then
        VERDICT="healthy"
      else
        VERDICT="degraded"
      fi
    else
      VERDICT="degraded"
    fi
  elif [ "${CODE:0:1}" = "3" ]; then
    VERDICT="degraded"
  fi

  RESULTS+=("{\"name\":\"$NAME\",\"verdict\":\"$VERDICT\",\"code\":$CODE,\"ttime\":$TT}")

  # Compare to prev
  PREV=$(echo "$PREV_STATE_JSON" | jq -r --arg n "$NAME" '.[$n].verdict // ""' 2>/dev/null || echo "")
  if [ "$PREV" != "$VERDICT" ]; then
    CHANGED=true
  fi

  # Update accumulator
  NEW_STATE_OBJECT=$(echo "$NEW_STATE_OBJECT" | jq --arg n "$NAME" --arg v "$VERDICT" --argjson code "$CODE" --argjson tt "$TT" --arg cat "$CATEGORY" --arg url "$URL" --arg ts "$TIMESTAMP" \
    '.[$n] = {verdict:$v, code:$code, ttime:$tt, category:$cat, url:$url, lastAt:$ts}')

  if [ "$VERDICT" = "unhealthy" ]; then
    UNHEALTHY+=("$NAME")
  fi

  # Append per-endpoint cycle record
  echo "{\"timestamp\":\"$TIMESTAMP\",\"name\":\"$NAME\",\"url\":\"$URL\",\"code\":$CODE,\"ttime\":$TT,\"verdict\":\"$VERDICT\"}" >> "$LOG_FILE"
done

# Persist state atomically
echo "$NEW_STATE_OBJECT" > "$STATE_FILE.tmp"
mv "$STATE_FILE.tmp" "$STATE_FILE"

# Persist run counter
echo "{\"count\":$RUN_COUNTER,\"lastRun\":\"$TIMESTAMP\"}" > "$RUN_COUNTER_FILE"

# Decide whether to publish to bus this cycle
EVERY_NTH_HEARTBEAT=8
SHOULD_PUBLISH=false
if [ "$CHANGED" = "true" ]; then
  SHOULD_PUBLISH=true
elif [ $((RUN_COUNTER % EVERY_NTH_HEARTBEAT)) -eq 0 ]; then
  SHOULD_PUBLISH=true
fi

if [ "$SHOULD_PUBLISH" = "true" ] && command -v redis-cli >/dev/null 2>&1; then
  PAYLOAD=$(jq -n \
    --arg ts "$TIMESTAMP" \
    --argjson changed "$CHANGED" \
    --argjson results "$(printf '%s\n' "${RESULTS[@]}" | jq -s '.')" \
    --argjson unhealthy "$(printf '%s\n' "${UNHEALTHY[@]+"${UNHEALTHY[@]}"}" | jq -R 'split("\n") | map(select(. != ""))' 2>/dev/null || echo '[]')" \
    '{type:"fleet-health", emittedAt:$ts, changed:$changed, results:$results, unhealthy:$unhealthy}')
  if [ -n "$PAYLOAD" ]; then
    redis-cli -h 127.0.0.1 -p 6379 PUBLISH tnf:bus:ingress "$PAYLOAD" >/dev/null || true
    redis-cli -h 127.0.0.1 -p 6379 HSET tnf:agent-registry "agent:tnf-fleet-health-probe" \
      "$(jq -n --arg ts "$TIMESTAMP" --argjson rc "$RUN_COUNTER" \
        '{agentId:"agent:tnf-fleet-health-probe", lastCycleAt:$ts, runCounter:$rc, endpointsChecked:'"$ENDPOINT_COUNT"', unhealthyEndpoints:'"${#UNHEALTHY[@]}"'}')" >/dev/null || true
  fi
fi

exit 0
