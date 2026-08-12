#!/usr/bin/env bash

# --- tnf dependency preflight ------------------------------------------
# cron's minimal PATH omits where this machine keeps its tooling. With no
# 'set -e', a missing binary yields 'command not found', exit 0, and a
# cycle cron records as successful while doing nothing. Fail loudly.
for _tnf_bin in python3 redis-cli; do
  command -v "$_tnf_bin" >/dev/null 2>&1 || {
    echo "FATAL: required binary '$_tnf_bin' not found. PATH=$PATH" >&2
    exit 127
  }
done
# --- end tnf dependency preflight -----------------------------------

# Auto-generated 2026-06-25 by Sub-Director.
# Cron-bound wrapper: hermes-codegen-worker
# - Refreshes its registry HSET row in tnf:agent-registry (idempotent)
# - Emits a heartbeat to tnf:agents
# - Drains ONE envelope from tnf:direct:sub-director:<id>, resolves a model via
#   ~/.tnf/sub-director/model_resolver.py (local-first; cloud only when explicitly
#   authorized at envelope or policy level), invokes it, writes a run artifact
#   under ~/.tnf/sub-director/run-artifacts/, archives the envelope.
# - 5-min cadence x ~250s dwell; processes one envelope per cycle.
# **NOTE**: gcp-build-submit capability deliberately absent from infra worker.
set -uo pipefail

# --- Fleet-wide pause gate (2026-07-21) ---
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/scripts/lib/tnf-fleet-mode.sh"
if tnf_fleet_paused; then
  echo '{"ok":true,"skipped":"fleet-paused"}'
  exit 0
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REGISTRY_ID="agent_hermes-codegen-worker_1782364000001"
LOG="$HOME/.tnf/poll-jobs/tnf-subdirector-codegen-worker/cron.log"
ART_DIR="$HOME/.tnf/sub-director/run-artifacts"

mkdir -p "$(dirname "$LOG")" "$ART_DIR"
cd "$REPO_ROOT" || exit 1

NOW="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
DIRECT="tnf:direct:sub-director:$REGISTRY_ID"
PROCESSING="$DIRECT:processing"

log()  { echo "[$(date -Iseconds)] $*" >> "$LOG"; }

# 1. Registry refresh
PAYLOAD='{"id":"'"$REGISTRY_ID"'","name":"hermes-codegen-worker","role":"worker","expectedCadenceSec":300,"platform":"claude","status":"active","isOnline":true,"capabilities":["code_generation","typescript_strict","monorepo_pnpm","pnpm_filter_invocation","drizzle_migration_apply","zod_schema_generation","subagent_dispatch_handoff"],"registeredAt":"'"$NOW"'","lastSeen":"'"$NOW"'","routing":{"callableWorker":true,"directorPoolEligible":true},"source":"sub-director-cron-refresh","subdirector_authorized":true}'
redis-cli -p 6379 HSET tnf:agent-registry "$REGISTRY_ID" "$PAYLOAD" >> "$LOG" 2>&1

# 2. Heartbeat pulse on tnf:agents
HB='{"header":{"agent_id":"'"$REGISTRY_ID"'","alg":"HS256","nonce":"hb-'"$(date +%s%N)"'","timestamp":'"$(date +%s%3N)"'},"payload":{"type":"heartbeat","channel":"tnf:agents","data":{"from":{"agentId":"'"$REGISTRY_ID"'","agentName":"hermes-codegen-worker","role":"worker","platform":"claude"},"to":{"broadcast":true},"type":"heartbeat","content":"cron-refresh heartbeat","timestamp":"'"$NOW"'"}},"signature":"cron-hb"}'
redis-cli -p 6379 PUBLISH tnf:agents "$HB" >> "$LOG" 2>&1

# 3. Drain ONE envelope per cron window
log "cycle open queue_len=$(redis-cli -p 6379 LLEN "$DIRECT" 2>/dev/null || echo 0)"
python3 "$HOME/.tnf/sub-director/run_one_envelope.py" \
    --agent-id       "$REGISTRY_ID" \
    --capability     code \
    --redis-key      "$DIRECT" \
    --max-dwell-sec  250 >> "$LOG" 2>&1
RC=$?
log "cycle closed rc=$RC final_queue_len=$(redis-cli -p 6379 LLEN "$DIRECT" 2>/dev/null || echo 0)"
exit 0
