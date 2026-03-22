#!/usr/bin/env bash
set -euo pipefail

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
