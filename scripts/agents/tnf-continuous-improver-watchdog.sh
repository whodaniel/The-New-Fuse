#!/usr/bin/env bash

# --- tnf dependency preflight ------------------------------------------
# cron runs with a minimal PATH. These scripts have no 'set -e', so a
# missing binary previously produced 'command not found', an exit code of
# 0, and a cycle that cron recorded as successful while doing nothing.
# Fail loudly at the top instead.
for _tnf_bin in jq redis-cli; do
  command -v "$_tnf_bin" >/dev/null 2>&1 || {
    echo "FATAL: required binary '$_tnf_bin' not found. PATH=$PATH" >&2
    exit 127
  }
done
# --- end tnf dependency preflight -----------------------------------

# TNF Continuous Improver — watchdog subset (one cycle).
#
# Replaces the legacy OpenClaw `tnf-loop-watchdog.sh` that ran as a
# launchd agent under `com.openclaw.tnf-loop-watchdog` every 15 min.
#
# Probes:
#   - disk headroom (df)             — emits disk-critical when < 2 GB
#   - scheduler liveness             — emits scheduler-low-job-count when
#                                       ~/.hermes/cron/jobs.json has < 3 enabled
#   - gateway Redis                  — emits gateway-redis-down on no pong
#   - Hermes cron interpreter bug    — emits hermes-cron-interpreter-dead
#                                       when >=3 recent runs end in the
#                                       RuntimeError "cannot schedule new
#                                       futures after interpreter shutdown"
#   - recent cron failure aggregation— emits cron-recent-failures on
#                                       first appearance of category
#
# Findings go to:
#   - state file                     ~/.tnf/runtime/improver-watchdog/state.json
#   - cycle log                      ~/.tnf/runtime/improver-watchdog/cycles-YYYYMMDD.jsonl
#   - planning queue                 redis LPUSH tnf:master:tasks:planning
#   - bus                            redis PUBLISH tnf:bus:ingress type=improver-watchdog
#
# No Telegram token here. No Railway references. No reliance on the broken
# Hermes cron scheduler.

set -euo pipefail

# --- Fleet-wide pause gate (2026-07-21) ---
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/scripts/lib/tnf-fleet-mode.sh"
if tnf_fleet_paused; then
  echo '{"ok":true,"skipped":"fleet-paused"}'
  exit 0
fi

RUNTIME_DIR="${HOME}/.tnf/runtime/improver-watchdog"
STATE_FILE="$RUNTIME_DIR/state.json"
SIG_FILE="$RUNTIME_DIR/last-sig.txt"
DAY="$(date -u +%Y%m%d)"
LOG_FILE="$RUNTIME_DIR/cycles-${DAY}.jsonl"
MIN_DISK_GB_CRITICAL=2
MIN_DISK_GB_WARN=5
MIN_DISK_MB_CRITICAL=$((MIN_DISK_GB_CRITICAL * 1024))
MIN_DISK_MB_WARN=$((MIN_DISK_GB_WARN * 1024))
MIN_ENABLED_JOBS=3
CRON_OUT="${HOME}/.hermes/cron/output"
HERMES_JOBS="${HOME}/.hermes/cron/jobs.json"
CHECK_WINDOW_MS=$((10 * 60 * 1000))

mkdir -p "$RUNTIME_DIR"

