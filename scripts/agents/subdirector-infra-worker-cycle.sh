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
# Cron-bound wrapper: hermes-infra-worker
# Same shape as the codegen wrapper; 15-min cadence x ~850s dwell.
# **NOTE**: gcp-build-submit capability deliberately absent from infra worker
# (submission is sub-director dual-key action).
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Provider credentials for the model resolver (site audit 2026-09-08, F4): cron has
# an empty environment, so without this every envelope resolved to
# "no backend available" even with default_tier=cloud-primary.
if [[ -f "$HOME/.tnf/credentials.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$HOME/.tnf/credentials.env"
  set +a
fi
# Python's urllib needs a CA bundle on python.org builds (site audit follow-up 2026-09-09:
# every cloud call failed CERTIFICATE_VERIFY_FAILED). Use certifi when present.
if _c="$(python3 -c 'import certifi,sys;sys.stdout.write(certifi.where())' 2>/dev/null)" && [[ -n "$_c" ]]; then
  export SSL_CERT_FILE="$_c" REQUESTS_CA_BUNDLE="$_c"
fi
REGISTRY_ID="agent_hermes-infra-worker_1782364000002"
LOG="$HOME/.tnf/poll-jobs/tnf-subdirector-infra-worker/cron.log"
ART_DIR="$HOME/.tnf/sub-director/run-artifacts"

mkdir -p "$(dirname "$LOG")" "$ART_DIR"
cd "$REPO_ROOT" || exit 1

NOW="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
DIRECT="tnf:direct:sub-director:$REGISTRY_ID"
PROCESSING="$DIRECT:processing"
log() { echo "[$(date -Iseconds)] $*" >> "$LOG"; }

PAYLOAD='{"id":"'"$REGISTRY_ID"'","name":"hermes-infra-worker","role":"worker","expectedCadenceSec":900,"platform":"claude","status":"active","isOnline":true,"capabilities":["infra_audit","cloud_run_manifest_validate","image_tag_resolve","build_config_render","rollout_health_probe","iam_scope_audit"],"registeredAt":"'"$NOW"'","lastSeen":"'"$NOW"'","routing":{"callableWorker":true,"directorPoolEligible":true},"source":"sub-director-cron-refresh","subdirector_authorized":true}'
redis-cli -p 6379 HSET tnf:agent-registry "$REGISTRY_ID" "$PAYLOAD" >> "$LOG" 2>&1

HB='{"header":{"agent_id":"'"$REGISTRY_ID"'","alg":"HS256","nonce":"hb-'"$(date +%s%N)"'","timestamp":'"$(date +%s%3N)"'},"payload":{"type":"heartbeat","channel":"tnf:agents","data":{"from":{"agentId":"'"$REGISTRY_ID"'","agentName":"hermes-infra-worker","role":"worker","platform":"claude"},"to":{"broadcast":true},"type":"heartbeat","content":"cron-refresh heartbeat","timestamp":"'"$NOW"'"}},"signature":"cron-hb"}'
redis-cli -p 6379 PUBLISH tnf:agents "$HB" >> "$LOG" 2>&1

# --- Fleet-wide pause gate (2026-07-21; moved below the heartbeat 2026-09-08) ---
# Registry refresh + heartbeat above are bookkeeping, not work: they must run even
# while the fleet is paused so the master clock and dashboards stop reporting this
# worker as "no heartbeat yet" (site audit 2026-09-08, F3). Only the envelope drain
# below is gated.
source "$REPO_ROOT/scripts/lib/tnf-fleet-mode.sh"
if tnf_fleet_paused high; then  # delegation lane: priority admission through a load-induced pause (same as the sub-director cycle, 2026-09-09)
  log "cycle skipped: fleet-paused (heartbeat still published)"
  echo '{"ok":true,"skipped":"fleet-paused","heartbeat":true}'
  exit 0
fi

log "cycle open queue_len=$(redis-cli -p 6379 LLEN "$DIRECT" 2>/dev/null || echo 0)"
python3 "$HOME/.tnf/sub-director/run_one_envelope.py" \
    --agent-id       "$REGISTRY_ID" \
    --capability     infra \
    --redis-key      "$DIRECT" \
    --max-dwell-sec  850 >> "$LOG" 2>&1
RC=$?
log "cycle closed rc=$RC final_queue_len=$(redis-cli -p 6379 LLEN "$DIRECT" 2>/dev/null || echo 0)"
exit 0
