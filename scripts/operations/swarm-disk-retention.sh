#!/usr/bin/env bash
# Safe TNF swarm disk retention — logs/history only; never deletes live state or node_modules.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TNF_HOME="${TNF_HOME:-$HOME/.tnf}"
RETENTION_DAYS="${TNF_SWARM_LOG_RETENTION_DAYS:-14}"
HEARTBEAT_HISTORY_KEEP="${TNF_HEARTBEAT_HISTORY_KEEP:-200}"
HEARTBEAT_JSONL_LINES="${TNF_HEARTBEAT_JSONL_LINES:-500}"

echo "[swarm-disk-retention] root=${ROOT_DIR} retentionDays=${RETENTION_DAYS}"

# Read-only growth inventory before any pruning (feeds ~/.tnf/growth-audit + JSONL history)
if [[ -f "${ROOT_DIR}/scripts/operations/tnf-growth-audit.cjs" ]]; then
  node "${ROOT_DIR}/scripts/operations/tnf-growth-audit.cjs" --quiet || \
    echo "[swarm-disk-retention] growth-audit warning (non-fatal, exit=$?)"
fi

prune_dir() {
  local dir="$1"
  local label="$2"
  if [[ -d "$dir" ]]; then
    local before after removed
    before="$(find "$dir" -type f 2>/dev/null | wc -l | tr -d ' ')"
    find "$dir" -type f -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true
    after="$(find "$dir" -type f 2>/dev/null | wc -l | tr -d ' ')"
    removed=$((before - after))
    echo "[swarm-disk-retention] ${label}: removed ${removed} file(s) older than ${RETENTION_DAYS}d (${dir})"
  fi
}

truncate_log() {
  local file="$1"
  local lines="$2"
  if [[ -f "$file" ]]; then
    tail -n "$lines" "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
    echo "[swarm-disk-retention] truncated $(basename "$file") to last ${lines} lines"
  fi
}

# Git orphaned pack files from interrupted repack/gc
if [[ -d "${ROOT_DIR}/.git/objects/pack" ]]; then
  find "${ROOT_DIR}/.git/objects/pack" -maxdepth 1 -type f -name 'tmp_pack_*' -size +0c -print -delete 2>/dev/null || true
fi

# Terminal heartbeat — biggest swarm log offender
HB_STATE="${TNF_HOME}/terminal-heartbeat/state"
if [[ -d "${HB_STATE}/history" ]]; then
  _hb_count="$(find "${HB_STATE}/history" -type f 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "${_hb_count}" -gt "${HEARTBEAT_HISTORY_KEEP}" ]]; then
    find "${HB_STATE}/history" -type f -print0 2>/dev/null \
      | xargs -0 ls -t 2>/dev/null \
      | tail -n +"$((HEARTBEAT_HISTORY_KEEP + 1))" \
      | xargs rm -f 2>/dev/null || true
    echo "[swarm-disk-retention] heartbeat history capped at ${HEARTBEAT_HISTORY_KEEP} files (was ${_hb_count})"
  fi
fi
truncate_log "${HB_STATE}/terminal-heartbeat-history.jsonl" "${HEARTBEAT_JSONL_LINES}"
rm -f "${HB_STATE}/terminal-heartbeat-history.jsonl.tmp"

prune_dir "${TNF_HOME}/logs" "tnf logs"
prune_dir "${TNF_HOME}/wrapper-logs" "wrapper logs"
prune_dir "${TNF_HOME}/relay-monitor" "relay monitor"
prune_dir "${TNF_HOME}/poll-jobs" "poll jobs"
prune_dir "${ROOT_DIR}/.agent/runtime-logs" "runtime logs"
prune_dir "${HOME}/.hermes/cron/output" "hermes cron output"
prune_dir "${HOME}/.hermes/logs" "hermes logs"

truncate_log "${TNF_HOME}/federation-watchdog-relay.log" 1000
truncate_log "${TNF_HOME}/voice-watchdog.log" 1000
truncate_log "${ROOT_DIR}/docs/operations/tnf-full-auto-daemon.log" 2000
truncate_log "${ROOT_DIR}/.agent/runtime-logs/factory-supervisor.log" 2000

# --- Full Enchilada hygiene (2026-08-09): swarm-context flood + fat journals ---
SWARM_CONTEXT_HISTORY_KEEP="${TNF_SWARM_CONTEXT_HISTORY_KEEP:-0}"
SWARM_CONTEXT_CANONICAL="${TNF_SWARM_CONTEXT_PATH:-${TNF_HOME}/swarm-context.md}"
SWARM_CONTEXT_DIR="$(dirname "${SWARM_CONTEXT_CANONICAL}")"
SWARM_CONTEXT_BASE="$(basename "${SWARM_CONTEXT_CANONICAL}" .md)"
AUTOPILOT_HISTORY_LINES="${TNF_AUTOPILOT_HISTORY_LINES:-2000}"
AUTHORITY_AUDIT_LINES="${TNF_AUTHORITY_AUDIT_LINES:-2000}"

