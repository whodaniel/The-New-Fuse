#!/usr/bin/env bash
set -euo pipefail

MODE="json"
LOG_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --one-line)
      MODE="one-line"
      shift
      ;;
    --self-prompt)
      MODE="self-prompt"
      shift
      ;;
    --log-file)
      LOG_FILE="${2:-}"
      if [[ -z "$LOG_FILE" ]]; then
        echo "missing value for --log-file" >&2
        exit 2
      fi
      shift 2
      ;;
    *)
      echo "unknown option: $1" >&2
      echo "usage: $0 [--one-line|--self-prompt] [--log-file <path>]" >&2
      exit 2
      ;;
  esac
done

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required" >&2
  exit 2
fi

add_unique() {
  local value="$1"
  shift || true
  local item
  for item in "$@"; do
    [[ "$item" == "$value" ]] && return 0
  done
  return 1
}

now_iso() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

file_age_seconds() {
  local file_path="$1"
  local mtime
  if [[ ! -f "$file_path" ]]; then
    echo "-1"
    return
  fi
  mtime="$(stat -f %m "$file_path" 2>/dev/null || stat -c %Y "$file_path" 2>/dev/null || echo "")"
  if [[ -z "$mtime" ]]; then
    echo "-1"
    return
  fi
  echo "$(( $(date +%s) - mtime ))"
}

normalize_integer() {
  local value="${1:-}"
  local fallback="${2:-0}"
  if [[ "$value" =~ ^-?[0-9]+$ ]]; then
    echo "$value"
  else
    echo "$fallback"
  fi
}

normalize_number() {
  local value="${1:-}"
  local fallback="${2:-0}"
  if [[ "$value" =~ ^-?[0-9]+([.][0-9]+)?$ ]]; then
    echo "$value"
  else
    echo "$fallback"
  fi
}

state_rank=0
reasons=()
actions=()

set_degraded() {
  if (( state_rank < 1 )); then
    state_rank=1
  fi
}

set_blocked() {
  state_rank=2
}

push_reason() {
  local reason="$1"
  if ! add_unique "$reason" "${reasons[@]:-}"; then
    reasons+=("$reason")
  fi
}

push_action() {
  local action="$1"
  if ! add_unique "$action" "${actions[@]:-}"; then
    actions+=("$action")
  fi
}

HOME_TNF="$HOME/.tnf"
MASTER_HEARTBEAT_STATE="$HOME_TNF/master-heartbeat/state/master-heartbeat-latest.json"
LOCAL_SUBDIRECTOR_STATE="$HOME_TNF/local-subdirector/state/local-subdirector-heartbeat.json"
TERMINAL_HEARTBEAT_STATE="$HOME_TNF/terminal-heartbeat/state/terminal-heartbeat-latest.json"
IDENTITY_REGISTRY="$HOME_TNF/session-discovery/terminal-identity-registry.json"
ROLE_MAP="$HOME_TNF/session-discovery/terminal-role-map.json"
FRONTLOAD_CACHE="$HOME_TNF/handoff-current.json"
OPENCLAW_LATEST="$HOME/.openclaw/workspace/handoff/LATEST.md"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
FRONTLOAD_VERIFY_SCRIPT="$SKILLS_ROOT/tnf-frontload-protocols/scripts/verify_frontload_state.sh"

required_files=(
  "$MASTER_HEARTBEAT_STATE"
  "$LOCAL_SUBDIRECTOR_STATE"
  "$TERMINAL_HEARTBEAT_STATE"
  "$IDENTITY_REGISTRY"
  "$ROLE_MAP"
)

for required in "${required_files[@]}"; do
  if [[ ! -f "$required" ]]; then
    push_reason "required runtime artifact missing: $required"
    push_action "restore-runtime-artifact"
    set_blocked
  fi
done

master_status="unknown"
local_subdirector_status="unknown"
terminal_heartbeat_status="unknown"
owner_count=0
owner_agents_csv=""
owner_observed_count=0
forced_targets=0
resolved_sidecars_csv=""
sidecar_skipped_reason=""
sidecar_hold_elapsed=0
non_sidecar_trigger_mode="unknown"

