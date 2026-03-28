#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WRAPPER_PATH="$ROOT_DIR/scripts/runtime/launchd-shell-wrapper.sh"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
LOG_BASE_DIR="$HOME/.tnf/service-logs"
UID_VALUE="$(id -u)"

if [[ ! -x "$WRAPPER_PATH" ]]; then
  chmod +x "$WRAPPER_PATH"
fi

mkdir -p "$LAUNCH_AGENTS_DIR" "$LOG_BASE_DIR"

write_plist() {
  local label="$1"
  local command="$2"
  local service_log_dir="$LOG_BASE_DIR/$label"
  local plist_path="$LAUNCH_AGENTS_DIR/$label.plist"

  mkdir -p "$service_log_dir"

  cat >"$plist_path" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${label}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${WRAPPER_PATH}</string>
    <string>${label}</string>
    <string>${ROOT_DIR}</string>
    <string>${command}</string>
    <string>${service_log_dir}</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${HOME}/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${HOME}/Library/pnpm:${HOME}/.nvm/versions/node/v24.12.0/bin</string>
    <key>HOME</key>
    <string>${HOME}</string>
  </dict>
  <key>WorkingDirectory</key>
  <string>${ROOT_DIR}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${service_log_dir}/stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${service_log_dir}/stderr.log</string>
</dict>
</plist>
EOF

  plutil -lint "$plist_path" >/dev/null
}

reload_service() {
  local label="$1"
  local plist_path="$LAUNCH_AGENTS_DIR/$label.plist"

  launchctl bootout "gui/${UID_VALUE}" "$plist_path" 2>/dev/null || true
  launchctl bootstrap "gui/${UID_VALUE}" "$plist_path"
  launchctl enable "gui/${UID_VALUE}/${label}" 2>/dev/null || true
  launchctl kickstart -kp "gui/${UID_VALUE}/${label}" || true
}

write_plist "com.thenewfuse.factory-supercycle" \
  "SUPERCYCLE_CONTINUOUS=true SUPERCYCLE_INTERVAL_MS=180000 pnpm run factory:supercycle:loop"
write_plist "com.thenewfuse.factory-supervisor" \
  "scripts/orchestrator/factory-supervisor.sh"
write_plist "com.thenewfuse.web-experience-swarm" \
  ".agent/runtime-logs/run-web-experience-continuous.sh"
write_plist "com.thenewfuse.qa-swarm" \
  "TEST_ENABLE_IMPROVER=1 TEST_LOOP_INTERVAL=180000 TEST_TARGET_SCORE=100 TEST_CONTINUE_AFTER_TARGET=1 TEST_AGENT_TIMEOUT_MS=900000 TEST_STRICT_TYPECHECK=0 TEST_TIMEOUT_TYPECHECK_MS=180000 TEST_TIMEOUT_LINT_MS=180000 TEST_TIMEOUT_BUILD_MS=300000 TEST_TIMEOUT_UNIT_MS=180000 TEST_HEARTBEAT_INTERVAL_SEC=15 scripts/swarm/run-qa-loop-service.sh"
write_plist "com.thenewfuse.jules-followup" \
  "bash scripts/jules-followup-supervisor.sh"

reload_service "com.thenewfuse.factory-supercycle"
reload_service "com.thenewfuse.factory-supervisor"
reload_service "com.thenewfuse.web-experience-swarm"
reload_service "com.thenewfuse.qa-swarm"
reload_service "com.thenewfuse.jules-followup"

echo "Repaired services:"
launchctl list | rg 'com.thenewfuse.(factory-supercycle|factory-supervisor|web-experience-swarm|qa-swarm|jules-followup)' || true
