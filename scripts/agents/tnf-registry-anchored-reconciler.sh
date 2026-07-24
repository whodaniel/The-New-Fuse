#!/usr/bin/env bash
# tnf-registry-anchored-reconciler.sh — TNF Registry Drift Anchorer
#
# PURPOSE
#   Quantify and persist the registry↔runtime drift that LIVING_STATE
#   does not currently pin. Two numbers matter:
#     A) Agents registered in Redis at tnf:agent-registry
#        (the authority-of-record for who-can-act).
#     B) Agents the relay reports as live (the runtime truth).
#   The delta is the answer to "is anyone actually talking right now?"
#   and is the single hardest signal that the master-clock cull decision
#   (operator-gated per LIVING_STATE) hinges on.
#
#   This script is read-only; it never mutates the registry. It only
#   records the drift and emits a classification hint so the operator
#   gets a stable snapshot every cycle instead of stale eyeball math.
#
# CLASSIFICATION HINTS (informational, not auto-action)
#   - drift=0            : registry == runtime, healthy
#   - drift>0, reg>A     : registry authority > runtime presence
#                           (cold/aged agents; probable cause: crashed
#                            workers not re-registering)
#   - drift>0, reg<=A    : relay inflated              (less common)
#   - relay off          : relay down; registry stale until relay heal
#
# OUTPUT
#   ~/.tnf/runtime/registry-anchored/drift-YYYYMMDD.jsonl
#   ~/.tnf/runtime/registry-anchored/latest.json
#   HSET tnf:agent-registry  agent:tnf-registry-anchored-reconciler
#   PUBLISH                tnf:bus:ingress (one message,cls)
#
# AUTH
#   Skips on fleet pause. Idempotent. No LLM.

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/scripts/lib/tnf-fleet-mode.sh"
if tnf_fleet_paused; then
  echo '{"ok":true,"skipped":"fleet-paused"}'
  exit 0
fi

export PATH="/usr/local/bin:/opt/homebrew/bin:${PATH}"

STAMP="$(date -u +%Y%m%dT%H-%M-%SZ)"
TODAY="$(date -u +%Y%m%d)"
STATE_DIR="${HOME}/.tnf/runtime/registry-anchored"
ISSUES_FILE="${STATE_DIR}/drift-${TODAY}.jsonl"
LATEST_FILE="${STATE_DIR}/latest.json"
mkdir -p "${STATE_DIR}"

# --- 1. Probe Redis registry (authority) ---
REG_COUNT="$(redis-cli -h 127.0.0.1 -p 6379 HLEN tnf:agent-registry 2>/dev/null | tr -d '[:space:]' || echo 0)"
[ -z "${REG_COUNT}" ] && REG_COUNT=0

# --- 2. Probe relay runtime (truth) ---
# The relay exposes /health (status + agents count) and, in some
# versions, /agents (full list). Probe both, degrade gracefully.
# Port matrix tried in order: env TNF_RELAY_HTTP_URL, then the
# canonical known set (3000, 3001, 4010, 7777, 8787). The first
# *that responds with a JSON status* (NOT HTML) wins. Many dev
# stacks serve Vite on 3000 by accident, so the HTML-reject check
# below is load-bearing.
RELAY_UP=0
RUNTIME_COUNT=0
RUNTIME_PORT=0
RELAY_URL="${TNF_RELAY_HTTP_URL:-}"
PORTS=()
[ -n "${RELAY_URL}" ] && PORTS+=("${RELAY_URL##*:}")
for p in 3000 3001 4010 7777 8787; do
  PORTS+=("${p}")
done

for u in "${PORTS[@]}"; do
  HEALTH_BODY="$(curl -s --max-time 2 "http://127.0.0.1:${u}/health" 2>/dev/null || true)"
  # Must be JSON (status:{...}) — HTML rejection matches reality
  # (Vite claims the same dev port in some sessions).
  if [ -n "${HEALTH_BODY}" ] && python3 -c "import sys,json; json.loads(sys.stdin.read())" 2>/dev/null <<<"${HEALTH_BODY}" >/dev/null \
       && grep -q '"status":"ok"' <<<"${HEALTH_BODY}"; then
    RELAY_UP=1
    RUNTIME_PORT="${u}"
    AG_FROM_HEALTH="$(printf '%s' "${HEALTH_BODY}" \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print(int(d.get('agents', 0) or 0))" 2>/dev/null || echo 0)"
    if [ "${AG_FROM_HEALTH:-0}" -gt 0 ]; then
      RUNTIME_COUNT="${AG_FROM_HEALTH}"
    else
      AG_LIST="$(curl -s --max-time 2 "http://127.0.0.1:${u}/agents" 2>/dev/null || true)"
      if [ -n "${AG_LIST}" ] && python3 -c "import sys,json; json.loads(sys.stdin.read())" 2>/dev/null <<<"${AG_LIST}" >/dev/null; then
        RUNTIME_COUNT="$(printf '%s' "${AG_LIST}" \
          | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d, list) else 0)" 2>/dev/null || echo 0)"
      fi
    fi
    break
  fi
