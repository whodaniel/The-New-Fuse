#!/bin/bash
set -euo pipefail

_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=voicebridge-paths.sh
source "$_SCRIPT_DIR/voicebridge-paths.sh"
VOICEBRIDGE_STATE_DIR="${VOICEBRIDGE_STATE_DIR:-$HOME/.voicebridge}"
mkdir -p "$VOICEBRIDGE_STATE_DIR"
if command -v voicebridge_init_state >/dev/null 2>&1; then
  voicebridge_init_state
fi

DAEMON_SCRIPT="$TNF_VOICE_SYSTEM_DIR/voice-target-click-daemon.swift"
DAEMON_BIN="$TNF_VOICE_SYSTEM_DIR/voice-target-click-daemon"
CLICK_LOG="/tmp/voice_target_click.log"
WATCHDOG_LOG="/tmp/voice_anchor_watchdog.log"
POLL_SECONDS="${VOICE_ANCHOR_WATCHDOG_POLL_SECONDS:-3}"
BACKOFF_SECONDS=2

is_daemon_running() {
  pgrep -f "swift-frontend -frontend -interpret $DAEMON_SCRIPT" >/dev/null 2>&1 \
    || pgrep -f "$DAEMON_BIN$" >/dev/null 2>&1
}

daemon_command() {
  if [[ -x "$DAEMON_BIN" ]]; then
    printf '%s\n' "$DAEMON_BIN"
  else
    printf '%s\n' "swift $DAEMON_SCRIPT"
  fi
}

touch "$CLICK_LOG" "$WATCHDOG_LOG"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] voice-anchor-watchdog started" >> "$WATCHDOG_LOG"

while true; do
  if is_daemon_running; then
    BACKOFF_SECONDS=2
    sleep "$POLL_SECONDS"
    continue
  fi

  cmd="$(daemon_command)"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] daemon missing; starting anchor daemon: $cmd" >> "$WATCHDOG_LOG"
  # shellcheck disable=SC2086
  nohup $cmd >> "$CLICK_LOG" 2>&1 &
  CANDIDATE_PID=$!
  sleep 1

  if kill -0 "$CANDIDATE_PID" >/dev/null 2>&1; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] daemon started pid=$CANDIDATE_PID" >> "$WATCHDOG_LOG"
    BACKOFF_SECONDS=2
  else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] daemon failed to start; backing off ${BACKOFF_SECONDS}s" >> "$WATCHDOG_LOG"
    sleep "$BACKOFF_SECONDS"
    if (( BACKOFF_SECONDS < 30 )); then
      BACKOFF_SECONDS=$((BACKOFF_SECONDS * 2))
      if (( BACKOFF_SECONDS > 30 )); then
        BACKOFF_SECONDS=30
      fi
    fi
  fi
done
