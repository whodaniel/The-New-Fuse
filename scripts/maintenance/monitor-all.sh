#!/bin/bash
while true; do
  # Configuration drift check
  ./check-config.sh
  # Provider health check
  ./check-provider.sh
  # Credential check
  ./check-credential.sh
  # Relay connectivity
  ./check-relay.sh
  # Skill integrity
  ./check-skill.sh
  # Task lifecycle
  ./check-tasks.sh
  # Heartbeat every 30s
  echo 'PING' >> /Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/heartbeats.log
  sleep 30
done