# Cap timestamped swarm-context-*.md history (canonical file is never deleted)
if [[ -d "${SWARM_CONTEXT_DIR}" ]]; then
  _sc_count="$(find "${SWARM_CONTEXT_DIR}" -maxdepth 1 -type f -name "${SWARM_CONTEXT_BASE}-*.md" 2>/dev/null | wc -l | tr -d ' ')"
  if [[ "${_sc_count}" -gt "${SWARM_CONTEXT_HISTORY_KEEP}" ]]; then
    if [[ "${SWARM_CONTEXT_HISTORY_KEEP}" -eq 0 ]]; then
      find "${SWARM_CONTEXT_DIR}" -maxdepth 1 -type f -name "${SWARM_CONTEXT_BASE}-*.md" -delete 2>/dev/null || true
      echo "[swarm-disk-retention] swarm-context history removed (${_sc_count} file(s); keep=0)"
    else
      find "${SWARM_CONTEXT_DIR}" -maxdepth 1 -type f -name "${SWARM_CONTEXT_BASE}-*.md" -print0 2>/dev/null \
        | xargs -0 ls -t 2>/dev/null \
        | tail -n +"$((SWARM_CONTEXT_HISTORY_KEEP + 1))" \
        | xargs rm -f 2>/dev/null || true
      echo "[swarm-disk-retention] swarm-context history capped at ${SWARM_CONTEXT_HISTORY_KEEP} (was ${_sc_count})"
    fi
  else
    echo "[swarm-disk-retention] swarm-context history ok (${_sc_count} ≤ keep ${SWARM_CONTEXT_HISTORY_KEEP})"
  fi
fi

truncate_log "${TNF_HOME}/subdirector-autopilot/state/subdirector-autopilot-history.jsonl" "${AUTOPILOT_HISTORY_LINES}"
truncate_log "${TNF_HOME}/authority/audit.jsonl" "${AUTHORITY_AUDIT_LINES}"

# Scrub PEM bodies from Sub-Director heartbeat if an older runtime leaked them
HB_JSON="${TNF_HOME}/local-subdirector/state/local-subdirector-heartbeat.json"
if [[ -f "${HB_JSON}" ]] && command -v python3 >/dev/null 2>&1; then
  python3 - "${HB_JSON}" <<'PY' || echo "[swarm-disk-retention] heartbeat PEM scrub warning (non-fatal)"
import json, sys
from pathlib import Path
p = Path(sys.argv[1])
try:
    data = json.loads(p.read_text())
except Exception as e:
    print(f"[swarm-disk-retention] heartbeat scrub skip: {e}")
    raise SystemExit(0)
cfg = data.get("config")
if not isinstance(cfg, dict):
    raise SystemExit(0)
changed = False
for key in ("signingPrivateKeyPem", "encryptionPrivateKeyPem"):
    val = cfg.get(key)
    if isinstance(val, str) and "BEGIN" in val:
        configured = bool(val.strip())
        cfg.pop(key, None)
        flag = "signingKeyConfigured" if key.startswith("signing") else "encryptionKeyConfigured"
        cfg[flag] = configured
        changed = True
if changed:
    tmp = p.with_suffix(p.suffix + ".scrub.tmp")
    tmp.write_text(json.dumps(data, indent=2) + "\n")
    tmp.replace(p)
    print("[swarm-disk-retention] scrubbed PEM bodies from local-subdirector-heartbeat.json")
else:
    print("[swarm-disk-retention] heartbeat JSON has no PEM bodies")
PY
fi

# Package caches (deduped; safe to prune unused)
if command -v pnpm >/dev/null 2>&1; then
  pnpm store prune >/dev/null 2>&1 || true
  echo "[swarm-disk-retention] pnpm store prune complete"
fi
if command -v npm >/dev/null 2>&1; then
  npm cache clean --force >/dev/null 2>&1 || true
  echo "[swarm-disk-retention] npm cache clean complete"
fi

# Hermes state.db ghosts, backups, snapshots, master-clock rotation
if [[ -f "${ROOT_DIR}/scripts/operations/hermes-state-retention.cjs" ]]; then
  node "${ROOT_DIR}/scripts/operations/hermes-state-retention.cjs" || \
    echo "[swarm-disk-retention] hermes-state-retention warning (non-fatal)"
fi

df -h /System/Volumes/Data 2>/dev/null | tail -1 || df -h / | tail -1
echo "[swarm-disk-retention] complete"
