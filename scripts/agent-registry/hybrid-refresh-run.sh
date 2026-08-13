#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

STATE_DIR="${AGENT_REGISTRY_REFRESH_STATE_DIR:-$HOME/.tnf/agent-registry-hybrid-refresh}"
LOG_DIR="$STATE_DIR/logs"
mkdir -p "$LOG_DIR"

REINDEX_ALL="${AGENT_REGISTRY_HYBRID_REINDEX_ALL:-false}"
SKIP_BUILD="${AGENT_REGISTRY_HYBRID_SKIP_BUILD:-false}"
SKIP_SCREEN="${AGENT_REGISTRY_HYBRID_SKIP_SCREEN:-false}"
API_BASE="${AGENT_REGISTRY_API_BASE:-}"
IMPORT_TOKEN="${AGENT_REGISTRY_IMPORT_TOKEN:-}"
VERIFY_INQUIRY="${AGENT_REGISTRY_HYBRID_VERIFY_INQUIRY:-}"
ALERT_WEBHOOK_URL="${AGENT_REGISTRY_ALERT_WEBHOOK_URL:-}"
ALERT_COOLDOWN_SEC="${AGENT_REGISTRY_ALERT_COOLDOWN_SEC:-1800}"
ALERT_ON_SUCCESS="${AGENT_REGISTRY_ALERT_ON_SUCCESS:-false}"
DRY_RUN=false

usage() {
  cat <<'EOF'
Usage:
  scripts/agent-registry/hybrid-refresh-run.sh [options]

Options:
  --api-base <url>            Override AGENT_REGISTRY_API_BASE
  --token <token>             Override AGENT_REGISTRY_IMPORT_TOKEN
  --inquiry <text>            Override AGENT_REGISTRY_HYBRID_VERIFY_INQUIRY
  --reindex-all               Force full vector reindex after import
  --skip-build                Skip local snapshot rebuild
  --skip-screen               Skip /traits/screen hybrid verification
  --dry-run                   Print resolved command and exit
  --help, -h                  Show this help

Environment:
  AGENT_REGISTRY_API_BASE
  AGENT_REGISTRY_IMPORT_TOKEN
  AGENT_REGISTRY_HYBRID_REINDEX_ALL=true|false
  AGENT_REGISTRY_HYBRID_SKIP_BUILD=true|false
  AGENT_REGISTRY_HYBRID_SKIP_SCREEN=true|false
  AGENT_REGISTRY_HYBRID_VERIFY_INQUIRY="..."
  AGENT_REGISTRY_ALERT_WEBHOOK_URL=https://...
  AGENT_REGISTRY_ALERT_COOLDOWN_SEC=1800
  AGENT_REGISTRY_ALERT_ON_SUCCESS=true|false
  AGENT_REGISTRY_REFRESH_STATE_DIR=~/.tnf/agent-registry-hybrid-refresh
EOF
}

is_true() {
  local value
  value="$(printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]')"
  case "$value" in
    1|true|yes|on) return 0 ;;
    *) return 1 ;;
  esac
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-base)
      API_BASE="${2:-}"
      shift 2
      ;;
    --token)
      IMPORT_TOKEN="${2:-}"
      shift 2
      ;;
    --inquiry)
      VERIFY_INQUIRY="${2:-}"
      shift 2
      ;;
    --reindex-all)
      REINDEX_ALL=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-screen)
      SKIP_SCREEN=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if ! [[ "$ALERT_COOLDOWN_SEC" =~ ^[0-9]+$ ]]; then
  echo "AGENT_REGISTRY_ALERT_COOLDOWN_SEC must be an integer >= 0" >&2
  exit 1
fi