if [[ -f "$MASTER_HEARTBEAT_STATE" ]]; then
  master_status="$(jq -r '.status // "unknown"' "$MASTER_HEARTBEAT_STATE" 2>/dev/null || echo "unknown")"
fi
if [[ -f "$LOCAL_SUBDIRECTOR_STATE" ]]; then
  local_subdirector_status="$(
    jq -r '.status // "unknown"' "$LOCAL_SUBDIRECTOR_STATE" 2>/dev/null || echo "unknown"
  )"
fi
if [[ -f "$TERMINAL_HEARTBEAT_STATE" ]]; then
  terminal_heartbeat_status="$(
    jq -r '.status // "unknown"' "$TERMINAL_HEARTBEAT_STATE" 2>/dev/null || echo "unknown"
  )"
  forced_targets="$(
    jq -r '.summary.forcedTargets // 0' "$TERMINAL_HEARTBEAT_STATE" 2>/dev/null || echo "0"
  )"
  resolved_sidecars_csv="$(
    jq -r '.routing.resolvedAlwaysInjectAgentIds // [] | join(",")' "$TERMINAL_HEARTBEAT_STATE" 2>/dev/null || echo ""
  )"
  sidecar_skipped_reason="$(
    jq -r '.targets[]? | select(.routeMode=="sidecar-forced") | .skippedReason // empty' \
      "$TERMINAL_HEARTBEAT_STATE" 2>/dev/null | head -n 1
  )"
  sidecar_hold_elapsed="$(
    jq -r '.targets[]? | select(.routeMode=="sidecar-forced") | .sidecarHoldElapsedSeconds // 0' \
      "$TERMINAL_HEARTBEAT_STATE" 2>/dev/null | head -n 1
  )"
  non_sidecar_trigger_mode="$(
    jq -r '[.functionalGaps[]? | capture("non-sidecar agents inject on (?<mode>[^;]+);")?.mode] | map(select(. != null)) | .[0] // "unknown"' \
      "$TERMINAL_HEARTBEAT_STATE" 2>/dev/null || echo "unknown"
  )"
fi
if [[ -f "$IDENTITY_REGISTRY" ]]; then
  owner_count="$(
    jq -r '[.sessions | to_entries[] | select(.value.isLocalSubdirectorOwner==true)] | length' \
      "$IDENTITY_REGISTRY" 2>/dev/null || echo "0"
  )"
  owner_agents_csv="$(
    jq -r '[.sessions | to_entries[] | select(.value.isLocalSubdirectorOwner==true) | .key] | join(",")' \
      "$IDENTITY_REGISTRY" 2>/dev/null || echo ""
  )"
fi

owner_count="$(normalize_integer "$owner_count" "0")"
forced_targets="$(normalize_integer "$forced_targets" "0")"
sidecar_hold_elapsed="$(normalize_number "$sidecar_hold_elapsed" "0")"

if [[ -f "$TERMINAL_HEARTBEAT_STATE" && -n "$owner_agents_csv" ]]; then
  owner_observed_count="$(
    jq -r --arg owners "$owner_agents_csv" '
      ($owners | split(",") | map(select(length > 0))) as $ownerIds
      | [.observed[]?.agentId | select(. as $id | $ownerIds | index($id))] | length
    ' "$TERMINAL_HEARTBEAT_STATE" 2>/dev/null || echo "0"
  )"
fi
owner_observed_count="$(normalize_integer "$owner_observed_count" "0")"

case "$master_status" in
  healthy|skipped-locked)
    ;;
  *)
    push_reason "master-heartbeat status is $master_status"
    push_action "restart-master-heartbeat-service"
    set_degraded
    ;;
esac

case "$local_subdirector_status" in
  healthy)
    ;;
  *)
    push_reason "local-subdirector status is $local_subdirector_status"
    push_action "restart-local-subdirector-service"
    set_degraded
    ;;
