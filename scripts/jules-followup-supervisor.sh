#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

LOG_DIR=".agent/jules-logs"
mkdir -p "$LOG_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$LOG_DIR/jules-followup-supervisor-$STAMP.log"
PID_FILE="$LOG_DIR/jules-followup-supervisor.pid"
LOCK_DIR="$LOG_DIR/jules-followup-supervisor.lock"
HEARTBEAT_FILE="$LOG_DIR/jules-followup-heartbeat.json"
STATE_FILE="$LOG_DIR/jules-followup-supervisor-state.json"
FOLLOWUP_TMP="$LOG_DIR/jules-followup-sessions-$STAMP.txt"
PUBLISH_TMP="$LOG_DIR/jules-followup-publish-$STAMP.txt"
STALL_TMP="$LOG_DIR/jules-followup-stalled-$STAMP.txt"

INTERVAL_SEC="${JULES_SUPERVISOR_INTERVAL_SEC:-180}"
ADVANCE_EVERY="${JULES_SUPERVISOR_ADVANCE_EVERY:-3}"
MAX_CONSECUTIVE_ERRORS="${JULES_SUPERVISOR_MAX_ERRORS:-10}"
ADVANCE_PROMPT="${JULES_SUPERVISOR_ADVANCE_PROMPT:-Required follow-up: publish your branch and open a GitHub PR against whodaniel/fuse main. Use automated checks only; do not request manual frontend/browser viewing. Reply with BRANCH and PR_URL.}"
ALERT_WEBHOOK_URL="${JULES_ALERT_WEBHOOK_URL:-}"
ALERT_COOLDOWN_SEC="${JULES_ALERT_COOLDOWN_SEC:-1800}"
ALERT_STALLED_CYCLES="${JULES_ALERT_STALLED_CYCLES:-3}"

consecutive_errors=0
cycle=0

