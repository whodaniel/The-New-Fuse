#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

TASK_FILE="${1:-}"
LOG_DIR=".agent/jules-logs"
mkdir -p "$LOG_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$LOG_DIR/jules-autonomous-loop-$STAMP.log"
SESSIONS_TMP="$LOG_DIR/jules-loop-sessions-$STAMP.txt"

log() {
  echo "[$(date +%H:%M:%S)] $*" | tee -a "$LOG_FILE"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd node
require_cmd gh
require_cmd jules
require_cmd jq

if [[ -f ".env.local" ]]; then
  # shellcheck disable=SC1091
  set -a && source .env.local && set +a
fi

log "Starting autonomous Jules loop."

if [[ -n "$TASK_FILE" ]]; then
  if [[ ! -f "$TASK_FILE" ]]; then
    echo "Task file not found: $TASK_FILE" >&2
    exit 1
  fi
  log "Starting new Jules sessions from task file: $TASK_FILE"
  node scripts/jules-pipeline.cjs start "$TASK_FILE" | tee -a "$LOG_FILE"
fi

log "Refreshing pipeline status."
node scripts/jules-pipeline.cjs status | tee -a "$LOG_FILE"

if [[ -f ".agent/jules-logs/pipeline-state.json" ]]; then
  jq -r '.sessions | to_entries[] | select((.value.prUrl == null or .value.prUrl == "") and (.value.status == "AWAITING_PLAN_APPROVAL" or .value.status == "PLANNING" or .value.status == "RUNNING" or .value.status == "COMPLETED" or .value.status == "REVIEW")) | .key' \
    ".agent/jules-logs/pipeline-state.json" > "$SESSIONS_TMP" || true

  if [[ -s "$SESSIONS_TMP" ]]; then
    log "Approving pending/active Jules plans."
    node scripts/jules-pr-orchestrator.cjs approve-plans --sessions-file "$SESSIONS_TMP" | tee -a "$LOG_FILE" || true
  else
    log "No sessions require plan approval."
  fi
fi

log "Publishing completed sessions as branches."
node scripts/jules-pipeline.cjs publish | tee -a "$LOG_FILE" || true

log "Creating/fetching PRs for published branches."
node scripts/jules-pipeline.cjs pr | tee -a "$LOG_FILE" || true

log "Merging open PRs and resolving conflicts."
bash scripts/jules-merge-open-prs.sh | tee -a "$LOG_FILE" || true

log "Final status snapshot."
node scripts/jules-pipeline.cjs status | tee -a "$LOG_FILE" || true

log "Autonomous Jules loop complete."
