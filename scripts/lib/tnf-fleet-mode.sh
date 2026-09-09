#!/usr/bin/env bash
# tnf-fleet-mode.sh — Bash sourceable fleet-mode gate, mirrors
# scripts/lib/tnf-fleet-mode.cjs's semantics for bash-only daemons that
# have no Node runtime readily available (or for cheap, dependency-free
# checks at the very top of a script before anything heavier loads).
#
# Usage:
#   source scripts/lib/tnf-fleet-mode.sh
#   if tnf_fleet_paused; then exit 0; fi          # blunt: skip ALL autonomous work
#   if tnf_fleet_injection_paused; then ...; fi     # graded: skip only keystroke/prompt injection
#
# Reads the same ~/.tnf/fleet/mode.json file the Node module writes/reads.
# A missing file means "never paused" -> not paused (matches the .cjs
# module). A file that exists but fails to parse fails SAFE to paused,
# same fail-safe-not-fail-open principle as the .cjs module — for an
# operator kill-switch, uncertainty must resolve to the safer state.

TNF_FLEET_MODE_FILE="${HOME}/.tnf/fleet/mode.json"

# Prints the resolved mode ('running'|'paused'|'injection-paused') to stdout.
# Never fails/exits — a corrupt or unreadable (but present) file resolves to
# 'paused'; a missing file resolves to 'running'.
tnf_fleet_read_mode() {
  if [[ ! -f "${TNF_FLEET_MODE_FILE}" ]]; then
    echo "running"
    return 0
  fi
  local mode
  mode="$(node -e "
    try {
      const raw = require('fs').readFileSync(process.argv[1], 'utf8');
      const parsed = JSON.parse(raw);
      const valid = new Set(['running', 'paused', 'injection-paused']);
      process.stdout.write(valid.has(parsed.mode) ? parsed.mode : 'running');
    } catch (e) {
      process.stdout.write('paused');
    }
  " "${TNF_FLEET_MODE_FILE}" 2>/dev/null)"
  if [[ -z "${mode}" ]]; then
    # node itself failed to run (missing binary, etc.) — fail safe.
    echo "paused"
    return 0
  fi
  echo "${mode}"
}

# Returns 0 (true, shell success) if the fleet is fully paused.
#
# With no argument this is the original blunt gate, unchanged. Pass "high" to
# ask for priority admission through a LOAD-INDUCED pause — that path
# delegates to tnf-fleet-mode.cjs's fleetAdmission() rather than reimplementing
# the rule here, because two copies of an admission decision drift and the
# quiet half is always the one still letting work through. If node or the
# module is unavailable, this falls back to the blunt gate (fail safe: paused).
tnf_fleet_paused() {
  local priority="${1:-normal}"
  local mode
  mode="$(tnf_fleet_read_mode)"
  if [[ "${mode}" != "paused" ]]; then
    return 1
  fi
  if [[ "${priority}" != "high" ]]; then
    return 0
  fi

  local lib_dir admit
  lib_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  admit="$(node -e "
    try {
      const m = require(process.argv[1] + '/tnf-fleet-mode.cjs');
      process.stdout.write(m.fleetAdmission({ priority: 'high' }).admit ? 'admit' : 'deny');
    } catch (e) {
      process.stdout.write('deny');
    }
  " "${lib_dir}" 2>/dev/null)"
  [[ "${admit}" != "admit" ]]
}

# Returns 0 (true) if injection-class operations are paused
# (mode is 'paused' OR 'injection-paused').
tnf_fleet_injection_paused() {
  local mode
  mode="$(tnf_fleet_read_mode)"
  [[ "${mode}" == "paused" || "${mode}" == "injection-paused" ]]
}