log() {
  echo "[$(date +%H:%M:%S)] [Jules-Supervisor] $*" | tee -a "$LOG_FILE"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

cleanup() {
  rm -rf "$LOCK_DIR" 2>/dev/null || true
  if [[ -f "$PID_FILE" ]] && [[ "$(cat "$PID_FILE" 2>/dev/null || true)" == "$$" ]]; then
    rm -f "$PID_FILE"
  fi
}

now_epoch() {
  date +%s
}

ensure_state_file() {
  if [[ ! -f "$STATE_FILE" ]]; then
    echo '{"stalledCycles":{},"lastAlertAt":{}}' > "$STATE_FILE"
  fi
}

set_stalled_counts() {
  local ids_json="$1"
  local tmp
  tmp="$(mktemp)"
  jq --argjson ids "$ids_json" '
    . as $root
    | .stalledCycles = (
        reduce $ids[] as $id
          ({};
            .[$id] = (($root.stalledCycles[$id] // 0) + 1)
          )
      )
  ' "$STATE_FILE" > "$tmp" && mv "$tmp" "$STATE_FILE"
}

can_send_alert() {
  local key="$1"
  if [[ -z "$ALERT_WEBHOOK_URL" ]]; then
    return 1
  fi
  ensure_state_file
  local now last
  now="$(now_epoch)"
  last="$(jq -r --arg k "$key" '.lastAlertAt[$k] // 0' "$STATE_FILE" 2>/dev/null || echo "0")"
  if ! [[ "$last" =~ ^[0-9]+$ ]]; then
    last=0
  fi
  (( now - last >= ALERT_COOLDOWN_SEC ))
}

record_alert_sent() {
  local key="$1"
  ensure_state_file
  local now tmp
  now="$(now_epoch)"
  tmp="$(mktemp)"
  jq --arg k "$key" --argjson now "$now" '.lastAlertAt[$k] = $now' "$STATE_FILE" > "$tmp" && mv "$tmp" "$STATE_FILE"
}

send_alert() {
  local key="$1"
  local level="$2"
  local title="$3"
  local message="$4"
  local meta_json="${5:-{}}"

  if ! can_send_alert "$key"; then
    return 0
  fi

  local payload
  payload="$(
    jq -n \
      --arg level "$level" \
      --arg title "$title" \
      --arg message "$message" \
      --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      --arg repo "$REPO_ROOT" \
      --arg supervisor "jules-followup-supervisor" \
      --argjson meta "$meta_json" \
      '{
        level: $level,
        title: $title,
        message: $message,
        timestamp: $timestamp,
        supervisor: $supervisor,
        repo: $repo,
        meta: $meta
      }'
  )"

  if curl -fsS -X POST -H "Content-Type: application/json" -d "$payload" "$ALERT_WEBHOOK_URL" >/dev/null; then
    log "Alert sent: $title"
    record_alert_sent "$key"
  else
    log "Alert delivery failed for key=$key"
  fi
}

write_heartbeat() {
  local phase="$1"
  local notes="$2"
  local summary_json
  if [[ -f "$REPO_ROOT/.agent/jules-logs/pipeline-state.json" ]]; then
    summary_json="$(
      jq -c '
        .sessions as $s |
        {
          total: ($s | length),
          review: ($s | to_entries | map(select(.value.status == "REVIEW")) | length),
          completed: ($s | to_entries | map(select(.value.status == "COMPLETED")) | length),
          running: ($s | to_entries | map(select(.value.status == "RUNNING")) | length),
          awaiting_plan: ($s | to_entries | map(select(.value.status == "AWAITING_PLAN_APPROVAL")) | length),
          without_pr: ($s | to_entries | map(select((.value.prUrl // "") == "")) | length),
          without_branch: ($s | to_entries | map(select((.value.branch // "") == "")) | length)
        }
      ' "$REPO_ROOT/.agent/jules-logs/pipeline-state.json" 2>/dev/null || echo '{}'
    )"
  else
    summary_json='{}'
  fi

  jq -n \
    --arg now "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg phase "$phase" \
    --arg notes "$notes" \
    --arg pid "$$" \
    --arg cycle "$cycle" \
    --arg interval "$INTERVAL_SEC" \
    --arg errors "$consecutive_errors" \
    --argjson summary "$summary_json" \
    '{
      timestamp: $now,
      phase: $phase,
      notes: $notes,
      pid: ($pid | tonumber),
      cycle: ($cycle | tonumber),
      interval_sec: ($interval | tonumber),
      consecutive_errors: ($errors | tonumber),
      summary: $summary
    }' > "$HEARTBEAT_FILE"
}

run_step() {
  local label="$1"
  shift
  log "$label"
  if "$@" >>"$LOG_FILE" 2>&1; then
    return 0
  fi
  log "Step failed: $label"
  return 1
}

require_cmd node
require_cmd jq
require_cmd jules
require_cmd gh
if [[ -n "${ALERT_WEBHOOK_URL:-}" ]]; then
  require_cmd curl
fi

if [[ -f ".env.local" ]]; then
  # shellcheck disable=SC1091
  set -a && source ".env.local" && set +a
fi

if ! [[ "$INTERVAL_SEC" =~ ^[0-9]+$ ]] || [[ "$INTERVAL_SEC" -lt 30 ]]; then
  echo "JULES_SUPERVISOR_INTERVAL_SEC must be an integer >= 30" >&2
  exit 1
fi

if ! [[ "$ADVANCE_EVERY" =~ ^[0-9]+$ ]] || [[ "$ADVANCE_EVERY" -lt 1 ]]; then
  echo "JULES_SUPERVISOR_ADVANCE_EVERY must be an integer >= 1" >&2
  exit 1
fi

if ! [[ "$MAX_CONSECUTIVE_ERRORS" =~ ^[0-9]+$ ]] || [[ "$MAX_CONSECUTIVE_ERRORS" -lt 1 ]]; then
  echo "JULES_SUPERVISOR_MAX_ERRORS must be an integer >= 1" >&2
  exit 1
fi

if ! [[ "$ALERT_COOLDOWN_SEC" =~ ^[0-9]+$ ]] || [[ "$ALERT_COOLDOWN_SEC" -lt 0 ]]; then
  echo "JULES_ALERT_COOLDOWN_SEC must be an integer >= 0" >&2
  exit 1
fi

if ! [[ "$ALERT_STALLED_CYCLES" =~ ^[0-9]+$ ]] || [[ "$ALERT_STALLED_CYCLES" -lt 1 ]]; then
  echo "JULES_ALERT_STALLED_CYCLES must be an integer >= 1" >&2
  exit 1
fi

ensure_state_file

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  if [[ -f "$PID_FILE" ]]; then
    existing_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [[ -n "$existing_pid" ]] && kill -0 "$existing_pid" 2>/dev/null; then
      echo "Another Jules supervisor is already running (pid=$existing_pid)." >&2
      exit 1
    fi
  fi
  rm -rf "$LOCK_DIR"
  mkdir "$LOCK_DIR"
fi

trap cleanup EXIT INT TERM
echo "$$" > "$PID_FILE"

log "Supervisor started (pid=$$, interval=${INTERVAL_SEC}s, advance_every=${ADVANCE_EVERY} cycles)."
write_heartbeat "started" "Supervisor boot complete"

while true; do
  cycle=$((cycle + 1))
  cycle_failed=0

  log "========================================================"
  log "Cycle $cycle begin"
  write_heartbeat "cycle-start" "Cycle $cycle begin"

  if ! run_step "Refreshing pipeline status" node scripts/jules-pipeline.cjs status; then
    cycle_failed=1
  fi

  if [[ -f "$REPO_ROOT/.agent/jules-logs/pipeline-state.json" ]]; then
    jq -r '.sessions | to_entries[] | select((.value.prUrl == null or .value.prUrl == "") and (.value.status == "AWAITING_PLAN_APPROVAL" or .value.status == "PLANNING" or .value.status == "RUNNING" or .value.status == "COMPLETED" or .value.status == "REVIEW")) | .key' \
      "$REPO_ROOT/.agent/jules-logs/pipeline-state.json" > "$FOLLOWUP_TMP" || true

    jq -r '.sessions | to_entries[] | select((.value.branch == null or .value.branch == "") and (.value.status == "COMPLETED" or .value.status == "REVIEW")) | .key' \
      "$REPO_ROOT/.agent/jules-logs/pipeline-state.json" > "$PUBLISH_TMP" || true

    jq -r '.sessions | to_entries[] | select((.value.prUrl == null or .value.prUrl == "") and (.value.status == "REVIEW" or .value.status == "COMPLETED")) | .key' \
      "$REPO_ROOT/.agent/jules-logs/pipeline-state.json" > "$STALL_TMP" || true
  else
    : > "$FOLLOWUP_TMP"
    : > "$PUBLISH_TMP"
    : > "$STALL_TMP"
  fi

  followup_count="$(wc -l < "$FOLLOWUP_TMP" | tr -d ' ')"
  publish_count="$(wc -l < "$PUBLISH_TMP" | tr -d ' ')"
  stall_count="$(wc -l < "$STALL_TMP" | tr -d ' ')"
  log "Candidates: followup=$followup_count publish=$publish_count stalled_no_pr=$stall_count"

  stalled_ids_json="$(jq -R -s 'split("\n") | map(select(length > 0))' "$STALL_TMP")"
  set_stalled_counts "$stalled_ids_json"
  stalled_offenders="$(
    jq -r --argjson threshold "$ALERT_STALLED_CYCLES" '
      .stalledCycles
      | to_entries
      | map(select(.value >= $threshold))
      | sort_by(-.value)
      | .[:12]
      | map("\(.key):\(.value)")
      | .[]
    ' "$STATE_FILE" 2>/dev/null || true
  )"
  if [[ -n "${stalled_offenders:-}" ]]; then
    offenders_one_line="$(echo "$stalled_offenders" | tr '\n' ' ' | sed 's/[[:space:]]\+$//')"
    send_alert \
      "stalled-sessions" \
      "warning" \
      "Jules sessions stalled without PR" \
      "Some sessions remain REVIEW/COMPLETED without PR across multiple cycles." \
      "$(jq -n --arg offenders "$offenders_one_line" --argjson threshold "$ALERT_STALLED_CYCLES" --argjson cycle "$cycle" '{offenders:$offenders, stalled_threshold_cycles:$threshold, cycle:$cycle}')"
  fi

  if [[ -s "$FOLLOWUP_TMP" ]]; then
    if ! run_step "Approving pending/active plans" node scripts/jules-pr-orchestrator.cjs approve-plans --sessions-file "$FOLLOWUP_TMP"; then
      cycle_failed=1
    fi

    if (( cycle % ADVANCE_EVERY == 0 )); then
      if ! run_step "Advancing stale no-PR sessions" node scripts/jules-pr-orchestrator.cjs advance --sessions-file "$FOLLOWUP_TMP" --prompt "$ADVANCE_PROMPT"; then
        cycle_failed=1
      fi
    else
      log "Advance pass skipped this cycle (every ${ADVANCE_EVERY} cycles)."
    fi
  else
    log "No sessions need plan approval/follow-up prompting."
  fi

  if [[ -s "$PUBLISH_TMP" ]]; then
    if ! run_step "Publishing completed/review sessions" node scripts/jules-publish-prs.cjs --sessions-file "$PUBLISH_TMP" --mode publish --limit "$publish_count" --repo whodaniel/fuse --base main; then
      cycle_failed=1
    fi
  else
    log "No sessions need branch publish."
  fi

  if ! run_step "Opening/fetching PRs for published branches" node scripts/jules-pipeline.cjs pr; then
    cycle_failed=1
  fi

  if ! run_step "Merging open PRs and resolving conflicts" bash scripts/jules-merge-open-prs.sh; then
    cycle_failed=1
  fi

  if ! run_step "Final status refresh" node scripts/jules-pipeline.cjs status; then
    cycle_failed=1
  fi

  if [[ "$cycle_failed" -eq 1 ]]; then
    consecutive_errors=$((consecutive_errors + 1))
    log "Cycle $cycle completed with errors (consecutive_errors=$consecutive_errors)."
    write_heartbeat "cycle-error" "Cycle $cycle completed with errors"
    send_alert \
      "cycle-errors" \
      "warning" \
      "Jules supervisor cycle failed" \
      "A Jules follow-up cycle completed with errors." \
      "$(jq -n --argjson cycle "$cycle" --argjson consecutive_errors "$consecutive_errors" '{cycle:$cycle, consecutive_errors:$consecutive_errors}')"
  else
    consecutive_errors=0
    log "Cycle $cycle completed successfully."
    write_heartbeat "cycle-ok" "Cycle $cycle completed successfully"
  fi

  if [[ "$consecutive_errors" -ge "$MAX_CONSECUTIVE_ERRORS" ]]; then
    log "Too many consecutive failing cycles. Exiting for safety."
    write_heartbeat "stopped" "Exceeded max consecutive errors"
    send_alert \
      "supervisor-stopped-errors" \
      "critical" \
      "Jules supervisor stopped after repeated errors" \
      "Supervisor exited after reaching max consecutive error threshold." \
      "$(jq -n --argjson cycle "$cycle" --argjson max_errors "$MAX_CONSECUTIVE_ERRORS" '{cycle:$cycle, max_errors:$max_errors}')"
    exit 1
  fi

  log "Sleeping ${INTERVAL_SEC}s before next cycle."
  sleep "$INTERVAL_SEC"
done
