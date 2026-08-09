#!/usr/bin/env bash
# Start or restart local Redis with TNF fleet-safe defaults.
set -euo pipefail

REDIS_BIN="${REDIS_SERVER:-$(command -v redis-server)}"
REDIS_CLI="${REDIS_CLI:-$(command -v redis-cli)}"
PORT="${REDIS_PORT:-6379}"
BIND="${REDIS_BIND:-127.0.0.1}"
MAXCLIENTS="${REDIS_MAXCLIENTS:-10000}"
MAXMEMORY="${REDIS_MAXMEMORY:-256mb}"
TNF_HOME="${TNF_HOME:-$HOME/.tnf}"
REDIS_DIR="${TNF_REDIS_DIR:-$TNF_HOME/redis}"
LOG_DIR="${TNF_LOG_DIR:-$TNF_HOME/logs}"
REDIS_CONF="${TNF_REDIS_CONF:-$REDIS_DIR/redis.conf}"
LOG_FILE="${REDIS_LOG_FILE:-$LOG_DIR/redis.log}"
CLIENT_WARN="${REDIS_CLIENT_WARN:-8000}"
REDIS_CLI_TIMEOUT_SECONDS="${REDIS_CLI_TIMEOUT_SECONDS:-2}"
REDIS_LOCALE="${TNF_REDIS_LOCALE:-C}"
LABEL="com.thenewfuse.redis-tnf-bus"
PLIST_PATH="$HOME/Library/LaunchAgents/${LABEL}.plist"
LAUNCH_DOMAIN="gui/$(id -u)"

usage() {
  echo "Usage: $0 <start|restart|status|gate|launchd-install|launchd-start>"
  echo "  start          — start redis-server if not reachable"
  echo "  restart        — force restart with maxclients=${MAXCLIENTS}"
  echo "  status  — ping + client count"
  echo "  gate    — exit 0 only if ping ok and clients < ${CLIENT_WARN}"
  echo "  launchd-install/start — macOS LaunchAgent with StartInterval, not KeepAlive"
}

redis_cli() {
  python3 - "$REDIS_CLI_TIMEOUT_SECONDS" "$REDIS_CLI" "$BIND" "$PORT" "$@" <<'PY'
import subprocess
import sys

timeout = float(sys.argv[1])
binary = sys.argv[2]
bind = sys.argv[3]
port = sys.argv[4]
args = sys.argv[5:]

try:
    completed = subprocess.run(
        [binary, "-h", bind, "-p", port, *args],
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
    )
except subprocess.TimeoutExpired:
    print(f"redis-cli timeout after {timeout:g}s", file=sys.stderr)
    sys.exit(124)

if completed.stdout:
    print(completed.stdout, end="")
if completed.stderr:
    print(completed.stderr, end="", file=sys.stderr)
sys.exit(completed.returncode)
PY
}

redis_ping() {
  redis_cli ping >/dev/null 2>&1
}

redis_clients() {
  redis_cli INFO clients 2>/dev/null | awk -F: '/^connected_clients:|^maxclients:/ {gsub(/\r/,"",$2); print $2}' | paste - - | awk '{print $1" "$2}'
}

write_redis_conf() {
  mkdir -p "$REDIS_DIR" "$LOG_DIR"
  cat >"$REDIS_CONF" <<CONF
bind 127.0.0.1 ::1
protected-mode yes
port ${PORT}
tcp-backlog 511
timeout 0
tcp-keepalive 300
save ""
stop-writes-on-bgsave-error no
dir ${REDIS_DIR}
dbfilename dump.rdb
appendonly no
shutdown-on-sigterm nosave
logfile ${LOG_FILE}
daemonize no
maxmemory ${MAXMEMORY}
maxmemory-policy allkeys-lru
maxclients ${MAXCLIENTS}
CONF
}

quarantine_legacy_rdb() {
  local dump_file="$REDIS_DIR/dump.rdb"
  if [[ "${TNF_REDIS_KEEP_RDB:-0}" == "1" || ! -f "$dump_file" ]]; then
    return 0
  fi
  local quarantine_dir="$REDIS_DIR/quarantine"
  local stamp
  stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  mkdir -p "$quarantine_dir"
  mv "$dump_file" "$quarantine_dir/dump.rdb.${stamp}"
  echo "Quarantined legacy Redis RDB: $quarantine_dir/dump.rdb.${stamp}"
}

launchd_pid() {
  launchctl list 2>/dev/null | awk -v label="$LABEL" '$3 == label && $1 != "-" { print $1; exit }'
}

stop_orphan_for_launchd() {
  if ! redis_ping; then
    return 0
  fi
  if [[ -n "$(launchd_pid)" ]]; then
    return 0
  fi
  echo "Redis is reachable but ${LABEL} is not owning it; stopping orphan before launchd start."
  redis_cli SHUTDOWN NOSAVE >/dev/null 2>&1 || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    redis_ping || return 0
  done
  echo "WARN: Redis orphan did not stop cleanly before launchd start" >&2
}

