#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LABEL="com.tnf.local-subdirector"
PLIST_PATH="$HOME/Library/LaunchAgents/${LABEL}.plist"
LAUNCH_DOMAIN="gui/$(id -u)"
NODE_BIN="${TNF_LOCAL_SUBDIRECTOR_NODE_BIN:-$(command -v node)}"
SCRIPT_PATH="$HOME/.tnf/local-subdirector/bin/local-subdirector-runtime.cjs"
CANONICAL_SCRIPT="${ROOT_DIR}/scripts/runtime/local-subdirector-runtime.cjs"
WORK_DIR="$HOME/.tnf/local-subdirector"
LOG_DIR="$WORK_DIR/logs"
STATE_DIR="$WORK_DIR/state"
LIB_DIR="$WORK_DIR/lib"
IDENTITY_ENV="$WORK_DIR/identity.env"
INTERACTIVE_SAFE_MODE="${TNF_INTERACTIVE_SAFE_MODE:-true}"
INTERACTIVE_SAFE_MODE_FILE="${TNF_INTERACTIVE_SAFE_MODE_FILE:-$HOME/.tnf/flags/interactive-safe-mode}"
RUNTIME_PATH="$(dirname "$NODE_BIN"):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

ensure_dirs() {
  mkdir -p "$LOG_DIR" "$STATE_DIR" "$LIB_DIR" "$(dirname "$SCRIPT_PATH")"
}

