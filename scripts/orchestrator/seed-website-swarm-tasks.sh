#!/usr/bin/env bash

set -euo pipefail

QUEUE_KEY="${QUEUE_KEY:-tnf:master:tasks:pending}"
CHANNEL_ID="${BLUE_CHANNEL_ID:-channel-1771603937514}"

# Endpoint authority (#176): task copy references the live public host from
# the generated adaptive harness context instead of a local literal.
# shellcheck disable=SC1091
. "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/scripts/runtime/harness-context-env.sh"
TNF_PUBLIC_HOST="$(harness_ctx_get TNF_PUBLIC_BASE https://thenewfuse.com | sed -E 's#^https?://##; s#/$##')"

seed_task() {
  title="$1"
  lane="$2"
  owner_hint="$3"
  payload="$(cat <<JSON
{"id":"task-$(date +%s)-$RANDOM","title":"${title}","lane":"${lane}","ownerHint":"${owner_hint}","priority":"high","status":"pending","createdAt":"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"}
JSON
)"
  redis-cli LPUSH "${QUEUE_KEY}" "${payload}" >/dev/null
}

seed_task "Publish live backend health/agent telemetry cards on ${TNF_PUBLIC_HOST} homepage" "web-observability" "OpenClaw-local"
seed_task "Expose adaptive LLM routing status + active provider/model in admin and public ops views" "routing-visibility" "OpenClaw-remote"
seed_task "Map extension relay participants to channel-scoped capability matrix (Blue lane)" "federation-mapping" "gemini.google.com"
seed_task "Create evidence panel for relay/orchestrator/super-cycle states with last heartbeat and stale indicators" "control-plane-ui" "aistudio.google.com"

echo "[seed-website-swarm-tasks] queued tasks in ${QUEUE_KEY}"
redis-cli LLEN "${QUEUE_KEY}"

if command -v node >/dev/null 2>&1; then
  BLUE_CHANNEL_ID="${CHANNEL_ID}" node scripts/orchestrator/seed-blue-swarm.cjs >/dev/null 2>&1 || true
fi

echo "[seed-website-swarm-tasks] blue-lane kickoff broadcast sent"
