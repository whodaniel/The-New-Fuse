#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SNAP_DIR="$SCRIPT_DIR/snapshots"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST="$PLIST_DIR/com.danielgoldberg.agentrelationship.autopilot.plist"
INTERVAL="${2:-3600}"

usage() {
  cat <<EOF
Usage: $0 [install|remove|status] [seconds]

Commands:
  install [seconds]   Install+load launchd agent. Default interval: 3600
  remove              Unload+remove launchd agent
  status              Show launchd status and plist path

Example:
  $0 install 1800
EOF
}

cmd="${1:-install}"

write_plist() {
  mkdir -p "$PLIST_DIR"
  cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.danielgoldberg.agentrelationship.autopilot</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>cd '$SCRIPT_DIR' && ./rebuild_agent_relationship_artifacts.sh</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StartInterval</key>
  <integer>$INTERVAL</integer>
  <key>WorkingDirectory</key>
  <string>$SCRIPT_DIR</string>
  <key>StandardOutPath</key>
  <string>$SNAP_DIR/launchd.out.log</string>
  <key>StandardErrorPath</key>
  <string>$SNAP_DIR/launchd.err.log</string>
</dict>
</plist>
EOF
}

case "$cmd" in
  install)
    write_plist
    launchctl unload "$PLIST" >/dev/null 2>&1 || true
    launchctl load "$PLIST"
    echo "Installed launchd agent at $PLIST (interval ${INTERVAL}s)"
    echo "Working directory: $SCRIPT_DIR"
    ;;
  remove)
    launchctl unload "$PLIST" >/dev/null 2>&1 || true
    rm -f "$PLIST"
    echo "Removed launchd agent."
    ;;
  status)
    echo "plist: $PLIST"
    echo "working dir: $SCRIPT_DIR"
    launchctl list | grep 'com\.danielgoldberg\.agentrelationship\.autopilot' || echo "Not loaded"
    ;;
  *)
    usage
    exit 1
    ;;
esac