log() { printf '%s %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }

emit_finding() {
  local finding_type="$1" severity="$2" description="$3" extra="$4"
  record=$(jq -n \
    --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg type "$finding_type" \
    --arg sev "$severity" \
    --arg desc "$description" \
    --arg extra "$extra" \
    '{timestamp:$ts, finding:$type, severity:$sev, description:$desc, extra:$extra}')
  echo "$record" >> "$LOG_FILE"
  if command -v redis-cli >/dev/null 2>&1; then
    redis-cli -h 127.0.0.1 -p 6379 LPUSH tnf:master:tasks:planning "$record" >/dev/null || true
    redis-cli -h 127.0.0.1 -p 6379 PUBLISH tnf:bus:ingress "$record" >/dev/null || true
  fi
  echo "$record"
}

findings=()
details=()

# 1. Disk headroom (Report GB; alert if below MIN_DISK_GB; finer granularity in MB for accurate reporting)
avail_kb=$(df -Pk "$HOME" | awk 'NR==2 {print $4}' || echo "")
if [ -z "$avail_kb" ]; then
  findings+=("disk-probe-failed")
  details+=("disk: probe-failed")
else
  avail_mb=$((avail_kb / 1024))
  avail_gb=$((avail_mb / 1024))
  details+=("disk: ${avail_mb}MB (${avail_gb}GB)")
  if [ "$avail_mb" -lt "$MIN_DISK_MB_CRITICAL" ]; then
    emit_finding "disk-critical" "critical" "disk headroom below ${MIN_DISK_GB_CRITICAL}GB" "${avail_mb}MB (${avail_gb}GB) free"
    findings+=("disk-critical|${avail_mb}MB free|run: bash scripts/operations/swarm-disk-retention.sh")
  elif [ "$avail_mb" -lt "$MIN_DISK_MB_WARN" ]; then
    emit_finding "disk-warn" "warning" "disk headroom below ${MIN_DISK_GB_WARN}GB" "${avail_mb}MB (${avail_gb}GB) free"
    findings+=("disk-warn|${avail_mb}MB free|schedule swarm-disk-retention before next agent spawn")
  fi
fi

# 2. Scheduler liveness (Hermes cron jobs enabled count)
if [ -f "$HERMES_JOBS" ]; then
  enabled_count=$(jq '[.jobs[] | select(.enabled == true)] | length' "$HERMES_JOBS" 2>/dev/null || echo 0)
  details+=("hermes-jobs-enabled: ${enabled_count}")
  if [ "${enabled_count:-0}" -lt "$MIN_ENABLED_JOBS" ]; then
    emit_finding "scheduler-low-job-count" "warning" "hermes cron enabled jobs below ${MIN_ENABLED_JOBS}" "enabled=${enabled_count}"
    findings+=("scheduler-low-job-count|enabled=${enabled_count}|re-enable core jobs")
  fi
else
  findings+=("hermes-jobs-missing")
  details+=("hermes-jobs: missing")
fi

# 3. Gateway Redis
if command -v redis-cli >/dev/null 2>&1; then
  if redis-cli -h 127.0.0.1 -p 6379 PING >/dev/null 2>&1; then
    details+=("redis: pong")
  else
    emit_finding "gateway-redis-down" "critical" "redis ping failed" "redis-cli exit non-zero"
    findings+=("gateway-redis-down|ping-fail|restart redis or check connectivity")
  fi
fi

# 4. Hermes cron interpreter bug detection
INTERPRETER_BUG_PATTERN="cannot schedule new futures after interpreter shutdown"
INTERPRETER_FINDINGS=0
if [ -d "$CRON_OUT" ]; then
  for d in "$CRON_OUT"/*/; do
    [ -d "$d" ] || continue
    job_id=$(basename "$d")
    last_md=$(ls -t "$d"*.md 2>/dev/null | head -1 || true)
    if [ -n "$last_md" ] && [ -f "$last_md" ]; then
      # Look at last 3 runs for repeated interpreter bug
      recent=$(ls -t "$d"*.md 2>/dev/null | head -3 || true)
      match_count=0
      total=0
      for f in $recent; do
        total=$((total + 1))
        if grep -qF "$INTERPRETER_BUG_PATTERN" "$f" 2>/dev/null; then
          match_count=$((match_count + 1))
        fi
      done
      if [ "$total" -ge 3 ] && [ "$match_count" -ge 3 ]; then
        INTERPRETER_FINDINGS=$((INTERPRETER_FINDINGS + 1))
      fi
    fi
  done
  details+=("hermes-interpreter-bug-jobs: ${INTERPRETER_FINDINGS}")
  if [ "$INTERPRETER_FINDINGS" -gt 0 ]; then
    emit_finding "hermes-cron-interpreter-dead" "critical" \
      "hermes cron interpreter bug signalled on ${INTERPRETER_FINDINGS} jobs" \
      "pattern=${INTERPRETER_BUG_PATTERN}"
    findings+=("hermes-cron-interpreter-dead|${INTERPRETER_FINDINGS}|restart hermes agent or set SYSTEM_CRON instead")
  fi
fi

# 5. Recent cron failure aggregation
if [ -d "$CRON_OUT" ]; then
  now_ms=$(($(date +%s) * 1000))
  cutoff_ms=$((now_ms - CHECK_WINDOW_MS))
  failures_summary=""
  failures_count=0
  for jsonl in "$CRON_OUT"/*.jsonl; do
    [ -f "$jsonl" ] || continue
    last=$(tail -1 "$jsonl" 2>/dev/null || true)
    if [ -z "$last" ]; then continue; fi
    if echo "$last" | jq -e 'select(.action == "finished" and (.ts // 0) >= '"$cutoff_ms"' and (.status == "error" or (.summary // "") | test("alpha period|model not allowed|timeout|unauthorized"; "i")))' >/dev/null 2>&1; then
      jobId=$(echo "$last" | jq -r '.jobId // "unknown"' 2>/dev/null)
      err=$(echo "$last" | jq -r '.error // .summary // "unknown"' 2>/dev/null)
      failures_summary="${failures_summary}${jobId}: ${err}\n"
      failures_count=$((failures_count + 1))
    fi
  done
  details+=("recent-failures: ${failures_count}")
  if [ "$failures_count" -gt 0 ]; then
    emit_finding "cron-recent-failures" "warning" "recent cron failures detected" \
      "$(printf '%b' "$failures_summary" | head -1)"
  fi
fi

# Save state
state_payload=$(jq -n \
  --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg details "$(IFS=';'; echo "${details[*]}")" \
  --argjson findings "$(printf '%s\n' "${findings[@]+"${findings[@]}"}" | jq -R 'split("\n") | map(select(. != ""))' 2>/dev/null || echo '[]')" \
  '{lastAt:$ts, findings:$findings, details:$details}')
echo "$state_payload" > "$STATE_FILE.tmp"
mv "$STATE_FILE.tmp" "$STATE_FILE"

# Update agent registry heartbeat
if command -v redis-cli >/dev/null 2>&1; then
  hb=$(jq -n --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --argjson n "${#findings[@]}" \
    '{agentId:"agent:continuous-improver-watchdog", lastCycleAt:$ts, findingsCount:$n}')
  redis-cli -h 127.0.0.1 -p 6379 HSET tnf:agent-registry "agent:continuous-improver-watchdog" "$hb" >/dev/null || true
fi

exit 0
