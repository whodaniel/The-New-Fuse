#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NODE_BIN="${TNF_AGENT_POLL_NODE_BIN:-$(command -v node)}"
SCHEDULE_DEFAULT="${TNF_AGENT_POLL_CRON_SCHEDULE:-* * * * *}"
BASE_BACKOFF_DEFAULT="${TNF_AGENT_POLL_BASE_BACKOFF_SEC:-30}"
MAX_BACKOFF_DEFAULT="${TNF_AGENT_POLL_MAX_BACKOFF_SEC:-1800}"
JITTER_DEFAULT="${TNF_AGENT_POLL_JITTER_SEC:-5}"
LOCK_STALE_DEFAULT="${TNF_AGENT_POLL_LOCK_STALE_SEC:-300}"
TIMEOUT_DEFAULT="${TNF_AGENT_POLL_TIMEOUT_SEC:-900}"

usage() {
  cat <<'USAGE'
Usage:
  scripts/runtime/agent-poll-cron.sh install --job <name> --command "<shell command>" [options]
  scripts/runtime/agent-poll-cron.sh uninstall --job <name>
  scripts/runtime/agent-poll-cron.sh status [--job <name>]

Options:
  --job <name>                Job id used for state/cron tag
  --command "<cmd>"           Shell command executed by the poll pulse
  --schedule "<cron expr>"    Cron schedule (default: "* * * * *")
  --base-backoff-sec <sec>    Base backoff on failures (default: 30)
  --max-backoff-sec <sec>     Max backoff cap (default: 1800)
  --jitter-sec <sec>          Random startup jitter (default: 5)
  --lock-stale-sec <sec>      Stale lock recovery threshold (default: 300)
  --timeout-sec <sec>         Command timeout (default: 900)
USAGE
}

sanitize_job() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9._-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//' | cut -c1-100
}

build_cron_line() {
  local schedule="$1"
  local job="$2"
  local command_b64="$3"
  local base_backoff="$4"
  local max_backoff="$5"
  local jitter="$6"
  local lock_stale="$7"
  local timeout="$8"
  local tag="# tnf-agent-poll:${job}"
  local log_file="$HOME/.tnf/poll-jobs/${job}/cron.log"
  mkdir -p "$(dirname "$log_file")"

  printf '%s cd "%s" && PATH="%s:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" "%s" "%s/scripts/runtime/agent-poll-pulse.cjs" --job "%s" --command-b64 "%s" --base-backoff-sec "%s" --max-backoff-sec "%s" --jitter-sec "%s" --lock-stale-sec "%s" --timeout-sec "%s" >> "%s" 2>&1 %s\n' \
    "$schedule" \
    "$ROOT_DIR" \
    "$(dirname "$NODE_BIN")" \
    "$NODE_BIN" \
    "$ROOT_DIR" \
    "$job" \
    "$command_b64" \
    "$base_backoff" \
    "$max_backoff" \
    "$jitter" \
    "$lock_stale" \
    "$timeout" \
    "$log_file" \
    "$tag"
}

ACTION="${1:-}"
shift || true

if [[ "${ACTION}" == "--help" || "${ACTION}" == "-h" ]]; then
  usage
  exit 0
fi

JOB=""
COMMAND=""
SCHEDULE="$SCHEDULE_DEFAULT"
BASE_BACKOFF="$BASE_BACKOFF_DEFAULT"
MAX_BACKOFF="$MAX_BACKOFF_DEFAULT"
JITTER="$JITTER_DEFAULT"
LOCK_STALE="$LOCK_STALE_DEFAULT"
TIMEOUT="$TIMEOUT_DEFAULT"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --job)
      JOB="${2:-}"
      shift 2
      ;;
    --command)
      COMMAND="${2:-}"
      shift 2
      ;;
    --schedule)
      SCHEDULE="${2:-}"
      shift 2
      ;;
    --base-backoff-sec)
      BASE_BACKOFF="${2:-}"
      shift 2
      ;;
    --max-backoff-sec)
      MAX_BACKOFF="${2:-}"
      shift 2
      ;;
    --jitter-sec)
      JITTER="${2:-}"
      shift 2
      ;;
    --lock-stale-sec)
      LOCK_STALE="${2:-}"
      shift 2
      ;;
    --timeout-sec)
      TIMEOUT="${2:-}"
      shift 2
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

if [[ -z "${ACTION}" ]]; then
  usage
  exit 1
fi

case "${ACTION}" in
  install)
    if [[ -z "${JOB}" || -z "${COMMAND}" ]]; then
      echo "install requires --job and --command" >&2
      exit 1
    fi

    SAFE_JOB="$(sanitize_job "$JOB")"
    if [[ -z "${SAFE_JOB}" ]]; then
      echo "Invalid --job value." >&2
      exit 1
    fi

    COMMAND_B64="$(printf '%s' "$COMMAND" | base64)"
    TAG="tnf-agent-poll:${SAFE_JOB}"
    TMP_CRON="$(mktemp)"
    crontab -l 2>/dev/null | grep -v "$TAG" >"$TMP_CRON" || true
    build_cron_line "$SCHEDULE" "$SAFE_JOB" "$COMMAND_B64" "$BASE_BACKOFF" "$MAX_BACKOFF" "$JITTER" "$LOCK_STALE" "$TIMEOUT" >>"$TMP_CRON"
    crontab "$TMP_CRON"
    rm -f "$TMP_CRON"
    echo "Installed cron job: ${SAFE_JOB}"
    echo "Schedule: ${SCHEDULE}"
    ;;
  uninstall|remove)
    if [[ -z "${JOB}" ]]; then
      echo "uninstall requires --job" >&2
      exit 1
    fi
    SAFE_JOB="$(sanitize_job "$JOB")"
    TAG="tnf-agent-poll:${SAFE_JOB}"
    TMP_CRON="$(mktemp)"
    crontab -l 2>/dev/null | grep -v "$TAG" >"$TMP_CRON" || true
    crontab "$TMP_CRON"
    rm -f "$TMP_CRON"
    echo "Removed cron job: ${SAFE_JOB}"
    ;;
  status)
    if [[ -n "${JOB}" ]]; then
      SAFE_JOB="$(sanitize_job "$JOB")"
      crontab -l 2>/dev/null | grep "tnf-agent-poll:${SAFE_JOB}" || true
    else
      crontab -l 2>/dev/null | grep "tnf-agent-poll:" || true
    fi
    ;;
  *)
    usage
    exit 1
    ;;
esac
