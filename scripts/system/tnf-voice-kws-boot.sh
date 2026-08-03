#!/usr/bin/env bash
# tnf-voice-kws-boot.sh
# Voice Beam boot + local KWS for TNF boot / watchdog heal.
# By default, the beam is OFF (no auto-activation of audio response).
# Idempotent: safe to run repeatedly.
set -u

_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=voicebridge-paths.sh
source "$_SCRIPT_DIR/voicebridge-paths.sh" 2>/dev/null || true

PROFILE="${VOICEBRIDGE_PROFILE:-main}"
PORT="${VOICEBRIDGE_PORT:-50005}"
KWS_PORT="${TNF_KWS_PORT:-43110}"
ROOT="${VOICEBRIDGE_PROJECT_ROOT:-}"
if [[ -z "$ROOT" ]]; then
  ROOT="$(cd "$_SCRIPT_DIR/../.." && pwd)"
fi
STATE_DIR="${VOICEBRIDGE_STATE_DIR:-$ROOT/.voicebridge}"
LOG="${TNF_VOICE_KWS_BOOT_LOG:-/tmp/tnf_voice_kws_boot.log}"
KWS_DIR="$ROOT/apps/audio-trigger-kws-mvp"

export VOICEBRIDGE_PROFILE="$PROFILE"
export VOICEBRIDGE_PROJECT_ROOT="$ROOT"
export VOICEBRIDGE_STATE_DIR="$STATE_DIR"
export VOICE_RESPONSE_AUDIO_DEFAULT_ON="${VOICE_RESPONSE_AUDIO_DEFAULT_ON:-0}"
export VOICE_KWS_ALWAYS_ON="${VOICE_KWS_ALWAYS_ON:-0}"

mkdir -p "$STATE_DIR" "$(dirname "$LOG")"
# Beam OFF by default. The enabled file is created only when the operator
# explicitly enables it (via /activate with RESPONSE_AUDIO_DEFAULT_ON=1 or
# via voice-response-audio-toggle).

log() {
  echo "[$(date '+%H:%M:%S')] [voice-kws-boot/$PROFILE] $*" | tee -a "$LOG"
}

kws_up() {
  curl -fsS -m 1 "http://127.0.0.1:${KWS_PORT}/healthz" >/dev/null 2>&1 \
    || curl -fsS -m 1 "http://127.0.0.1:${KWS_PORT}/health" >/dev/null 2>&1 \
    || curl -fsS -m 1 "http://127.0.0.1:${KWS_PORT}/v1/events/packages" >/dev/null 2>&1
}

beam_up() {
  curl -fsS -m 1 "http://127.0.0.1:${PORT}/mic_state" >/dev/null 2>&1
}

ensure_kws() {
  if [[ "${VOICE_KWS_ALWAYS_ON}" != "1" ]]; then
    log "KWS always-on disabled (VOICE_KWS_ALWAYS_ON=0)"
    return 0
  fi
  if kws_up; then
    log "KWS already up on :${KWS_PORT}"
    return 0
  fi
  if [[ ! -d "$KWS_DIR" ]]; then
    log "KWS app missing at $KWS_DIR — skip"
    return 0
  fi
  log "starting local KWS on :${KWS_PORT}"
  (
    cd "$KWS_DIR"
    # Start the server process directly so it survives after boot returns.
    nohup env \
      APP_PORT="$KWS_PORT" \
      PORT="$KWS_PORT" \
      REQUIRE_INGEST_AUTH="${REQUIRE_INGEST_AUTH:-false}" \
      MINI_OMNI_ENABLED="${MINI_OMNI_ENABLED:-false}" \
      pnpm exec tsx src/server.ts \
      >>/tmp/tnf_kws_mvp.log 2>&1 &
    echo $! >/tmp/tnf_kws_mvp.pid
  )
  for _ in 1 2 3 4 5 6 7 8; do
    sleep 1
    if kws_up; then
      log "KWS up on :${KWS_PORT}"
      return 0
    fi
  done
  log "KWS did not become healthy yet (see /tmp/tnf_kws_mvp.log)"
  return 0
}

ensure_beam_watchdog() {
  if pgrep -f 'voice-beam-watchdog.sh' >/dev/null 2>&1; then
    log "beam watchdog already running"
  else
    log "starting beam watchdog"
    nohup bash "$_SCRIPT_DIR/voice-beam-watchdog.sh" >>/tmp/voice_beam_watchdog.log 2>&1 &
    sleep 1
  fi
  # Immediate heal pass if server is down.
  if ! beam_up; then
    log "beam down — kicking server/listen via watchdog heal"
    nohup bash "$_SCRIPT_DIR/voice-beam-watchdog.sh" >>/tmp/voice_beam_watchdog.log 2>&1 &
    sleep 3
  fi
  if beam_up; then
    curl -fsS -m 3 -X POST "http://127.0.0.1:${PORT}/activate" >/dev/null 2>&1 || true
    log "voice beam active on :${PORT}"
  else
    log "voice beam not reachable yet on :${PORT}"
  fi
}

# Prefer local KWS ingest when local service is up and cloud URL is unset.
wire_local_kws_env() {
  local env_file="$STATE_DIR/voice_bridge_local.env"
  if kws_up; then
    if [[ -z "${VOICE_KWS_INGEST_URL:-}" ]]; then
      export VOICE_KWS_INGEST_URL="http://127.0.0.1:${KWS_PORT}/v1/ingest/text"
      export VOICE_KWS_FLUSH_URL="http://127.0.0.1:${KWS_PORT}/v1/ingest/flush"
      {
        echo "# auto-written by tnf-voice-kws-boot.sh $(date -u +%Y-%m-%dT%H:%M:%SZ)"
        echo "VOICE_KWS_INGEST_URL=$VOICE_KWS_INGEST_URL"
        echo "VOICE_KWS_FLUSH_URL=$VOICE_KWS_FLUSH_URL"
      } >"$env_file.tmp"
      # Preserve existing keys if present.
      if [[ -f "$env_file" ]]; then
        grep -vE '^(VOICE_KWS_INGEST_URL|VOICE_KWS_FLUSH_URL)=' "$env_file" >>"$env_file.tmp" || true
      fi
      mv "$env_file.tmp" "$env_file"
      log "wired local KWS ingest → $VOICE_KWS_INGEST_URL"
    fi
  fi
}

log "boot start root=$ROOT"
ensure_kws
wire_local_kws_env
ensure_beam_watchdog
log "boot done (KWS always-on + voice beam)"
exit 0
