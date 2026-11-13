#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse"
NODE_BIN="${NODE_BIN:-/Users/danielgoldberg/.hermes/node/bin/node}"
if [[ ! -x "$NODE_BIN" ]]; then
  NODE_BIN="$(command -v node)"
fi

TNF_HOME="${HOME}/.tnf"
CONFIG_YAML="${TNF_HOME}/config.yaml"
LOG_DIR="${TNF_HOME}/logs"
LAUNCH_AGENTS_DIR="${HOME}/Library/LaunchAgents"
PLIST_PATH="${LAUNCH_AGENTS_DIR}/com.tnf.self-improvement-loop.plist"
LABEL="com.tnf.self-improvement-loop"

mkdir -p "$TNF_HOME" "$LOG_DIR" "$LAUNCH_AGENTS_DIR"

# 1. Ensure sub_director_override.enabled is true in ~/.tnf/config.yaml
if [[ -f "$CONFIG_YAML" ]]; then
  "$NODE_BIN" -e '
    const fs = require("fs");
    const p = process.argv[1];
    let text = fs.readFileSync(p, "utf8");
    const updated = text.replace(
      /(sub_director_override:\s*\n\s*enabled:\s*)false/,
      "$1true"
    );
    if (updated !== text) {
      fs.writeFileSync(p, updated, "utf8");
      console.log("Updated sub_director_override.enabled -> true in", p);
    } else {
      console.log("sub_director_override.enabled already true or not matched in", p);
    }
  ' "$CONFIG_YAML"
fi

# 2. Write resource-guarded LaunchAgent plist
cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${REPO_ROOT}/scripts/runtime/tnf-launchd-guard.sh</string>
    <string>--job</string>
    <string>${LABEL}</string>
    <string>--class</string>
    <string>probe</string>
    <string>--repo-root</string>
    <string>${REPO_ROOT}</string>
    <string>--</string>
    <string>${NODE_BIN}</string>
    <string>${REPO_ROOT}/scripts/harness/tnf-harness.cjs</string>
    <string>self-improve</string>
    <string>--json</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/Users/danielgoldberg/.hermes/node/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>TNF_AGENT_ID</key>
    <string>tnf-cli-agent</string>
    <key>HOME</key>
    <string>${HOME}</string>
  </dict>
  <key>WorkingDirectory</key>
  <string>${REPO_ROOT}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>StartInterval</key>
  <integer>1800</integer>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/tnf-self-improvement-loop.out.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/tnf-self-improvement-loop.err.log</string>
</dict>
</plist>
EOF

plutil -lint "$PLIST_PATH"

UID_NUM="$(id -u)"
launchctl bootout "gui/${UID_NUM}/${LABEL}" 2>/dev/null || true
launchctl bootstrap "gui/${UID_NUM}" "$PLIST_PATH"
launchctl enable "gui/${UID_NUM}/${LABEL}" || true
launchctl kickstart -k "gui/${UID_NUM}/${LABEL}" || true

echo "Installed and started ${LABEL}"
