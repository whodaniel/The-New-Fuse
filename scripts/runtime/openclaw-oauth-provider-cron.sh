#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
POLL_CRON_SCRIPT="$ROOT_DIR/scripts/runtime/agent-poll-cron.sh"
RUNTIME_DIR="${TNF_OPENCLAW_OAUTH_RUNTIME_DIR:-$HOME/.tnf/openclaw-oauth-provider-autopilot}"
RUNTIME_PULSE_SCRIPT="$RUNTIME_DIR/scripts/runtime/agent-poll-pulse.cjs"

SYNC_JOB="tnf-openclaw-oauth-sync"
HEALTH_JOB="tnf-openclaw-cloud-health"

SYNC_SCHEDULE="${TNF_OPENCLAW_OAUTH_SYNC_SCHEDULE:-20 3 * * *}"
HEALTH_SCHEDULE="${TNF_OPENCLAW_OAUTH_HEALTH_SCHEDULE:-*/15 * * * *}"

SYNC_CMD="cd '$RUNTIME_DIR' && bash scripts/cloud_runtime/sync-openclaw-oauth-instances.sh --no-wait"
HEALTH_CMD="cd '$RUNTIME_DIR' && bash scripts/cloud_runtime/check-zeroclaw-instances.sh openclaw-cloud openclaw-primary openclaw-sandbox-cloud openclaw-oc004"

usage() {
  cat <<'EOF'
Usage:
  scripts/runtime/openclaw-oauth-provider-cron.sh install
  scripts/runtime/openclaw-oauth-provider-cron.sh uninstall
  scripts/runtime/openclaw-oauth-provider-cron.sh status
  scripts/runtime/openclaw-oauth-provider-cron.sh run-once

Env overrides:
  TNF_OPENCLAW_OAUTH_SYNC_SCHEDULE   (default: "20 3 * * *")
  TNF_OPENCLAW_OAUTH_HEALTH_SCHEDULE (default: "*/15 * * * *")
  TNF_OPENCLAW_OAUTH_RUNTIME_DIR (default: "$HOME/.tnf/openclaw-oauth-provider-autopilot")
  TNF_OPENCLAW_RUN_ONCE_HEALTH_RETRIES (default: "12")
  TNF_OPENCLAW_RUN_ONCE_HEALTH_RETRY_SLEEP_SEC (default: "30")
EOF
}

need_poll_script() {
  if [[ ! -x "$POLL_CRON_SCRIPT" ]]; then
    echo "Missing executable poll cron script: $POLL_CRON_SCRIPT" >&2
    exit 1
  fi
}

prepare_runtime_bundle() {
  local files=(
    "scripts/runtime/agent-poll-pulse.cjs"
    "scripts/cloud_runtime/sync-openclaw-oauth-instances.sh"
    "scripts/cloud_runtime/sync-openclaw-oauth-instance.sh"
    "scripts/cloud_runtime/sync-openclaw-codex-account.sh"
    "scripts/cloud_runtime/sync-openclaw-codex-tenants.sh"
    "scripts/cloud_runtime/check-zeroclaw-instances.sh"
    "scripts/cloud_runtime/openclaw-oauth-instances.json"
    "scripts/cloud_runtime/openclaw-codex-tenants.json"
  )
  local rel
  local src
  local dest

  for rel in "${files[@]}"; do
    src="$ROOT_DIR/$rel"
    dest="$RUNTIME_DIR/$rel"
    if [[ ! -f "$src" ]]; then
      echo "Missing bundle source file: $src" >&2
      exit 1
    fi
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
    if [[ "$rel" == *.sh ]]; then
      chmod +x "$dest"
    fi
  done
}

install_jobs() {
  need_poll_script
  prepare_runtime_bundle
  TNF_AGENT_POLL_WORKDIR="$RUNTIME_DIR" TNF_AGENT_POLL_PULSE_SCRIPT="$RUNTIME_PULSE_SCRIPT" \
    bash "$POLL_CRON_SCRIPT" install --job "$SYNC_JOB" --schedule "$SYNC_SCHEDULE" --command "$SYNC_CMD"
  TNF_AGENT_POLL_WORKDIR="$RUNTIME_DIR" TNF_AGENT_POLL_PULSE_SCRIPT="$RUNTIME_PULSE_SCRIPT" \
    bash "$POLL_CRON_SCRIPT" install --job "$HEALTH_JOB" --schedule "$HEALTH_SCHEDULE" --command "$HEALTH_CMD"
  echo "Installed OpenClaw OAuth sync + health poll jobs."
}

uninstall_jobs() {
  need_poll_script
  bash "$POLL_CRON_SCRIPT" uninstall --job "$SYNC_JOB"
  bash "$POLL_CRON_SCRIPT" uninstall --job "$HEALTH_JOB"
  echo "Removed OpenClaw OAuth sync + health poll jobs."
}

status_jobs() {
  need_poll_script
  echo "== OAuth Sync Job =="
  bash "$POLL_CRON_SCRIPT" status --job "$SYNC_JOB"
  echo
  echo "== Cloud Health Job =="
  bash "$POLL_CRON_SCRIPT" status --job "$HEALTH_JOB"
}

run_once() {
  local retries="${TNF_OPENCLAW_RUN_ONCE_HEALTH_RETRIES:-12}"
  local retry_sleep="${TNF_OPENCLAW_RUN_ONCE_HEALTH_RETRY_SLEEP_SEC:-30}"

  prepare_runtime_bundle

  (
    cd "$RUNTIME_DIR"
    bash scripts/cloud_runtime/sync-openclaw-oauth-instances.sh --no-wait
    local attempt=1
    while [ "$attempt" -le "$retries" ]; do
      if bash scripts/cloud_runtime/check-zeroclaw-instances.sh openclaw-cloud openclaw-primary openclaw-sandbox-cloud openclaw-oc004; then
        return 0
      fi
      if [ "$attempt" -lt "$retries" ]; then
        echo "Health verification retry ${attempt}/${retries} failed; waiting ${retry_sleep}s..."
        sleep "$retry_sleep"
      fi
      attempt=$((attempt + 1))
    done
    return 1
  )
}

case "${1:-}" in
  install)
    install_jobs
    ;;
  uninstall|remove)
    uninstall_jobs
    ;;
  status)
    status_jobs
    ;;
  run-once)
    run_once
    ;;
  *)
    usage
    ;;
esac
