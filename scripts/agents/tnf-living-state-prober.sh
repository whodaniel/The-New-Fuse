#!/usr/bin/env bash
# tnf-living-state-prober.sh — LIVING_STATE Operator Queue Anchorer
#
# PURPOSE
#   Extract the operator-deferred, operator-action, and warn-tier items
#   that LIVING_STATE.md currently carries. These are the items that
#   the next operator handshake needs to action — and which an
#   autonomous agent must NEVER silently action on its own.
#
#   The output is a tiny, stable JSON summary so the operator can read
#   the current defer-list in one beat (no scrolling) and so the
#   autonomous layers can confirm "the gates we honor are still
#   exactly these N items" without re-parsing the full document.
#
# SCOPE (the markers LIVING_STATE actually uses)
#   ⚠️  WARN      -> surfaced, no escalation
#   🔑  KEY       -> operator-action required, never silent
#   ⏳  DEFER     -> awaiting operator decision/handoff
#
# OUTPUT
#   ~/.tnf/runtime/living-state-prober/deferred-latest.json
#   PUBLISH                    tnf:bus:ingress  (heartbeat; no actions)
#
# AUTH
#   Read-only. Honors fleet-pause. No LLM. No log spam.

set -euo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/scripts/lib/tnf-fleet-mode.sh"
if tnf_fleet_paused; then
  echo '{"ok":true,"skipped":"fleet-paused"}'
  exit 0
fi

export PATH="/usr/local/bin:/opt/homebrew/bin:${PATH}"

STAMP="$(date -u +%Y%m%dT%H-%M-%SZ)"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LIVING_STATE="${REPO_ROOT}/docs/protocols/LIVING_STATE.md"
STATE_DIR="${HOME}/.tnf/runtime/living-state-prober"
LATEST="${STATE_DIR}/deferred-latest.json"
mkdir -p "${STATE_DIR}"

if [ ! -f "${LIVING_STATE}" ]; then
  jq -n --arg ts "${STAMP}" \
    '{ts:$ts, agent:"tnf-living-state-prober", error:"LIVING_STATE.md not found"}' \
    > "${LATEST}"
  exit 0
fi

# --- Extract marker-tagged lines. LIVING_STATE uses ⚠️ 🔑 ⏳ to flag
#     operator-deferred, operator-action, and warn-tier items. These
#     characters can appear at the start of any line (the canonical case
#     is `- [⚠️] …` for a markdown checkbox, but they also appear inside
#     numbered/bulleted lists and free-form notes). Match anytime the
#     paired marker occurs to avoid silent drops.
WARN_LINES="$(grep -E '\[⚠️\]|⚠️' "${LIVING_STATE}" || true)"
KEY_LINES="$( grep -E '\[🔑\]|🔑' "${LIVING_STATE}" || true)"
DEFER_LINES="$(grep -E '\[⏳\]|⏳' "${LIVING_STATE}" || true)"

# Snapshot counts (these are the "gates I honor" truth for this cycle)
WARN_N="$(printf '%s\n' "${WARN_LINES}"  | grep -c . || true)"
KEY_N="$( printf '%s\n' "${KEY_LINES}"   | grep -c . || true)"
DEFER_N="$(printf '%s\n' "${DEFER_LINES}" | grep -c . || true)"

# --- Compose one-line previews (truncated to keep payload slim) ---
# Strip the leading checkbox / list-marker tokens so the preview is the
# plain text after the marker.
warn_array="$(printf '%s\n' "${WARN_LINES}"  | head -5 | awk '{$1=$2=$3=$4=""; print substr($0,5,200)}' | sed 's/^ //' | jq -R . | jq -s 'map(select(length>0))')"
key_array="$( printf '%s\n' "${KEY_LINES}"   | head -5 | awk '{$1=$2=$3=$4=""; print substr($0,5,200)}' | sed 's/^ //' | jq -R . | jq -s 'map(select(length>0))')"
defer_array="$(printf '%s\n' "${DEFER_LINES}" | head -5 | awk '{$1=$2=$3=$4=""; print substr($0,5,200)}' | sed 's/^ //' | jq -R . | jq -s 'map(select(length>0))')"

# --- Persist + heartbeat ---
RECORD="$(jq -n \
  --arg ts       "${STAMP}" \
  --argjson wn   "${WARN_N}" \
  --argjson kn   "${KEY_N}" \
  --argjson dn   "${DEFER_N}" \
  --argjson w    "${warn_array}" \
  --argjson k    "${key_array}" \
  --argjson d    "${defer_array}" \
  '{ts:$ts, agent:"tnf-living-state-prober",
    counts:{warn:$wn, operatorKey:$kn, deferred:$dn},
    previews:{warn:$w, operatorKey:$k, deferred:$d},
    note:"Read-only anchors of operator-deferred gates; never auto-actioned"}')"
printf '%s\n' "${RECORD}" > "${LATEST}"

# Heartbeat: emit a small summary only (no previews on the bus).
PAYLOAD="$(jq -c -n --arg ts "${STAMP}" --argjson w "${WARN_N}" --argjson k "${KEY_N}" --argjson d "${DEFER_N}" \
  '{ts:$ts, agent:"tnf-living-state-prober", warn:$w, operatorKey:$k, deferred:$d, cycle:"read-only"}' \
  2>/dev/null || true)"
if [ -n "${PAYLOAD}" ]; then
  redis-cli -h 127.0.0.1 -p 6379 HSET tnf:agent-registry "agent:tnf-living-state-prober" \
    "${PAYLOAD}" >/dev/null 2>&1 || true
  redis-cli -h 127.0.0.1 -p 6379 PUBLISH tnf:bus:ingress "${PAYLOAD}" >/dev/null 2>&1 \
    || true
fi

echo "${RECORD}" | jq -c '{ts,counts}' 2>/dev/null \
  || echo "${STAMP} warn=${WARN_N} key=${KEY_N} defer=${DEFER_N}"
exit 0
