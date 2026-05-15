#!/bin/bash
set -euo pipefail

A_PROFILE="a"
B_PROFILE="b"
INTERVAL_SECONDS="120"
MODE="${VOICE_PROTOCOL_COOP_MODE:-silent}"
VOICE_AGENT_SEND_BIN="${VOICE_AGENT_SEND_BIN:-$(command -v voice-agent-send || true)}"

usage() {
  cat <<USAGE
Usage: voice-protocol-coop-loop.sh [--a-profile <name>] [--b-profile <name>] [--interval-seconds <n>] [--mode silent|spoken]
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --a-profile)
      A_PROFILE="${2:-}"
      shift 2
      ;;
    --b-profile)
      B_PROFILE="${2:-}"
      shift 2
      ;;
    --interval-seconds)
      INTERVAL_SECONDS="${2:-}"
      shift 2
      ;;
    --mode)
      MODE="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if ! [[ "$INTERVAL_SECONDS" =~ ^[0-9]+$ ]] || [[ "$INTERVAL_SECONDS" -lt 10 ]]; then
  echo "interval-seconds must be an integer >= 10" >&2
  exit 1
fi

MODE="$(printf '%s' "$MODE" | tr '[:upper:]' '[:lower:]')"
case "$MODE" in
  silent|spoken)
    ;;
  *)
    echo "mode must be one of: silent, spoken" >&2
    exit 1
    ;;
esac

if [[ "$MODE" == "spoken" && -z "$VOICE_AGENT_SEND_BIN" ]]; then
  echo "voice-agent-send not found and mode=spoken. Set VOICE_AGENT_SEND_BIN or switch to silent mode." >&2
  exit 1
fi

LOCK_FILE="/tmp/voice_protocol_coop_loop.pid"
if [[ -f "$LOCK_FILE" ]]; then
  EXISTING_PID="$(cat "$LOCK_FILE" 2>/dev/null || true)"
  if [[ -n "$EXISTING_PID" ]] && kill -0 "$EXISTING_PID" >/dev/null 2>&1; then
    echo "voice-protocol-coop-loop already running (pid ${EXISTING_PID})" >&2
    exit 0
  fi
fi
echo "$$" > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

COUNT=0
echo "voice-protocol-coop-loop: start a=${A_PROFILE} b=${B_PROFILE} interval=${INTERVAL_SECONDS}s mode=${MODE}"

while true; do
  COUNT=$((COUNT + 1))
  TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  PID_A="$(pgrep -f "voice_server.py.*--profile[ =]${A_PROFILE}" | head -n1 || true)"
  PID_B="$(pgrep -f "voice_server.py.*--profile[ =]${B_PROFILE}" | head -n1 || true)"
  WATCH_A="$(pgrep -f "stream_watch.py.*--profile[ =]${A_PROFILE}" | head -n1 || true)"
  WATCH_B="$(pgrep -f "stream_watch.py.*--profile[ =]${B_PROFILE}" | head -n1 || true)"

  echo "HB ${TS} cycle=${COUNT} a_server=${PID_A:-down} b_server=${PID_B:-down} a_watch=${WATCH_A:-down} b_watch=${WATCH_B:-down}"

  if [[ "$MODE" == "spoken" ]]; then
    MSG_A="Samantha, George cycle ${COUNT} at ${TS}. Continue concise voice-protocol tuning and confirm interrupt readiness."
    MSG_B="George, Samantha cycle ${COUNT} at ${TS}. Audio lane clear; continuing concise protocol tuning."

    VOICE_AGENT_SEND_FROM_IDENTITY=George "$VOICE_AGENT_SEND_BIN" \
      --from "$A_PROFILE" --to "$B_PROFILE" --text "$MSG_A" >/dev/null 2>&1 || true

    sleep 2

    VOICE_AGENT_SEND_FROM_IDENTITY=Samantha "$VOICE_AGENT_SEND_BIN" \
      --from "$B_PROFILE" --to "$A_PROFILE" --text "$MSG_B" >/dev/null 2>&1 || true
  fi

  sleep "$INTERVAL_SECONDS"
done
