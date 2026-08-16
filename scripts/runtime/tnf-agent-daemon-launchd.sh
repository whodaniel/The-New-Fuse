#!/usr/bin/env bash
# Install / start / stop macOS LaunchAgent for TNF agent daemon.
set -euo pipefail

ROOT="${TNF_REPO_ROOT:-/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/The-New-Fuse}"
TNF_HOME="${TNF_HOME:-$HOME/.tnf}"
PYTHON="${TNF_PYTHON:-$TNF_HOME/venv/bin/python3}"
SCRIPT="$ROOT/scripts/agents/tnf-agent-daemon.py"
LOG_DIR="$TNF_HOME/logs"
LABEL="com.tnf.agent-daemon"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
DOMAIN="gui/$(id -u)"
INTERVAL="${TNF_AGENT_THINK_INTERVAL:-120}"

usage() {
  echo "Usage: $0 <install|start|stop|status|uninstall>"
}

write_plist() {
  mkdir -p "$LOG_DIR" "$(dirname "$PLIST")" "$TNF_HOME/pids"
  # Preflight wrapper so launchd starts only when Redis budget is healthy
  local wrapper="$TNF_HOME/bin/tnf-agent-daemon-launchd-wrapper.sh"
  mkdir -p "$TNF_HOME/bin"
  cat >"$wrapper" <<WRAP
#!/usr/bin/env bash
set -euo pipefail
ROOT="$ROOT"
TNF_HOME="$TNF_HOME"
# Load local secrets without baking them into the plist.
set -a
[[ -f "\$HOME/.tnf.local.env" ]] && . "\$HOME/.tnf.local.env"
[[ -f "\$TNF_HOME/secrets/llm.env" ]] && . "\$TNF_HOME/secrets/llm.env"
[[ -f "\$TNF_HOME/secrets/super-admin.env" ]] && . "\$TNF_HOME/secrets/super-admin.env"
set +a
if [[ "\${TNF_SKIP_REDIS_GUARD:-0}" != "1" ]]; then
  /usr/bin/env node "\$ROOT/scripts/runtime/redis-connection-guard.cjs" --preflight
fi
exec "$PYTHON" "$SCRIPT" live --interval "$INTERVAL"
WRAP
  chmod +x "$wrapper"

  # Persist LLM key from installer environment if present (chmod 600).
  mkdir -p "$TNF_HOME/secrets"
  local llm_env="$TNF_HOME/secrets/llm.env"
  if [[ -n "${NVIDIA_API_KEY:-}${TNF_LLM_API_KEY:-}${OPENAI_API_KEY:-}" ]]; then
    python3 - "$llm_env" <<'PY'
import os, sys
path = sys.argv[1]
keys = ["NVIDIA_API_KEY", "TNF_LLM_API_KEY", "OPENAI_API_KEY", "TNF_LLM_BASE_URL", "TNF_LLM_MODEL"]
lines = []
for k in keys:
    v = os.environ.get(k)
    if not v:
        continue
    # POSIX-safe single-quote escaping for `source`
    esc = v.replace("'", "'\"'\"'")
    lines.append(f"{k}='{esc}'")
open(path, "w").write("\n".join(lines) + "\n")
os.chmod(path, 0o600)
print(f"wrote {path} (mode 600)")
PY
  fi

  cat >"$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${wrapper}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${ROOT}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>30</integer>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/tnf-agent-daemon.launchd.out.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/tnf-agent-daemon.launchd.err.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>TNF_HOME</key>
    <string>${TNF_HOME}</string>
    <key>TNF_REPO_ROOT</key>
    <string>${ROOT}</string>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:${HOME}/.local/bin:${HOME}/.hermes/node/bin</string>
  </dict>
  <key>ProcessType</key>
  <string>Background</string>
</dict>
</plist>
PLIST
  plutil -lint "$PLIST" >/dev/null
  echo "wrote $PLIST"
}

install_service() {
  write_plist
  # Prefer modern bootstrap; fall back to load -w for older launchctl states.
  launchctl bootout "$DOMAIN/$LABEL" >/dev/null 2>&1 || true
  launchctl unload "$PLIST" >/dev/null 2>&1 || true
  sleep 1
  if ! launchctl bootstrap "$DOMAIN" "$PLIST" 2>/tmp/tnf-agent-daemon-launchd.err; then
    echo "bootstrap failed; trying legacy load -w" >&2
    cat /tmp/tnf-agent-daemon-launchd.err >&2 || true
    launchctl load -w "$PLIST"
  fi
  launchctl enable "$DOMAIN/$LABEL" >/dev/null 2>&1 || true
  # Non-killing kickstart first to avoid xpcproxy thrash.
  launchctl kickstart "$DOMAIN/$LABEL" >/dev/null 2>&1 \
    || launchctl start "$LABEL" >/dev/null 2>&1 \
    || true
  sleep 2
  status_service
  echo "installed+started $LABEL"
}

start_service() {
  [[ -f "$PLIST" ]] || write_plist
  if ! launchctl print "$DOMAIN/$LABEL" >/dev/null 2>&1; then
    launchctl bootstrap "$DOMAIN" "$PLIST"
  fi
  launchctl kickstart -k "$DOMAIN/$LABEL" >/dev/null 2>&1 || launchctl kickstart "$DOMAIN/$LABEL" >/dev/null 2>&1 || true
  echo "started $LABEL"
}

stop_service() {
  launchctl bootout "$DOMAIN/$LABEL" >/dev/null 2>&1 || true
  echo "stopped $LABEL"
}

status_service() {
  if launchctl print "$DOMAIN/$LABEL" >/dev/null 2>&1; then
    launchctl print "$DOMAIN/$LABEL" 2>/dev/null | awk '/state =|pid =|last exit code/{print}'
  else
    echo "not loaded"
  fi
  ps -axo pid=,command= | grep -E 'tnf-agent-daemon\.py' | grep -v grep || echo "(no python daemon process)"
}

uninstall_service() {
  stop_service
  rm -f "$PLIST"
  echo "uninstalled $LABEL"
}

case "${1:-}" in
  install) install_service ;;
  start) start_service ;;
  stop) stop_service ;;
  status) status_service ;;
  uninstall) uninstall_service ;;
  *) usage; exit 1 ;;
esac
