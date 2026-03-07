#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

PID_FILE=".agent/skill-bank/supervisor.pid"
mkdir -p ".agent/skill-bank"

if [[ -f "$PID_FILE" ]]; then
  pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    echo "Skill-bank supervisor already running (pid=$pid)."
    exit 0
  fi
  rm -f "$PID_FILE"
fi

nohup bash scripts/skills/skill-bank-supervisor.sh >/dev/null 2>&1 &
sleep 1

if [[ -f "$PID_FILE" ]]; then
  echo "Started skill-bank supervisor (pid=$(cat "$PID_FILE"))."
else
  echo "Failed to start skill-bank supervisor." >&2
  exit 1
fi
