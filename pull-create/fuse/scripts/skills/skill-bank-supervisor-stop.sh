#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

PID_FILE=".agent/skill-bank/supervisor.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "Skill-bank supervisor is not running (no pid file)."
  exit 0
fi

pid="$(cat "$PID_FILE" 2>/dev/null || true)"
if [[ -z "$pid" ]]; then
  rm -f "$PID_FILE"
  echo "Removed empty stale pid file."
  exit 0
fi

if ! kill -0 "$pid" 2>/dev/null; then
  rm -f "$PID_FILE"
  echo "Skill-bank supervisor was not running (stale pid=$pid)."
  exit 0
fi

kill "$pid" 2>/dev/null || true
sleep 1
if kill -0 "$pid" 2>/dev/null; then
  kill -9 "$pid" 2>/dev/null || true
fi
rm -f "$PID_FILE"
echo "Stopped skill-bank supervisor (pid=$pid)."
