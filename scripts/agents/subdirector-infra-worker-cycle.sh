#!/usr/bin/env bash
# Auto-generated 2026-06-25 by Sub-Director.
# Cron-bound wrapper: hermes-infra-worker
# Same shape as the codegen wrapper; 15-min cadence x ~850s dwell.
# **NOTE**: gcp-build-submit capability deliberately absent from infra worker
# (submission is sub-director dual-key action).
set -uo pipefail

REPO_ROOT="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse"
REGISTRY_ID="agent_hermes-infra-worker_1782364000002"
LOG="$HOME/.tnf/poll-jobs/tnf-subdirector-infra-worker/cron.log"
ART_DIR="$HOME/.tnf/sub-director/run-artifacts"

mkdir -p "$(dirname "$LOG")" "$ART_DIR"
cd "$REPO_ROOT" || exit 1

NOW="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
DIRECT="tnf:direct:sub-director:$REGISTRY_ID"
PROCESSING="$DIRECT:processing"
log() { echo "[$(date -Iseconds)] $*" >> "$LOG"; }

PAYLOAD='{"id":"'"$REGISTRY_ID"'","name":"hermes-infra-worker","role":"worker","platform":"claude","status":"active","isOnline":true,"capabilities":["infra_audit","cloud_run_manifest_validate","image_tag_resolve","build_config_render","rollout_health_probe","iam_scope_audit"],"registeredAt":"'"$NOW"'","lastSeen":"'"$NOW"'","routing":{"callableWorker":true,"directorPoolEligible":true},"source":"sub-director-cron-refresh","subdirector_authorized":true}'
redis-cli -p 6379 HSET tnf:agent-registry "$REGISTRY_ID" "$PAYLOAD" >> "$LOG" 2>&1

HB='{"header":{"agent_id":"'"$REGISTRY_ID"'","alg":"HS256","nonce":"hb-'"$(date +%s%N)"'","timestamp":'"$(date +%s%3N)"'},"payload":{"type":"heartbeat","channel":"tnf:agents","data":{"from":{"agentId":"'"$REGISTRY_ID"'","agentName":"hermes-infra-worker","role":"worker","platform":"claude"},"to":{"broadcast":true},"type":"heartbeat","content":"cron-refresh heartbeat","timestamp":"'"$NOW"'"}},"signature":"cron-hb"}'
redis-cli -p 6379 PUBLISH tnf:agents "$HB" >> "$LOG" 2>&1

log "cycle open queue_len=$(redis-cli -p 6379 LLEN "$DIRECT" 2>/dev/null || echo 0)"
python3 "$HOME/.tnf/sub-director/run_one_envelope.py" \
    --agent-id       "$REGISTRY_ID" \
    --capability     infra \
    --redis-key      "$DIRECT" \
    --max-dwell-sec  850 >> "$LOG" 2>&1
RC=$?
log "cycle closed rc=$RC final_queue_len=$(redis-cli -p 6379 LLEN "$DIRECT" 2>/dev/null || echo 0)"
exit 0
