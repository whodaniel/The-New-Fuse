#!/usr/bin/env bash
# Durable TNF agent-daemon launcher (survives parent shell exit).
# macOS-safe: no setsid (not present by default).
set -euo pipefail

ROOT="${TNF_REPO_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
TNF_HOME="${TNF_HOME:-$HOME/.tnf}"
PYTHON="${TNF_PYTHON:-$TNF_HOME/venv/bin/python3}"
SCRIPT="$ROOT/scripts/agents/tnf-agent-daemon.py"
LOG="$TNF_HOME/logs/tnf-agent-daemon.log"
PIDFILE="$TNF_HOME/pids/tnf-agent-daemon.pid"
MODE="${1:-live}"
INTERVAL="${2:-120}"

mkdir -p "$TNF_HOME/logs" "$TNF_HOME/pids"

# Soft-stop any live daemon recorded in the pidfile (avoid broad pkill)
if [[ -f "$PIDFILE" ]]; then
  old="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [[ -n "${old:-}" ]] && kill -0 "$old" 2>/dev/null; then
    echo "already-running pid=$old"
    exit 0
  fi
  rm -f "$PIDFILE"
fi

# Preflight Redis budget before opening sockets
if [[ "${TNF_SKIP_REDIS_GUARD:-0}" != "1" ]]; then
  node "$ROOT/scripts/runtime/redis-connection-guard.cjs" --preflight
fi

cd "$ROOT"
# Detach via nohup + background; redirect stdio so the agent shell can exit.
nohup "$PYTHON" "$SCRIPT" "$MODE" --interval "$INTERVAL" >>"$LOG" 2>&1 </dev/null &
echo $! >"$PIDFILE"
# Give Python a moment to pass preflight + register
sleep 3
if kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
  echo "started pid=$(cat "$PIDFILE") mode=$MODE log=$LOG"
  exit 0
fi
echo "failed-to-stay-up; last log:" >&2
tail -40 "$LOG" >&2 || true
exit 1
