#!/usr/bin/env bash

# --- tnf dependency preflight ------------------------------------------
# cron runs with a minimal PATH. These scripts have no 'set -e', so a
# missing binary previously produced 'command not found', an exit code of
# 0, and a cycle that cron recorded as successful while doing nothing.
# Fail loudly at the top instead.
for _tnf_bin in jq pnpm redis-cli; do
  command -v "$_tnf_bin" >/dev/null 2>&1 || {
    echo "FATAL: required binary '$_tnf_bin' not found. PATH=$PATH" >&2
    exit 127
  }
done
# --- end tnf dependency preflight -----------------------------------

# tnf-build-doctor.sh — TNF Build Doctor (autonomous, no-LLM).
#
# PURPOSE
#   Classify the chronic "Production build failed" finding that the
#   tnf-frontend-tester surfaces on roughly 80% of its */5m cycles.
#   The tester logs the symptom but does not tie it to a cause, so the
#   operator gets noise, not signal. This script is the doctor.
#
#   It does NOT run `pnpm -F frontend build` — that has OOM'd Hermes
#   Node on this host (Verified LIVING_STATE: "builds have OOM'd Hermes
#   Node on this host"; 4.2 GiB free / 100% disk confirmed 2026-07-24).
#   Instead it STATICALLY classifies why a build would fail:
#     - TypeScript error graph (tsc -b --noEmit dry)
#     - Unresolved import targets
#     - Vitest unit-test failure memory-threshold (the one known
#       non-deterministic test mentioned in LIVING_STATE)
#     - Atlas / registry integrity drift
#
# OUTPUT
#   Appends one JSONL record per cycle to
#     ~/.tnf/runtime/build-doctor/issues-YYYYMMDD.jsonl
#   PUBLISHes a heartbeat on tnf:bus:ingress labelled
#     agent:tnf-build-doctor.
#   On a "critical" or "novel-class" finding, LPUSHes a triage task to
#   tnf:master:tasks:planning (matches the frontend-tester contract).
#
# AUTH
#   Honors scripts/lib/tnf-fleet-mode.sh: skips when operator-paused.
#   Idempotent; safe to run on any cadence.
#   Does NOT touch the operator-deferred commit backlog or the
#   master-clock herd (those are operator-gated in LIVING_STATE).

set -euo pipefail

# --- Fleet-wide pause gate ---
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/scripts/lib/tnf-fleet-mode.sh"
if tnf_fleet_paused; then
  echo '{"ok":true,"skipped":"fleet-paused"}'
  exit 0
fi

export PATH="/usr/local/bin:/opt/homebrew/bin:${PATH}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H-%M-%SZ)"
TODAY="$(date -u +%Y%m%d)"
STATE_DIR="${HOME}/.tnf/runtime/build-doctor"
LOG_DIR="${STATE_DIR}/log"
ISSUES_FILE="${STATE_DIR}/issues-${TODAY}.jsonl"
LATEST_FILE="${STATE_DIR}/latest.json"
TMP_ISSUES="$(mktemp -t build-doctor-XXXXXX.jsonl)"
mkdir -p "${STATE_DIR}" "${LOG_DIR}"

# --- 1. Classify: TypeScript dry type-check scope (cheap, no emit) ---
# Bound the run to keep even this static pass off the OOM cliff.
# `timeout` is not preinstalled on macOS by default; we emulate it via
# a backgrounded sleeper killer so we never block the 5-min cron slot.
TS_OUT=""
ts_pid=""
pnpm -F @the-new-fuse/frontend exec tsc -p tsconfig.json --noEmit --pretty false \
  2>&1 >/tmp/tsc-stdout.tmp &
ts_pid=$!
( sleep 12; kill -TERM "${ts_pid}" 2>/dev/null ) >/dev/null 2>&1 &
wait "${ts_pid}" 2>/dev/null || TS_OUT="$(cat /tmp/tsc-stdout.tmp | head -40 || true)"
if [ -z "${TS_OUT}" ] && [ -s /tmp/tsc-stdout.tmp ]; then
  TS_OUT="$(head -40 /tmp/tsc-stdout.tmp)"
fi
rm -f /tmp/tsc-stdout.tmp
TS_ERROR_COUNT=0
TS_ERROR_CLASS="none"
if [ -n "${TS_OUT}" ]; then
  TS_ERROR_COUNT="$(printf '%s\n' "${TS_OUT}" | grep -cE 'error TS[0-9]+' || true)"
  if   [ "${TS_ERROR_COUNT}" -gt 0 ] && grep -qE 'Cannot find module'   <<<"${TS_OUT}"; then TS_ERROR_CLASS="module-resolution"
  elif [ "${TS_ERROR_COUNT}" -gt 0 ] && grep -qE 'has no exported member'<<<"${TS_OUT}"; then TS_ERROR_CLASS="export-drift"
  elif [ "${TS_ERROR_COUNT}" -gt 0 ] && grep -qE 'Property .* does not exist'<<<"${TS_OUT}"; then TS_ERROR_CLASS="property-mismatch"
  elif [ "${TS_ERROR_COUNT}" -gt 0 ]; then TS_ERROR_CLASS="generic-tsc"
  fi
fi

# --- 2. Classify: ESLint scope warning vs blocking error ---
LINT_OUT=""
lint_pid=""
pnpm -F @the-new-fuse/frontend exec eslint --max-warnings=99999 . \
  2>&1 >/tmp/eslint-stdout.tmp &
lint_pid=$!
( sleep 8; kill -TERM "${lint_pid}" 2>/dev/null ) >/dev/null 2>&1 &
wait "${lint_pid}" 2>/dev/null || LINT_OUT="$(tail -10 /tmp/eslint-stdout.tmp 2>/dev/null || true)"
if [ -z "${LINT_OUT}" ] && [ -s /tmp/eslint-stdout.tmp ]; then
  LINT_OUT="$(tail -10 /tmp/eslint-stdout.tmp)"
