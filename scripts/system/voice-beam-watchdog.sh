#!/bin/bash
# Keep the TNF voice beam stack alive (server :50005 + listen + stream_watch + reply audio).
set -u

_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=voicebridge-paths.sh
source "$_SCRIPT_DIR/voicebridge-paths.sh" 2>/dev/null || true

PROFILE="${VOICEBRIDGE_PROFILE:-main}"
PORT="${VOICEBRIDGE_PORT:-50005}"
ROOT="${VOICEBRIDGE_PROJECT_ROOT:-}"
if [[ -z "$ROOT" && -n "${VOICEBRIDGE_STATE_DIR:-}" ]]; then
  ROOT="$(cd "$(dirname "$VOICEBRIDGE_STATE_DIR")" && pwd)"
fi
if [[ -z "$ROOT" ]]; then
  ROOT="$(cd "$_SCRIPT_DIR/../.." && pwd)"
fi
STATE_DIR="${VOICEBRIDGE_STATE_DIR:-$ROOT/.voicebridge}"
LOG="${VOICE_BEAM_WATCHDOG_LOG:-/tmp/voice_beam_watchdog.log}"
INTERVAL="${VOICE_BEAM_WATCHDOG_INTERVAL_SECONDS:-8}"
LISTEN_DEP_CHECK_COOLDOWN_SECONDS="${LISTEN_DEP_CHECK_COOLDOWN_SECONDS:-300}"
KWS_HEAL_COOLDOWN_SECONDS="${KWS_HEAL_COOLDOWN_SECONDS:-30}"

export VOICEBRIDGE_PROFILE="$PROFILE"
export VOICEBRIDGE_PROJECT_ROOT="$ROOT"
export VOICEBRIDGE_STATE_DIR="$STATE_DIR"
export VOICE_RESPONSE_AUDIO_DEFAULT_ON="${VOICE_RESPONSE_AUDIO_DEFAULT_ON:-0}"
export VOICE_RESPONSE_AUDIO_AUTO_HEAL="${VOICE_RESPONSE_AUDIO_AUTO_HEAL:-1}"
export VOICE_INKY_VOICE="${VOICE_INKY_VOICE:-Daniel}"
export VOICE_RESPONSE_AUDIO_VOICE="${VOICE_RESPONSE_AUDIO_VOICE:-$VOICE_INKY_VOICE}"
export VOICE_INKY_FRONT_DOOR_TTS="${VOICE_INKY_FRONT_DOOR_TTS:-1}"
export LISTEN_SILENCE_END_SECONDS="${LISTEN_SILENCE_END_SECONDS:-1.4}"
export VOICE_AGENT_IDLE_FLUSH_SECONDS="${VOICE_AGENT_IDLE_FLUSH_SECONDS:-8.0}"
export VOICE_KWS_ALWAYS_ON="${VOICE_KWS_ALWAYS_ON:-1}"

# Load local + cloud KWS ingest so healed voice_server keeps forwarding ON.
if command -v voicebridge_use_profile >/dev/null 2>&1; then
  voicebridge_use_profile "$PROFILE" 2>/dev/null || true
fi
if command -v voicebridge_load_env >/dev/null 2>&1; then
  voicebridge_load_env 2>/dev/null || true
fi
# Fallback: local KWS when no ingest URL is configured.
if [[ -z "${VOICE_KWS_INGEST_URL:-}" && "${VOICE_KWS_ALWAYS_ON}" == "1" ]]; then
  export VOICE_KWS_INGEST_URL="http://127.0.0.1:${TNF_KWS_PORT:-43110}/v1/ingest/text"
  export VOICE_KWS_FLUSH_URL="http://127.0.0.1:${TNF_KWS_PORT:-43110}/v1/ingest/flush"
fi

mkdir -p "$STATE_DIR"
# Beam is OFF by default. Do NOT create the response-audio enabled flag automatically.
# The operator activates the beam explicitly (e.g., via the browser /activate endpoint
# or by setting VOICE_RESPONSE_AUDIO_DEFAULT_ON=1), which creates the file then.

log() {
  echo "[$(date '+%H:%M:%S')] [beam-watchdog/$PROFILE] $*" | tee -a "$LOG"
}

compact_line() {
  printf '%s' "$*" | tr '\n' ' ' | sed -E 's/[[:space:]]+/ /g; s/^ //; s/ $//'
}

cooldown_allows() {
  local stamp_file="$1"
  local cooldown="$2"
  local now last
  now="$(date +%s)"
  last="$(cat "$stamp_file" 2>/dev/null || echo 0)"
  if [[ ! "$last" =~ ^[0-9]+$ ]]; then
    last=0
  fi
  if (( now - last >= cooldown )); then
    printf '%s\n' "$now" >"$stamp_file"
    return 0
  fi
  return 1
}