sync_runtime() {
  ensure_dirs
  if [[ -f "$CANONICAL_SCRIPT" ]]; then
    cp -f "$CANONICAL_SCRIPT" "$SCRIPT_PATH"
    chmod +x "$SCRIPT_PATH"
  fi
  local repo_lib="${ROOT_DIR}/scripts/lib"
  if [[ -d "$repo_lib" ]]; then
    for f in "$repo_lib"/*.cjs "$repo_lib"/*.js "$repo_lib"/*.sh; do
      [[ -e "$f" ]] || continue
      cp -f "$f" "$LIB_DIR/"
      mkdir -p "$HOME/.tnf/lib"
      cp -f "$f" "$HOME/.tnf/lib/"
    done
  fi
}

load_identity_value() {
  local key="$1"
  local fallback="${2:-}"
  if [[ -f "$IDENTITY_ENV" ]]; then
    local line
    line="$(grep -E "^${key}=" "$IDENTITY_ENV" | tail -1 || true)"
    if [[ -n "$line" ]]; then
      printf '%s' "${line#*=}"
      return 0
    fi
  fi
  printf '%s' "$fallback"
}

xml_escape() {
  # Bash-only: python3 startup was paging for seconds apiece at load 500+ /
  # ~4k free pages (2026-08-29) and doubled create_plist past establish's timeout.
  local s="$1"
  s="${s//&/&amp;}"
  s="${s//</&lt;}"
  s="${s//>/&gt;}"
  s="${s//\"/&quot;}"
  s="${s//\'/&apos;}"
  printf '%s' "$s"
}

fleet_paused() {
  local f="$HOME/.tnf/fleet/mode.json"
  [[ -f "$f" ]] && grep -Eq '"mode":[[:space:]]*"paused"' "$f"
}

# launchctl bootout can wait forever on a stuck descendant (`ps` / osascript).
# Bound every launchctl so establish's spawnSync timeout is never the first
# thing that notices. perl alarm is the portable macOS stand-in for timeout(1).
launchctl_bounded() {
  local secs="$1"
  shift
  if command -v perl >/dev/null 2>&1; then
    perl -e 'alarm shift @ARGV; exec @ARGV' "$secs" "$@"
  else
    "$@"
  fi
}

job_state_running() {
  launchctl_bounded 8 launchctl print "${LAUNCH_DOMAIN}/${LABEL}" 2>/dev/null | grep -q 'state = running'
}

job_loaded() {
  launchctl_bounded 8 launchctl print "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1
}

create_plist() {
  local nft_id wallet signing_pem encryption_pem actor_id
  nft_id="$(load_identity_value LOCAL_SUBDIRECTOR_NFT_ID "${LOCAL_SUBDIRECTOR_NFT_ID:-unregistered}")"
  wallet="$(load_identity_value LOCAL_SUBDIRECTOR_WALLET_ADDRESS "${LOCAL_SUBDIRECTOR_WALLET_ADDRESS:-0x0000000000000000000000000000000000000000}")"
  signing_pem="$(load_identity_value LOCAL_SUBDIRECTOR_SIGNING_KEY_PEM "${LOCAL_SUBDIRECTOR_SIGNING_KEY_PEM:-}")"
  encryption_pem="$(load_identity_value LOCAL_SUBDIRECTOR_ENCRYPTION_KEY_PEM "${LOCAL_SUBDIRECTOR_ENCRYPTION_KEY_PEM:-}")"
  actor_id="$(load_identity_value LOCAL_SUBDIRECTOR_ACTOR_ID "${LOCAL_SUBDIRECTOR_ACTOR_ID:-tnf-local-subdirector}")"

  # Signing PEMs may contain newlines — store path references instead when long.
  local signing_key_file="$WORK_DIR/signing.pkcs8.pem"
  local encryption_key_file="$WORK_DIR/encryption.pkcs8.pem"
  if [[ -n "$signing_pem" && ${#signing_pem} -gt 80 ]]; then
    printf '%s\n' "$signing_pem" | sed 's/\\n/\n/g' > "$signing_key_file"
    chmod 600 "$signing_key_file"
    signing_pem=""
  fi
  if [[ -n "$encryption_pem" && ${#encryption_pem} -gt 80 ]]; then
    printf '%s\n' "$encryption_pem" | sed 's/\\n/\n/g' > "$encryption_key_file"
    chmod 600 "$encryption_key_file"
    encryption_pem=""
  fi

  # Write-then-rename, not a direct `>` truncate: 2026-08-27, a hang mid-
  # heredoc (system under extreme load from an unrelated concurrent branch
  # switch) left this file 0 bytes / unparseable because `>` truncates the
  # target before any content is written. Renaming into place means a hung
  # regeneration leaves the previous, still-valid plist intact instead of an
  # empty one. Matches the atomic-write pattern in tnf-fleet-mode.cjs.
  local plist_tmp="${PLIST_PATH}.tmp.$$"
  cat > "$plist_tmp" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <!-- 2026-08-27: routed through tnf-launchd-guard.sh (class=probe) — see
       docs/protocols/TNF_RESOURCE_GOVERNANCE_MANDATE.md. This template is
       regenerated unconditionally on every `start` (see start()), which is
       exactly why a manual, unwrapped edit to the live plist kept getting
       silently reverted: fix it here, at the source of truth, not on the
       live file. -->
  <key>ProgramArguments</key>
  <array>
    <string>${ROOT_DIR}/scripts/runtime/tnf-launchd-guard.sh</string>
    <string>--job</string>
    <string>${LABEL}</string>
    <string>--class</string>
    <string>probe</string>
    <string>--repo-root</string>
    <string>${ROOT_DIR}</string>
    <string>--</string>
    <string>${NODE_BIN}</string>
    <string>${SCRIPT_PATH}</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>$(xml_escape "$RUNTIME_PATH")</string>
    <key>LOCAL_SUBDIRECTOR_STATE_DIR</key>
    <string>${STATE_DIR}</string>
    <key>LOCAL_SUBDIRECTOR_ACTOR_ID</key>
    <string>$(xml_escape "$actor_id")</string>
    <key>LOCAL_SUBDIRECTOR_NFT_ID</key>
    <string>$(xml_escape "$nft_id")</string>
    <key>LOCAL_SUBDIRECTOR_WALLET_ADDRESS</key>
    <string>$(xml_escape "$wallet")</string>
    <key>LOCAL_SUBDIRECTOR_SIGNING_KEY_FILE</key>
    <string>$(xml_escape "$signing_key_file")</string>
    <key>LOCAL_SUBDIRECTOR_ENCRYPTION_KEY_FILE</key>
    <string>$(xml_escape "$encryption_key_file")</string>
    <key>TNF_INTERACTIVE_SAFE_MODE</key>
    <string>${INTERACTIVE_SAFE_MODE}</string>
    <key>TNF_INTERACTIVE_SAFE_MODE_FILE</key>
    <string>${INTERACTIVE_SAFE_MODE_FILE}</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>StartInterval</key>
  <integer>300</integer>
  <key>Nice</key>
  <integer>10</integer>
  <key>ProcessType</key>
  <string>Background</string>
  <key>WorkingDirectory</key>
  <string>${WORK_DIR}</string>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/stderr.log</string>
</dict>
</plist>
PLIST
  mv -f "$plist_tmp" "$PLIST_PATH"
}

install() {
  sync_runtime
  create_plist
  if job_state_running; then
    echo "installed: $LABEL"
    return 0
  fi
  if fleet_paused; then
    echo "installed: $LABEL (start deferred: fleet paused)"
    return 0
  fi
  start || true
  echo "installed: $LABEL"
}

start() {
  # Fast path: do not sync or bootout a healthy running job. bootout was the
  # 2026-08-29 establish hang (120s spawnSync timeout → status null).
  if job_state_running; then
    echo "already-running: $LABEL"
    return 0
  fi
  if job_loaded; then
    launchctl_bounded 10 launchctl kickstart "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || true
    echo "started: $LABEL"
    return 0
  fi
  sync_runtime
  create_plist
  launchctl_bounded 15 launchctl bootout "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || true
  if ! launchctl_bounded 15 launchctl bootstrap "$LAUNCH_DOMAIN" "$PLIST_PATH" >/dev/null 2>&1; then
    launchctl_bounded 10 launchctl load -w "$PLIST_PATH" >/dev/null 2>&1 || true
  fi
  launchctl_bounded 10 launchctl kickstart "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || true
  echo "started: $LABEL"
}

stop() {
  launchctl_bounded 15 launchctl bootout "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || launchctl unload "$PLIST_PATH" 2>/dev/null || true
  echo "stopped: $LABEL"
}

restart() {
  stop
  sleep 1
  start
}

uninstall() {
  stop
  rm -f "$PLIST_PATH"
  echo "removed: $LABEL"
}

status() {
  if job_state_running; then
    echo "running: $LABEL"
  elif job_loaded; then
    echo "loaded: $LABEL"
  else
    echo "not-running: $LABEL"
  fi
  [[ -f "$STATE_DIR/local-subdirector-heartbeat.json" ]] && stat -f '%Sm %N' "$STATE_DIR/local-subdirector-heartbeat.json"
}

case "${1:-}" in
  install) install ;;
  start) start ;;
  stop) stop ;;
  restart) restart ;;
  uninstall|remove) uninstall ;;
  status) status ;;
  *) echo "Usage: $0 <install|start|stop|restart|status|uninstall>"; exit 1 ;;
esac
