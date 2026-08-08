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
  python3 -c 'import sys,html; print(html.escape(sys.stdin.read(), quote=True), end="")' <<<"$1"
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

  cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
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
  <key>KeepAlive</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>10</integer>
  <key>WorkingDirectory</key>
  <string>${WORK_DIR}</string>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/stderr.log</string>
</dict>
</plist>
PLIST
}

install() {
  sync_runtime
  create_plist
  start
  echo "installed: $LABEL"
}

start() {
  sync_runtime
  create_plist
  if launchctl print "${LAUNCH_DOMAIN}/${LABEL}" 2>/dev/null | grep -q 'state = running'; then
    echo "already-running: $LABEL"
    return 0
  fi
  launchctl bootout "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || true
  launchctl bootstrap "$LAUNCH_DOMAIN" "$PLIST_PATH" >/dev/null 2>&1 || launchctl load -w "$PLIST_PATH"
  launchctl kickstart "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || true
  echo "started: $LABEL"
}

stop() {
  launchctl bootout "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1 || launchctl unload "$PLIST_PATH" 2>/dev/null || true
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
  if launchctl print "${LAUNCH_DOMAIN}/${LABEL}" >/dev/null 2>&1; then
    echo "running: $LABEL"
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