esac

if [[ "$owner_count" -eq 0 ]]; then
  push_reason "no Local Sub-Director owner is declared in identity registry"
  push_action "assign-local-subdirector-owner"
  set_blocked
elif [[ "$owner_count" -gt 1 ]]; then
  push_reason "multiple Local Sub-Director owners detected: $owner_agents_csv"
  push_action "resolve-owner-collision"
  set_degraded
fi

if [[ "$owner_count" -ge 1 && "$owner_observed_count" -ge 1 && "${forced_targets%%.*}" -lt 1 ]]; then
  push_reason "forced sidecar owner was not targeted in latest heartbeat pulse"
  push_action "run-terminal-heartbeat-pulse"
  set_degraded
elif [[ "$owner_count" -ge 1 && "$owner_observed_count" -eq 0 ]]; then
  push_action "owner-terminal-not-currently-observed"
fi

if [[ -n "$owner_agents_csv" && -n "$resolved_sidecars_csv" ]]; then
  IFS=',' read -r -a owner_agents <<<"$owner_agents_csv"
  for owner in "${owner_agents[@]}"; do
    [[ -z "$owner" ]] && continue
    if [[ ",$resolved_sidecars_csv," != *",$owner,"* ]]; then
      push_reason "owner $owner is not resolved as sidecar route in heartbeat payload"
      push_action "refresh-identity-registry-and-heartbeat-routing"
      set_degraded
    fi
  done
fi

if [[ "$sidecar_skipped_reason" == "sidecar-user-active-hold" ]]; then
  push_action "wait-for-user-idle-before-sidecar-injection"
fi
if [[ "$sidecar_skipped_reason" == "sidecar-typing-hold" ]]; then
  push_action "preserve-typing-guard"
  if awk "BEGIN { exit !($sidecar_hold_elapsed >= 120) }"; then
    push_action "allow-one-failsafe-sidecar-pulse"
  fi
fi

frontload_status="healthy"
frontload_warn_count=0
frontload_output=""

if [[ -x "$FRONTLOAD_VERIFY_SCRIPT" ]]; then
  if frontload_output="$("$FRONTLOAD_VERIFY_SCRIPT" 2>&1)"; then
    frontload_status="healthy"
  else
    frontload_status="degraded"
    frontload_warn_count="$(printf "%s\n" "$frontload_output" | grep -c '^WARN:' || true)"
    push_reason "frontload verification reported warnings"
    push_action "repair-frontload-hooks"
    set_degraded
  fi
else
  frontload_status="unknown"
  push_reason "frontload verification script not found: $FRONTLOAD_VERIFY_SCRIPT"
  push_action "restore-frontload-verifier"
  set_degraded
fi

frontload_warn_count="$(normalize_integer "$frontload_warn_count" "0")"

frontload_cache_age="$(file_age_seconds "$FRONTLOAD_CACHE")"
openclaw_latest_age="$(file_age_seconds "$OPENCLAW_LATEST")"
frontload_cache_age="$(normalize_integer "$frontload_cache_age" "-1")"
openclaw_latest_age="$(normalize_integer "$openclaw_latest_age" "-1")"
handoff_history_count=0
handoff_id_marker_ok=0
handoff_timestamp_present=0
handoff_immediate_tasks_count=0

if [[ "$frontload_cache_age" -lt 0 ]]; then
  push_reason "frontload cache missing: $FRONTLOAD_CACHE"
  push_action "refresh-frontload-cache"
  set_degraded
elif [[ "$frontload_cache_age" -gt 86400 ]]; then
  push_reason "frontload cache is stale (>24h): $FRONTLOAD_CACHE"
  push_action "refresh-frontload-cache"
  set_degraded
fi

