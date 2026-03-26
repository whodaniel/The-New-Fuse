#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
POLL_CRON_SCRIPT="$ROOT_DIR/scripts/runtime/agent-poll-cron.sh"
RUNNER_SCRIPT="$ROOT_DIR/scripts/agent-registry/hybrid-refresh-run.sh"

ACTION="${1:-}"
shift || true

JOB="${AGENT_REGISTRY_HYBRID_JOB:-agent-registry-hybrid-refresh}"
SCHEDULE="${AGENT_REGISTRY_HYBRID_CRON_SCHEDULE:-17 */4 * * *}"
BASE_BACKOFF_SEC="${AGENT_REGISTRY_HYBRID_BASE_BACKOFF_SEC:-300}"
MAX_BACKOFF_SEC="${AGENT_REGISTRY_HYBRID_MAX_BACKOFF_SEC:-14400}"
JITTER_SEC="${AGENT_REGISTRY_HYBRID_JITTER_SEC:-15}"
LOCK_STALE_SEC="${AGENT_REGISTRY_HYBRID_LOCK_STALE_SEC:-21600}"
TIMEOUT_SEC="${AGENT_REGISTRY_HYBRID_TIMEOUT_SEC:-5400}"

API_BASE="${AGENT_REGISTRY_API_BASE:-}"
IMPORT_TOKEN="${AGENT_REGISTRY_IMPORT_TOKEN:-}"
REINDEX_ALL="${AGENT_REGISTRY_HYBRID_REINDEX_ALL:-false}"
SKIP_BUILD="${AGENT_REGISTRY_HYBRID_SKIP_BUILD:-false}"
SKIP_SCREEN="${AGENT_REGISTRY_HYBRID_SKIP_SCREEN:-false}"
VERIFY_INQUIRY="${AGENT_REGISTRY_HYBRID_VERIFY_INQUIRY:-}"
ALERT_WEBHOOK_URL="${AGENT_REGISTRY_ALERT_WEBHOOK_URL:-}"
ALERT_COOLDOWN_SEC="${AGENT_REGISTRY_ALERT_COOLDOWN_SEC:-1800}"
ALERT_ON_SUCCESS="${AGENT_REGISTRY_ALERT_ON_SUCCESS:-false}"
REFRESH_STATE_DIR="${AGENT_REGISTRY_REFRESH_STATE_DIR:-$HOME/.tnf/agent-registry-hybrid-refresh}"
DRY_RUN=false

usage() {
  cat <<'EOF'
Usage:
  scripts/agent-registry/hybrid-refresh-cron.sh install [options]
  scripts/agent-registry/hybrid-refresh-cron.sh uninstall [options]
  scripts/agent-registry/hybrid-refresh-cron.sh status [options]
  scripts/agent-registry/hybrid-refresh-cron.sh run-now [options]
  scripts/agent-registry/hybrid-refresh-cron.sh print-command [options]

Options:
  --job <name>                 Cron job id (default: agent-registry-hybrid-refresh)
  --schedule "<cron expr>"     Cron schedule (default: "17 */4 * * *")
  --api-base <url>             AGENT_REGISTRY_API_BASE
  --token <token>              AGENT_REGISTRY_IMPORT_TOKEN
  --reindex-all                Enable AGENT_REGISTRY_HYBRID_REINDEX_ALL=true
  --skip-build                 Enable AGENT_REGISTRY_HYBRID_SKIP_BUILD=true
  --skip-screen                Enable AGENT_REGISTRY_HYBRID_SKIP_SCREEN=true
  --inquiry "<text>"           AGENT_REGISTRY_HYBRID_VERIFY_INQUIRY
  --alert-webhook <url>        AGENT_REGISTRY_ALERT_WEBHOOK_URL
  --alert-cooldown-sec <sec>   AGENT_REGISTRY_ALERT_COOLDOWN_SEC (default: 1800)
  --alert-on-success           AGENT_REGISTRY_ALERT_ON_SUCCESS=true
  --dry-run                    Print actions without writing cron
  --help, -h                   Show this help

Environment defaults are supported for all options above.
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
    --job)
      JOB="${2:-}"
      shift 2
      ;;
    --schedule)
      SCHEDULE="${2:-}"
      shift 2
      ;;
    --api-base)
      API_BASE="${2:-}"
      shift 2
      ;;
    --token)
      IMPORT_TOKEN="${2:-}"
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
    --inquiry)
      VERIFY_INQUIRY="${2:-}"
      shift 2
      ;;
    --alert-webhook)
      ALERT_WEBHOOK_URL="${2:-}"
      shift 2
      ;;
    --alert-cooldown-sec)
      ALERT_COOLDOWN_SEC="${2:-}"
      shift 2
      ;;
    --alert-on-success)
      ALERT_ON_SUCCESS=true
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

if [[ -z "$ACTION" || "$ACTION" == "--help" || "$ACTION" == "-h" ]]; then
  usage
  exit 0
fi

if [[ ! -x "$POLL_CRON_SCRIPT" ]]; then
  echo "Missing poll cron script: $POLL_CRON_SCRIPT" >&2
  exit 1
fi

if [[ ! -x "$RUNNER_SCRIPT" ]]; then
  echo "Missing runner script: $RUNNER_SCRIPT" >&2
  exit 1
fi