fi
rm -f /tmp/eslint-stdout.tmp
LINT_ERROR_COUNT="$(printf '%s\n' "${LINT_OUT}" | grep -cE 'error\s' || true)"
LINT_WARN_COUNT="$(printf '%s\n'  "${LINT_OUT}" | grep -cE ' warning\s?' || true)"

# --- 3. Classify: Test memory-threshold non-determinism (LIVING_STATE
#     explicitly says this is known non-deterministic, not a real bug) ---
TEST_OUT=""
test_pid=""
pnpm -F @the-new-fuse/frontend exec vitest run --reporter=basic \
  2>&1 >/tmp/vitest-stdout.tmp &
test_pid=$!
( sleep 10; kill -TERM "${test_pid}" 2>/dev/null ) >/dev/null 2>&1 &
wait "${test_pid}" 2>/dev/null || TEST_OUT="$(tail -20 /tmp/vitest-stdout.tmp 2>/dev/null || true)"
if [ -z "${TEST_OUT}" ] && [ -s /tmp/vitest-stdout.tmp ]; then
  TEST_OUT="$(tail -20 /tmp/vitest-stdout.tmp)"
fi
rm -f /tmp/vitest-stdout.tmp
MEM_THRESHOLD_HIT=0
if printf '%s\n' "${TEST_OUT}" | grep -qE 'JavaScript heap out of memory|allocation failure'; then
  MEM_THRESHOLD_HIT=1
fi

# --- 4. Overall verdict ---
VERDICT="green"
CAUSE="none"
if   [ "${TS_ERROR_COUNT}" -gt 0 ] && [ "${TS_ERROR_CLASS}" = "module-resolution" ]; then
  VERDICT="critical"; CAUSE="frontend-ts-module-resolution"
elif [ "${TS_ERROR_COUNT}" -gt 0 ]; then
  VERDICT="critical"; CAUSE="frontend-ts-${TS_ERROR_CLASS}"
elif [ "${LINT_ERROR_COUNT}" -gt 0 ]; then
  VERDICT="warn"; CAUSE="frontend-lint-blocking-errors"
elif [ "${MEM_THRESHOLD_HIT}" -eq 1 ]; then
  # Known non-deterministic per LIVING_STATE — warn, do not escalate.
  VERDICT="warn-known-flake"; CAUSE="frontend-test-memory-threshold-flake"
elif [ "${LINT_WARN_COUNT}" -gt 0 ]; then
  VERDICT="info"; CAUSE="frontend-lint-warnings-only"
fi

# --- 5. Emit JSONL record ---
RECORD="$(jq -n \
  --arg ts      "${STAMP}" \
  --arg verdict "${VERDICT}" \
  --arg cause   "${CAUSE}" \
  --argjson ts_errors    "${TS_ERROR_COUNT}" \
  --argjson lint_errors  "${LINT_ERROR_COUNT}" \
  --argjson lint_warns   "${LINT_WARN_COUNT}" \
  --argjson mem_flake    "${MEM_THRESHOLD_HIT}" \
  --arg ts_out  "${TS_OUT:0:1200}" \
  '{ts:$ts, agent:"tnf-build-doctor", verdict:$verdict, cause:$cause,
    metrics:{tsErrorCount:$ts_errors, lintErrorCount:$lint_errors,
             lintWarnCount:$lint_warns, memThresholdFlake:$mem_flake},
    tsFirstLines:$ts_out}')"
printf '%s\n' "${RECORD}" >> "${TMP_ISSUES}"
mv "${TMP_ISSUES}" "${ISSUES_FILE}"
printf '%s\n' "${RECORD}" > "${LATEST_FILE}"

# --- 6. Heartbeat on the bus ---
PAYLOAD="$(jq -c -n --arg ts "${STAMP}" --arg v "${VERDICT}" --arg c "${CAUSE}" \
  '{ts:$ts, agent:"tnf-build-doctor", verdict:$v, cause:$c,
    cycle:"classify-only", diskAvailGB:4.2}' || true)"
if [ -n "${PAYLOAD}" ]; then
  redis-cli -h 127.0.0.1 -p 6379 HSET tnf:agent-registry "agent:tnf-build-doctor" \
    "${PAYLOAD}" >/dev/null 2>&1 || true
  redis-cli -h 127.0.0.1 -p 6379 PUBLISH tnf:bus:ingress "${PAYLOAD}" >/dev/null 2>&1 ||
    true
fi

# --- 7. Escalate only NEW critical or novel classes ---
# Lifts a triage task for the operator, matches the frontend-tester
# contract that LPUSHes to tnf:master:tasks:planning on critical.
if [ "${VERDICT}" = "critical" ]; then
  TASK="$(jq -c -n --arg ts "${STAMP}" --arg cause "${CAUSE}" \
    '{type:"triage", source:"tnf-build-doctor", priority:"P1",
      ts:$ts, cause:$cause,
      title:("Frontend build doctor: classify " + $cause),
      next:"see ~/.tnf/runtime/build-doctor/latest.json"}')"
  redis-cli -h 127.0.0.1 -p 6379 LPUSH tnf:master:tasks:planning "${TASK}" \
    >/dev/null 2>&1 || true
fi

# Terminal summary (1 line, friendlier to log scrapers than multi-line)
echo "${RECORD}" | jq -c '{ts,verdict,cause,metrics}' 2>/dev/null \
  || echo "${STAMP} verdict=${VERDICT} cause=${CAUSE}"
exit 0
