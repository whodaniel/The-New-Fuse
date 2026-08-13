#!/usr/bin/env bash
set -euo pipefail

# --- Fleet-wide pause gate (2026-07-21) ---
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/scripts/lib/tnf-fleet-mode.sh"
if tnf_fleet_paused; then
  echo '{"ok":true,"skipped":"fleet-paused"}'
  exit 0
fi


ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "🚀 TNF Terminal Harness: Initializing Standard Processes..."

# 1. Relay Monitor
echo "📡 Starting Relay Monitor..."
bash "$ROOT_DIR/scripts/runtime/relay-monitor-service.sh" install

# 2. Terminal Heartbeat (Cron)
echo "💓 Installing Universal Heartbeat..."
bash "$ROOT_DIR/scripts/runtime/terminal-heartbeat-cron.sh" install

# 3. Director Loop (Cron)
echo "🧠 Installing Autonomous Director Loop..."
bash "$ROOT_DIR/scripts/runtime/tnf-director-cron.sh" install

echo "✅ TNF Terminal Harness: All processes started standard."
