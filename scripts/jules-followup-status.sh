#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

LOG_DIR=".agent/jules-logs"
PID_FILE="$LOG_DIR/jules-followup-supervisor.pid"
DAEMON_PID_FILE="$LOG_DIR/jules-followup-daemon.pid"
HEARTBEAT_FILE="$LOG_DIR/jules-followup-heartbeat.json"
LAUNCH_LOG="$LOG_DIR/jules-followup-launch.log"
STATE_FILE="$LOG_DIR/jules-followup-supervisor-state.json"

daemon_status="stopped"
daemon_pid=""
if [[ -f "$DAEMON_PID_FILE" ]]; then
  daemon_pid="$(cat "$DAEMON_PID_FILE" 2>/dev/null || true)"
  if [[ -n "${daemon_pid:-}" ]] && kill -0 "$daemon_pid" 2>/dev/null; then
    daemon_status="running"
  else
    daemon_status="stale"
  fi
fi

worker_status="stopped"
worker_pid=""
if [[ -f "$PID_FILE" ]]; then
  worker_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${worker_pid:-}" ]] && kill -0 "$worker_pid" 2>/dev/null; then
    worker_status="running"
  else
    worker_status="stale"
  fi
fi

if [[ "$daemon_status" == "running" && "$worker_status" == "running" ]]; then
  echo "status=running daemon_pid=$daemon_pid pid=$worker_pid"
elif [[ "$daemon_status" == "running" ]]; then
  echo "status=recovering daemon_pid=$daemon_pid pid=${worker_pid:-unknown}"
elif [[ "$worker_status" == "running" ]]; then
  echo "status=running-no-daemon pid=$worker_pid"
elif [[ "$daemon_status" == "stale" || "$worker_status" == "stale" ]]; then
  echo "status=stale-pid daemon_pid=${daemon_pid:-unknown} pid=${worker_pid:-unknown}"
else
  echo "status=stopped"
fi

if [[ -f "$HEARTBEAT_FILE" ]]; then
  echo "heartbeat:"
  jq '{timestamp, phase, notes, cycle, interval_sec, consecutive_errors, summary}' "$HEARTBEAT_FILE"
  heartbeat_age_sec="$(
    node -e "const fs=require('fs');const f=process.argv[1];try{const j=JSON.parse(fs.readFileSync(f,'utf8'));const ts=Date.parse(j.timestamp||'');if(!Number.isFinite(ts)){console.log('unknown');process.exit(0)};console.log(Math.max(0,Math.floor((Date.now()-ts)/1000)));}catch{console.log('unknown')}" "$HEARTBEAT_FILE"
  )"
  heartbeat_interval_sec="$(jq -r '.interval_sec // 180' "$HEARTBEAT_FILE" 2>/dev/null || echo 180)"
  if [[ "$heartbeat_age_sec" =~ ^[0-9]+$ ]] && [[ "$heartbeat_interval_sec" =~ ^[0-9]+$ ]]; then
    freshness_window=$((heartbeat_interval_sec * 2 + 30))
    if (( heartbeat_age_sec <= freshness_window )); then
      echo "heartbeat_fresh=true age_sec=$heartbeat_age_sec max_age_sec=$freshness_window"
    else
      echo "heartbeat_fresh=false age_sec=$heartbeat_age_sec max_age_sec=$freshness_window"
    fi
  else
    echo "heartbeat_fresh=unknown"
  fi
else
  echo "heartbeat: missing"
fi

if [[ -f "$LAUNCH_LOG" ]]; then
  echo "recent_log_tail:"
  tail -n 20 "$LAUNCH_LOG"
else
  echo "recent_log_tail: missing"
fi

if [[ -f "$STATE_FILE" ]]; then
  echo "alert_state:"
  jq '{stalledCycles: (.stalledCycles | to_entries | sort_by(-.value) | .[:10]), lastAlertAt}' "$STATE_FILE"
else
  echo "alert_state: missing"
fi