done

# --- 3. Drift classification ---
# Hunt order (descending specificity):
#   1. canonical port (3000) responded with NON-JSON
#         -> RELAY_DISPLACED: real relay is missing/owner-changed
#            and Vite/another service has claimed the port.
#   2. retry-class probe found NO healthy relay on any port
#         -> relay-down-registry-stale
#   3. healthy relay found, runtime>0, reg==0  -> runtime-exceeds-registry
#   4. healthy relay, runtime==0, reg>0       -> relay-fleet-cold-no-joins
#   5. both positive, delta evaluation          -> drift bands
HINT="drift=0"
# Probe canonical port separately to detect displacement (HTML on 3000
# while the relay fleet expects JSON).
CANONICAL_BODY="$(curl -s --max-time 2 "http://127.0.0.1:3000/health" 2>/dev/null || true)"
CANONICAL_IS_JSON=0
if [ -n "${CANONICAL_BODY}" ] \
   && python3 -c "import sys,json; json.loads(sys.stdin.read())" 2>/dev/null <<<"${CANONICAL_BODY}" >/dev/null; then
  CANONICAL_IS_JSON=1
fi

DRIFT=$(( REG_COUNT - RUNTIME_COUNT ))
if   [ "${RELAY_UP}" -eq 1 ] && [ -n "${CANONICAL_BODY}" ] && [ "${CANONICAL_IS_JSON}" -eq 0 ]; then
  HINT="relay-displaced-port-stolen"
elif [ "${RELAY_UP}" -eq 0 ]; then
  HINT="relay-down-registry-stale"
elif [ "${RELAY_UP}" -eq 1 ] && [ "${RUNTIME_COUNT}" -eq 0 ] && [ "${REG_COUNT}" -gt 0 ]; then
  HINT="relay-fleet-cold-no-joins"
elif [ "${RUNTIME_COUNT}" -gt 0 ] && [ "${REG_COUNT}" -eq 0 ]; then
  HINT="runtime-exceeds-registry"
elif [ "${DRIFT}" -gt 0 ]; then
  HINT="registry-authority-exceeds-runtime"
elif [ "${DRIFT}" -lt 0 ]; then
  HINT="runtime-exceeds-registry"
fi

# --- 4. Record ---
RECORD="$(jq -n \
  --arg ts        "${STAMP}" \
  --argjson reg   "${REG_COUNT}" \
  --argjson run   "${RUNTIME_COUNT}" \
  --argjson drift "${DRIFT}" \
  --argjson relay "${RELAY_UP}" \
  --argjson port  "${RUNTIME_PORT}" \
  --arg hint       "${HINT}" \
  '{ts:$ts, agent:"tnf-registry-anchored-reconciler",
    redisRegistryCount:$reg, relayRuntimeCount:$run, drift:$drift,
    relayUp:$relay, relayPort:$port, classification:$hint,
    note:"read-only; no fixes attempted; cull + restart are operator-gated"}')"
printf '%s\n' "${RECORD}" >> "${ISSUES_FILE}"
printf '%s\n' "${RECORD}" > "${LATEST_FILE}"

# --- 5. Bus heartbeat ---
PAYLOAD="$(jq -c -n --arg ts "${STAMP}" --argjson d "${DRIFT}" --arg h "${HINT}" \
  '{ts:$ts, agent:"tnf-registry-anchored-reconciler", drift:$d, classification:$h}' \
  2>/dev/null || true)"
if [ -n "${PAYLOAD}" ]; then
  redis-cli -h 127.0.0.1 -p 6379 HSET tnf:agent-registry \
    "agent:tnf-registry-anchored-reconciler" "${PAYLOAD}" >/dev/null 2>&1 || true
  redis-cli -h 127.0.0.1 -p 6379 PUBLISH tnf:bus:ingress "${PAYLOAD}" \
    >/dev/null 2>&1 || true
fi

echo "${RECORD}" | jq -c '{ts,redisRegistryCount,relayRuntimeCount,drift,classification}' 2>/dev/null \
  || echo "${STAMP} reg=${REG_COUNT} runtime=${RUNTIME_COUNT} drift=${DRIFT} hint=${HINT}"
exit 0
