#!/usr/bin/env bash

# Local Subdirector (tnf-cli-agent) drain cycle.
# Pulls critical local watchdog reports from:
#   - tnf:subdirector:review:pending
#   - tnf:direct:sub-director:tnf-cli-agent (+ aliases)
# and writes ack artifacts under ~/.tnf/sub-director/run-artifacts/.

for _tnf_bin in python3 redis-cli; do
  command -v "$_tnf_bin" >/dev/null 2>&1 || {
    echo "FATAL: required binary '$_tnf_bin' not found. PATH=$PATH" >&2
    exit 127
  }
done

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
AGENT_ID="${TNF_LOCAL_SUBDIRECTOR_AGENT_ID:-${TNF_AGENT_ID:-tnf-cli-agent}}"
LOG_DIR="$HOME/.tnf/poll-jobs/tnf-subdirector-local-cli-agent"
LOG="$LOG_DIR/cron.log"
DRAIN_REPO="$REPO_ROOT/scripts/sub-director/drain_local_subdirector.py"
DRAIN_HOME="$HOME/.tnf/sub-director/drain_local_subdirector.py"

mkdir -p "$LOG_DIR" "$HOME/.tnf/sub-director/run-artifacts"
cd "$REPO_ROOT" || exit 1

log() { echo "[$(date -Iseconds)] $*" >> "$LOG"; }

# Always refresh interactive CLI availability first. Fleet pause must not hide
# co-resident sessions from Subdirector routing (announce is cheap + local).
if command -v node >/dev/null 2>&1 && [[ -f "$REPO_ROOT/scripts/agents/announce-live-cli-sessions.cjs" ]]; then
  node "$REPO_ROOT/scripts/agents/announce-live-cli-sessions.cjs" --json >> "$LOG" 2>&1 \
    || log "announce-live-cli-sessions failed (non-fatal)"
fi

# shellcheck source=/dev/null
# High priority: this cycle is the delegation path. When the watchdog pauses
# the fleet under load, everything else stopping is the point — but this
# stopping too is what left an operator directive with no way in on
# 2026-09-05. Admitted through a load-induced pause only, up to the hard
# ceiling; an operator pause still stops it dead.
source "$REPO_ROOT/scripts/lib/tnf-fleet-mode.sh" 2>/dev/null || true
if declare -F tnf_fleet_paused >/dev/null 2>&1 && tnf_fleet_paused high; then
  echo '{"ok":true,"skipped":"fleet-paused","announcedLive":true}'
  exit 0
fi

# Keep runtime copy in sync with repo (code only).
if [[ -f "$DRAIN_REPO" ]]; then
  cp -f "$DRAIN_REPO" "$DRAIN_HOME"
  chmod +x "$DRAIN_HOME"
fi

DRAIN="$DRAIN_HOME"
[[ -f "$DRAIN" ]] || DRAIN="$DRAIN_REPO"

export TNF_AGENT_ID="$AGENT_ID"
export TNF_LOCAL_SUBDIRECTOR_AGENT_ID="$AGENT_ID"

log "cycle open review=$(redis-cli -p 6379 LLEN tnf:subdirector:review:pending 2>/dev/null || echo 0) direct=$(redis-cli -p 6379 LLEN tnf:direct:sub-director:$AGENT_ID 2>/dev/null || echo 0) analytics=$(redis-cli -p 6379 LLEN tnf:master:tasks:analytics 2>/dev/null || echo 0) maintenance=$(redis-cli -p 6379 LLEN tnf:master:tasks:maintenance 2>/dev/null || echo 0) pending=$(redis-cli -p 6379 LLEN tnf:master:tasks:pending 2>/dev/null || echo 0)"

python3 "$DRAIN" --max-per-queue 25 --json >> "$LOG" 2>&1
RC=$?

# Mirror local master-clock state + live registry rows to the cloud Redis the
# hosted app reads (site audit 2026-09-08, A2/A3). Best effort: never changes RC.
if command -v node >/dev/null 2>&1 && [[ -f "$REPO_ROOT/scripts/runtime/mirror-local-state-to-cloud.cjs" ]]; then
  TNF_REPO_ROOT="$REPO_ROOT" node "$REPO_ROOT/scripts/runtime/mirror-local-state-to-cloud.cjs" >> "$LOG" 2>&1 \
    || log "mirror-local-state-to-cloud failed (non-fatal)"
fi

log "cycle closed rc=$RC review=$(redis-cli -p 6379 LLEN tnf:subdirector:review:pending 2>/dev/null || echo 0) direct=$(redis-cli -p 6379 LLEN tnf:direct:sub-director:$AGENT_ID 2>/dev/null || echo 0) analytics=$(redis-cli -p 6379 LLEN tnf:master:tasks:analytics 2>/dev/null || echo 0) maintenance=$(redis-cli -p 6379 LLEN tnf:master:tasks:maintenance 2>/dev/null || echo 0) pending=$(redis-cli -p 6379 LLEN tnf:master:tasks:pending 2>/dev/null || echo 0)"
exit "$RC"
