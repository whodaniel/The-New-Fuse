#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="${TNF_ROOT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

while true; do
  # Configuration drift check
  "$SCRIPT_DIR/check-config.sh"
  # Provider health check
  "$SCRIPT_DIR/check-provider.sh"
  # Credential check
  "$SCRIPT_DIR/check-credential.sh"
  # Relay connectivity
  "$SCRIPT_DIR/check-relay.sh"
  # Skill integrity
  "$SCRIPT_DIR/check-skill.sh"
  # Task lifecycle
  "$SCRIPT_DIR/check-tasks.sh"
  # Heartbeat every 30s
  echo 'PING' >> "$BASE/heartbeats.log"
  sleep 30
done