if [[ -f "$FRONTLOAD_CACHE" ]]; then
  handoff_history_count="$(
    jq -r 'if (.HANDOFF_HISTORY | type) == "array" then (.HANDOFF_HISTORY | length) else 0 end' \
      "$FRONTLOAD_CACHE" 2>/dev/null || echo "0"
  )"
  handoff_id_marker_ok="$(
    jq -r '
      if (.HANDOFF_HISTORY | type) == "array" and (.HANDOFF_HISTORY | length) > 0 then
        if ([.HANDOFF_HISTORY[] | tostring | contains("ID:")] | all) then 1 else 0 end
      else
        0
      end
    ' "$FRONTLOAD_CACHE" 2>/dev/null || echo "0"
  )"
  handoff_timestamp_present="$(
    jq -r 'if ((.UPDATED // .generatedAt // "") | tostring | length) > 0 then 1 else 0 end' \
      "$FRONTLOAD_CACHE" 2>/dev/null || echo "0"
  )"
  handoff_immediate_tasks_count="$(
    jq -r 'if (.IMMEDIATE_TASKS | type) == "array" then (.IMMEDIATE_TASKS | length) else 0 end' \
      "$FRONTLOAD_CACHE" 2>/dev/null || echo "0"
  )"
fi

handoff_history_count="$(normalize_integer "$handoff_history_count" "0")"
handoff_id_marker_ok="$(normalize_integer "$handoff_id_marker_ok" "0")"
handoff_timestamp_present="$(normalize_integer "$handoff_timestamp_present" "0")"
handoff_immediate_tasks_count="$(normalize_integer "$handoff_immediate_tasks_count" "0")"

if [[ "$handoff_history_count" -lt 1 ]]; then
  push_reason "prompt handoff history is empty in frontload cache"
  push_action "rebuild-handoff-history"
  set_degraded
fi

if [[ "$handoff_history_count" -gt 0 && "$handoff_id_marker_ok" -ne 1 ]]; then
  push_reason "prompt handoff entries missing ID markers"
  push_action "enforce-handoff-id-contract"
  set_degraded
fi

if [[ "$handoff_timestamp_present" -ne 1 ]]; then
  push_reason "frontload handoff cache is missing UPDATED/generatedAt timestamp"
  push_action "repair-handoff-timestamp-contract"
  set_degraded
fi

if [[ "$handoff_immediate_tasks_count" -lt 1 ]]; then
  push_action "refresh-frontload-immediate-tasks"
fi

if [[ "$openclaw_latest_age" -lt 0 ]]; then
  push_reason "OpenClaw handoff source missing: $OPENCLAW_LATEST"
  push_action "repair-openclaw-handoff-source"
  set_degraded
elif [[ "$openclaw_latest_age" -gt 86400 ]]; then
  push_reason "OpenClaw handoff source is stale (>24h): $OPENCLAW_LATEST"
  push_action "refresh-openclaw-handoff-source"
  set_degraded
fi

state="healthy"
if (( state_rank == 1 )); then
  state="degraded"
elif (( state_rank >= 2 )); then
  state="blocked"
fi

if [[ "$state" == "blocked" ]]; then
  push_action "request-local-subdirector-assistance-with-explicit-blocker"
fi

reasons_json="$(printf '%s\n' "${reasons[@]:-}" | jq -Rsc 'split("\n") | map(select(length > 0))')"
actions_json="$(printf '%s\n' "${actions[@]:-}" | jq -Rsc 'split("\n") | map(select(length > 0))')"
actions_compact="$(printf '%s\n' "${actions[@]:-}" | paste -sd',' -)"
[[ -z "$actions_compact" ]] && actions_compact="none"
[[ -z "$owner_agents_csv" ]] && owner_agents_csv="none"
[[ -z "$sidecar_skipped_reason" ]] && sidecar_skipped_reason="none"

handoff_log_state="weak"
if [[ "$handoff_history_count" -gt 0 && "$handoff_id_marker_ok" -eq 1 && "$handoff_timestamp_present" -eq 1 ]]; then
  handoff_log_state="healthy"
fi

self_prompt="TNF Sub-Director cycle: state=${state}; owner=${owner_agents_csv}; forcedTargets=${forced_targets}; sidecarReason=${sidecar_skipped_reason}; frontload=${frontload_status}; handoffLog=${handoff_log_state}; actions=${actions_compact}. Keep current coordination task focus and do not switch tasks."