LOCK_DIR="$STATE_DIR/voice-beam-watchdog.${PROFILE}.lock"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  existing_pid="$(cat "$LOCK_DIR/pid" 2>/dev/null || true)"
  if [[ -n "$existing_pid" ]] && kill -0 "$existing_pid" 2>/dev/null; then
    log "already running as pid $existing_pid"
    exit 0
  fi
  rm -rf "$LOCK_DIR"
  if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    log "lock busy at $LOCK_DIR"
    exit 0
  fi
fi
echo "$$" >"$LOCK_DIR/pid"
trap 'rm -rf "$LOCK_DIR"' EXIT INT TERM

beam_up() {
  curl -fsS -m 1 "http://127.0.0.1:${PORT}/mic_state" >/dev/null 2>&1
}

ensure_server() {
  if beam_up; then
    return 0
  fi
  log "voice_server down — restarting on :${PORT}"
  # Clear stale listeners on the port if any
  if command -v lsof >/dev/null 2>&1; then
    for p in $(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null || true); do
      kill -TERM "$p" 2>/dev/null || true
    done
    sleep 0.5
  fi
  nohup python3 -u "$_SCRIPT_DIR/voice_server.py" --profile "$PROFILE" --port "$PORT" \
    >>/tmp/voice_server_boot.log 2>&1 &
  sleep 2
  if beam_up; then
    curl -fsS -m 3 -X POST "http://127.0.0.1:${PORT}/activate" >/dev/null 2>&1 || true
    log "voice_server back"
  else
    log "voice_server failed to come back"
  fi
}

ensure_pid_pattern() {
  local pat="$1"
  local start_cmd="$2"
  local label="$3"
  if pgrep -f "$pat" >/dev/null 2>&1; then
    return 0
  fi
  log "$label down — restarting"
  eval "$start_cmd"
}

ensure_listen() {
  local dep_output
  if pgrep -f "listen --profile ${PROFILE}" >/dev/null 2>&1; then
    return 0
  fi
  if ! dep_output="$(bash "$_SCRIPT_DIR/listen" --profile "$PROFILE" --check-deps 2>&1)"; then
    if cooldown_allows "$STATE_DIR/listen-deps.${PROFILE}.lastwarn" "$LISTEN_DEP_CHECK_COOLDOWN_SECONDS"; then
      log "listen unavailable — $(compact_line "$dep_output")"
    fi
    return 0
  fi
  log "listen down — restarting"
  nohup bash "$_SCRIPT_DIR/listen" --profile "$PROFILE" >>/tmp/listen_main.log 2>&1 &
}

ensure_kws() {
  [[ "${VOICE_KWS_ALWAYS_ON:-1}" == "1" ]] || return 0
  if curl -fsS -m 1 "http://127.0.0.1:${TNF_KWS_PORT:-43110}/healthz" >/dev/null 2>&1 \
    || curl -fsS -m 1 "http://127.0.0.1:${TNF_KWS_PORT:-43110}/v1/events/packages" >/dev/null 2>&1; then
    return 0
  fi
  if pgrep -f "tnf-voice-kws-boot.sh" >/dev/null 2>&1; then
    return 0
  fi
  if cooldown_allows "$STATE_DIR/kws-heal.${PROFILE}.laststart" "$KWS_HEAL_COOLDOWN_SECONDS"; then
    log "KWS down — healing via tnf-voice-kws-boot"
    nohup bash "$_SCRIPT_DIR/tnf-voice-kws-boot.sh" >>/tmp/tnf_voice_kws_boot.log 2>&1 &
  fi
}

log "started (interval=${INTERVAL}s) root=$ROOT state=$STATE_DIR port=$PORT"

while true; do
  ensure_server
  ensure_listen
  ensure_pid_pattern \
    "stream_watch.py" \
    "nohup python3 -u \"$_SCRIPT_DIR/stream_watch.py\" --profile \"$PROFILE\" >>/tmp/stream_watch.log 2>&1 &" \
    "stream_watch"
  if [[ -f "$STATE_DIR/voice_response_audio_enabled" ]]; then
    ensure_pid_pattern \
      "voice-response-audio-watch.py" \
      "nohup python3 -u \"$_SCRIPT_DIR/voice-response-audio-watch.py\" --profile \"$PROFILE\" >>/tmp/voice_response_audio.log 2>&1 &" \
      "response_audio"
  fi
  # Keep local KWS MVP alive (TNF always-on keyword spotting).
  ensure_kws
  sleep "$INTERVAL"
done