if ! [[ "$ALERT_COOLDOWN_SEC" =~ ^[0-9]+$ ]]; then
  echo "--alert-cooldown-sec must be an integer >= 0" >&2
  exit 1
fi

build_env_pairs() {
  local pairs=()
  if [[ -n "$API_BASE" ]]; then
    pairs+=("AGENT_REGISTRY_API_BASE=$API_BASE")
  fi
  if [[ -n "$IMPORT_TOKEN" ]]; then
    pairs+=("AGENT_REGISTRY_IMPORT_TOKEN=$IMPORT_TOKEN")
  fi
  if [[ -n "$VERIFY_INQUIRY" ]]; then
    pairs+=("AGENT_REGISTRY_HYBRID_VERIFY_INQUIRY=$VERIFY_INQUIRY")
  fi
  if [[ -n "$ALERT_WEBHOOK_URL" ]]; then
    pairs+=("AGENT_REGISTRY_ALERT_WEBHOOK_URL=$ALERT_WEBHOOK_URL")
  fi
  pairs+=("AGENT_REGISTRY_HYBRID_REINDEX_ALL=$REINDEX_ALL")
  pairs+=("AGENT_REGISTRY_HYBRID_SKIP_BUILD=$SKIP_BUILD")
  pairs+=("AGENT_REGISTRY_HYBRID_SKIP_SCREEN=$SKIP_SCREEN")
  pairs+=("AGENT_REGISTRY_ALERT_COOLDOWN_SEC=$ALERT_COOLDOWN_SEC")
  pairs+=("AGENT_REGISTRY_ALERT_ON_SUCCESS=$ALERT_ON_SUCCESS")
  pairs+=("AGENT_REGISTRY_REFRESH_STATE_DIR=$REFRESH_STATE_DIR")
  printf '%s\n' "${pairs[@]}"
}

build_install_command_string() {
  local cmd_parts=()
  while IFS= read -r pair; do
    [[ -z "$pair" ]] && continue
    local key="${pair%%=*}"
    local val="${pair#*=}"
    local escaped_val
    printf -v escaped_val '%q' "$val"
    cmd_parts+=("${key}=${escaped_val}")
  done < <(build_env_pairs)

  local runner_escaped
  printf -v runner_escaped '%q' "$RUNNER_SCRIPT"
  local joined="${cmd_parts[*]}"
  if [[ -n "$joined" ]]; then
    echo "${joined} bash ${runner_escaped}"
  else
    echo "bash ${runner_escaped}"
  fi
}

status_details() {
  local poll_state_root="${TNF_POLL_STATE_ROOT:-$HOME/.tnf/poll-jobs}"
  local poll_state_dir="$poll_state_root/$JOB"

  echo "poll_state_dir=$poll_state_dir"
  if [[ -f "$poll_state_dir/state.json" ]]; then
    echo "poll_state:"
    cat "$poll_state_dir/state.json"
  else
    echo "poll_state: missing"
  fi
  if [[ -f "$poll_state_dir/heartbeat.json" ]]; then
    echo "poll_heartbeat:"
    cat "$poll_state_dir/heartbeat.json"
  else
    echo "poll_heartbeat: missing"
  fi

  echo "refresh_state_dir=$REFRESH_STATE_DIR"
  if [[ -f "$REFRESH_STATE_DIR/last-run.json" ]]; then
    echo "last_run:"
    cat "$REFRESH_STATE_DIR/last-run.json"
  else
    echo "last_run: missing"
  fi
}

case "$ACTION" in
  install)
    INSTALL_COMMAND="$(build_install_command_string)"
    if is_true "$DRY_RUN"; then
      echo "dry-run install"
      echo "job=$JOB"
      echo "schedule=$SCHEDULE"
      echo "command=$INSTALL_COMMAND"
      exit 0
    fi
    bash "$POLL_CRON_SCRIPT" install \
      --job "$JOB" \
      --command "$INSTALL_COMMAND" \
      --schedule "$SCHEDULE" \
      --base-backoff-sec "$BASE_BACKOFF_SEC" \
      --max-backoff-sec "$MAX_BACKOFF_SEC" \
      --jitter-sec "$JITTER_SEC" \
      --lock-stale-sec "$LOCK_STALE_SEC" \
      --timeout-sec "$TIMEOUT_SEC"
    echo "Installed hybrid refresh cron job."
    bash "$POLL_CRON_SCRIPT" status --job "$JOB" || true
    ;;
  uninstall|remove)
    if is_true "$DRY_RUN"; then
      echo "dry-run uninstall job=$JOB"
      exit 0
    fi
    bash "$POLL_CRON_SCRIPT" uninstall --job "$JOB"
    echo "Uninstalled hybrid refresh cron job."
    ;;
  status)
    bash "$POLL_CRON_SCRIPT" status --job "$JOB" || true
    status_details
    ;;
  print-command)
    build_install_command_string
    ;;
  run-now)
    if is_true "$DRY_RUN"; then
      echo "dry-run run-now"
      build_install_command_string
      exit 0
    fi
    env_args=()
    while IFS= read -r pair; do
      [[ -z "$pair" ]] && continue
      env_args+=("$pair")
    done < <(build_env_pairs)
    env "${env_args[@]}" bash "$RUNNER_SCRIPT"
    ;;
  *)
    usage
    exit 1
    ;;
esac