send_webhook_alert() {
  local level="$1"
  local title="$2"
  local message="$3"
  local run_log="$4"
  local run_id="$5"
  local alerts_file="$STATE_DIR/alerts.jsonl"

  jq -cn \
    --arg level "$level" \
    --arg title "$title" \
    --arg message "$message" \
    --arg run_log "$run_log" \
    --arg run_id "$run_id" \
    --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{level:$level,title:$title,message:$message,runLog:$run_log,runId:$run_id,timestamp:$timestamp}' >> "$alerts_file"

  if [[ -z "$ALERT_WEBHOOK_URL" ]]; then
    return 0
  fi

  local cooldown_file="$STATE_DIR/last-alert-${level}.epoch"
  local now_epoch
  now_epoch="$(date +%s)"

  if [[ -f "$cooldown_file" ]]; then
    local last_epoch
    last_epoch="$(cat "$cooldown_file" 2>/dev/null || echo 0)"
    if [[ "$last_epoch" =~ ^[0-9]+$ ]] && (( now_epoch - last_epoch < ALERT_COOLDOWN_SEC )); then
      return 0
    fi
  fi

  local payload
  payload="$(
    jq -n \
      --arg level "$level" \
      --arg title "$title" \
      --arg message "$message" \
      --arg run_id "$run_id" \
      --arg run_log "$run_log" \
      --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
      --arg repo "$ROOT_DIR" \
      '{
        level: $level,
        title: $title,
        message: $message,
        timestamp: $timestamp,
        run_id: $run_id,
        run_log: $run_log,
        repo: $repo
      }'
  )"

  if curl -fsS -X POST -H "Content-Type: application/json" -d "$payload" "$ALERT_WEBHOOK_URL" >/dev/null; then
    printf '%s\n' "$now_epoch" > "$cooldown_file"
    echo "Alert delivered (${level})"
  else
    echo "Alert delivery failed (${level})" >&2
  fi
}

RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$LOG_DIR/hybrid-refresh-$RUN_ID.log"
RUN_STATE="$STATE_DIR/last-run.json"
SUCCESS_STATE="$STATE_DIR/last-success.json"

CMD=(node scripts/agent-registry/refresh-hybrid-registry.mjs)
if [[ -n "$API_BASE" ]]; then
  CMD+=(--api-base "$API_BASE")
fi
if [[ -n "$IMPORT_TOKEN" ]]; then
  CMD+=(--token "$IMPORT_TOKEN")
fi
if [[ -n "$VERIFY_INQUIRY" ]]; then
  CMD+=(--inquiry "$VERIFY_INQUIRY")
fi
if is_true "$REINDEX_ALL"; then
  CMD+=(--reindex-all)
fi
if is_true "$SKIP_BUILD"; then
  CMD+=(--skip-build)
fi
if is_true "$SKIP_SCREEN"; then
  CMD+=(--skip-screen)
fi

if is_true "$DRY_RUN"; then
  printf 'state_dir=%s\n' "$STATE_DIR"
  printf 'run_log=%s\n' "$RUN_LOG"
  printf 'command='
  printf '%q ' "${CMD[@]}"
  printf '\n'
  exit 0
fi

STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
set +e
OUTPUT="$("${CMD[@]}" 2>&1)"
EXIT_CODE=$?
set -e
FINISHED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

printf '%s\n' "$OUTPUT" > "$RUN_LOG"

TAIL_OUTPUT="$(printf '%s\n' "$OUTPUT" | tail -c 4000)"

jq -n \
  --arg run_id "$RUN_ID" \
  --arg started_at "$STARTED_AT" \
  --arg finished_at "$FINISHED_AT" \
  --arg run_log "$RUN_LOG" \
  --arg tail "$TAIL_OUTPUT" \
  --argjson exit_code "$EXIT_CODE" \
  --arg api_base "$API_BASE" \
  --argjson reindex_all "$(is_true "$REINDEX_ALL" && echo true || echo false)" \
  --argjson skip_build "$(is_true "$SKIP_BUILD" && echo true || echo false)" \
  --argjson skip_screen "$(is_true "$SKIP_SCREEN" && echo true || echo false)" \
  '{
    runId: $run_id,
    startedAt: $started_at,
    finishedAt: $finished_at,
    exitCode: $exit_code,
    ok: ($exit_code == 0),
    runLog: $run_log,
    apiBase: (if $api_base == "" then null else $api_base end),
    flags: {
      reindexAll: $reindex_all,
      skipBuild: $skip_build,
      skipScreen: $skip_screen
    },
    outputTail: $tail
  }' > "$RUN_STATE"

if [[ "$EXIT_CODE" -eq 0 ]]; then
  cp "$RUN_STATE" "$SUCCESS_STATE"
  if is_true "$ALERT_ON_SUCCESS"; then
    send_webhook_alert \
      "info" \
      "TNF Hybrid Registry Refresh Succeeded" \
      "Run ${RUN_ID} completed successfully." \
      "$RUN_LOG" \
      "$RUN_ID"
  fi
else
  send_webhook_alert \
    "error" \
    "TNF Hybrid Registry Refresh Failed" \
    "Run ${RUN_ID} failed with exit code ${EXIT_CODE}. See log tail in payload and run log path." \
    "$RUN_LOG" \
    "$RUN_ID"
fi

echo "run_id=$RUN_ID exit_code=$EXIT_CODE log=$RUN_LOG"
echo "$TAIL_OUTPUT"
exit "$EXIT_CODE"