start_redis() {
  if ! command -v "${REDIS_BIN}" >/dev/null 2>&1; then
    echo "ERROR: redis-server not found" >&2
    exit 1
  fi
  if [[ "$(uname -s)" == "Darwin" && "${TNF_REDIS_DISABLE_LAUNCHD:-0}" != "1" ]]; then
    if ! redis_ping || [[ -z "$(launchd_pid)" ]]; then
      launchd_start
      return 0
    fi
  fi
  if redis_ping; then
    echo "Redis already reachable on ${BIND}:${PORT}"
    redis_clients || true
    return 0
  fi
  write_redis_conf
  quarantine_legacy_rdb
  LANG="$REDIS_LOCALE" LC_ALL="$REDIS_LOCALE" LC_CTYPE="$REDIS_LOCALE" \
    "${REDIS_BIN}" "$REDIS_CONF" --daemonize yes --maxclients "${MAXCLIENTS}" || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    if redis_ping; then
      echo "Started Redis on ${BIND}:${PORT} (maxclients=${MAXCLIENTS})"
      redis_clients || true
      return 0
    fi
  done
  echo "ERROR: Redis failed to start" >&2
  exit 1
}

launchd_install() {
  [[ "$(uname -s)" == "Darwin" ]] || {
    echo "launchd is only available on macOS" >&2
    exit 1
  }
  if [[ -z "$REDIS_BIN" || ! -x "$REDIS_BIN" ]]; then
    echo "ERROR: redis-server not found" >&2
    exit 1
  fi
  mkdir -p "$(dirname "$PLIST_PATH")"
  write_redis_conf
  cat >"$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${REDIS_BIN}</string>
    <string>${REDIS_CONF}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${REDIS_DIR}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>LANG</key>
    <string>${REDIS_LOCALE}</string>
    <key>LC_ALL</key>
    <string>${REDIS_LOCALE}</string>
    <key>LC_CTYPE</key>
    <string>${REDIS_LOCALE}</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StartInterval</key>
  <integer>300</integer>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/redis-stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/redis-stderr.log</string>
  <key>ProcessType</key>
  <string>Background</string>
</dict>
</plist>
PLIST
  plutil -lint "$PLIST_PATH" >/dev/null
  echo "installed: $LABEL"
}

launchd_start() {
  launchd_install
  if ! launchctl print "$LAUNCH_DOMAIN/$LABEL" >/dev/null 2>&1; then
    launchctl bootstrap "$LAUNCH_DOMAIN" "$PLIST_PATH" >/dev/null 2>&1 || launchctl load -w "$PLIST_PATH"
  fi
  stop_orphan_for_launchd
  quarantine_legacy_rdb
  launchctl enable "$LAUNCH_DOMAIN/$LABEL" >/dev/null 2>&1 || true
  launchctl kickstart -k "$LAUNCH_DOMAIN/$LABEL" >/dev/null 2>&1 || true
  for _ in $(seq 1 30); do
    sleep 1
    if redis_ping && [[ -n "$(launchd_pid)" ]]; then
      echo "Redis launchd service reachable on ${BIND}:${PORT}"
      return 0
    fi
  done
  echo "WARN: Redis launchd service not reachable or not launchd-owned yet" >&2
}

restart_redis() {
  if [[ "$(uname -s)" == "Darwin" && "${TNF_REDIS_DISABLE_LAUNCHD:-0}" != "1" ]]; then
    redis_cli SHUTDOWN NOSAVE >/dev/null 2>&1 || true
    sleep 2
    launchd_start
  else
    pkill -9 redis-server 2>/dev/null || true
    sleep 2
    start_redis
  fi
}

status_redis() {
  if redis_ping; then
    echo "Redis: PONG (${BIND}:${PORT})"
    read -r connected maxclients <<<"$(redis_clients || echo '? ?')"
    echo "Clients: ${connected:-?} / ${maxclients:-?}"
  else
    echo "Redis: DOWN"
    exit 1
  fi
}

gate_redis() {
  if ! redis_ping; then
    echo "gate: redis down"
    exit 1
  fi
  read -r connected maxclients <<<"$(redis_clients || echo '99999 10000')"
  if [[ "${connected}" =~ ^[0-9]+$ ]] && (( connected >= CLIENT_WARN )); then
    echo "gate: redis clients ${connected} >= warn ${CLIENT_WARN}"
    exit 1
  fi
  echo "gate: ok (clients=${connected:-?}/${maxclients:-?})"
}

case "${1:-}" in
  start) start_redis ;;
  restart) restart_redis ;;
  status) status_redis ;;
  gate) gate_redis ;;
  launchd-install) launchd_install ;;
  launchd-start) launchd_start ;;
  *) usage; exit 1 ;;
esac