json_payload="$(
  jq -n \
    --arg generatedAt "$(now_iso)" \
    --arg state "$state" \
    --arg masterStatus "$master_status" \
    --arg localSubdirectorStatus "$local_subdirector_status" \
    --arg terminalHeartbeatStatus "$terminal_heartbeat_status" \
    --arg ownerAgents "$owner_agents_csv" \
    --arg sidecarSkippedReason "$sidecar_skipped_reason" \
    --arg resolvedSidecars "$resolved_sidecars_csv" \
    --arg nonSidecarTriggerMode "$non_sidecar_trigger_mode" \
    --arg frontloadStatus "$frontload_status" \
    --arg frontloadOutput "$frontload_output" \
    --arg selfPrompt "$self_prompt" \
    --argjson ownerCount "$owner_count" \
    --argjson ownerObservedCount "$owner_observed_count" \
    --argjson forcedTargets "$forced_targets" \
    --argjson sidecarHoldElapsedSeconds "$sidecar_hold_elapsed" \
    --argjson frontloadWarnCount "$frontload_warn_count" \
    --argjson frontloadCacheAgeSeconds "$frontload_cache_age" \
    --argjson openclawLatestAgeSeconds "$openclaw_latest_age" \
    --argjson handoffHistoryCount "$handoff_history_count" \
    --argjson handoffIdMarkerOk "$handoff_id_marker_ok" \
    --argjson handoffTimestampPresent "$handoff_timestamp_present" \
    --argjson handoffImmediateTasksCount "$handoff_immediate_tasks_count" \
    --argjson reasons "$reasons_json" \
    --argjson actions "$actions_json" \
    '{
      generatedAt: $generatedAt,
      state: $state,
      checks: {
        masterHeartbeatStatus: $masterStatus,
        localSubdirectorStatus: $localSubdirectorStatus,
        terminalHeartbeatStatus: $terminalHeartbeatStatus,
        ownerCount: $ownerCount,
        ownerObservedCount: $ownerObservedCount,
        ownerAgentsCsv: $ownerAgents,
        forcedTargets: $forcedTargets,
        resolvedSidecarsCsv: $resolvedSidecars,
        sidecarSkippedReason: $sidecarSkippedReason,
        sidecarHoldElapsedSeconds: $sidecarHoldElapsedSeconds,
        nonSidecarTriggerMode: $nonSidecarTriggerMode,
        frontloadStatus: $frontloadStatus,
        frontloadWarnCount: $frontloadWarnCount,
        frontloadCacheAgeSeconds: $frontloadCacheAgeSeconds,
        openclawLatestAgeSeconds: $openclawLatestAgeSeconds,
        handoffHistoryCount: $handoffHistoryCount,
        handoffIdMarkerOk: ($handoffIdMarkerOk == 1),
        handoffTimestampPresent: ($handoffTimestampPresent == 1),
        handoffImmediateTasksCount: $handoffImmediateTasksCount
      },
      reasons: $reasons,
      actions: $actions,
      selfPrompt: $selfPrompt,
      frontloadVerifierOutput: $frontloadOutput
    }'
)"

if [[ -n "$LOG_FILE" ]]; then
  mkdir -p "$(dirname -- "$LOG_FILE")"
  printf '%s\n' "$(printf '%s' "$json_payload" | jq -c '.')" >> "$LOG_FILE"
fi

one_line="state=${state} owner=${owner_agents_csv} forcedTargets=${forced_targets} sidecarReason=${sidecar_skipped_reason} frontload=${frontload_status} handoffHistory=${handoff_history_count} actions=${actions_compact}"

case "$MODE" in
  one-line)
    printf '%s\n' "$one_line"
    ;;
  self-prompt)
    printf '%s\n' "$self_prompt"
    ;;
  *)
    printf '%s\n' "$json_payload"
    ;;
esac
