#!/bin/bash
# Monitor agent connections to relay in real-time

echo "🔍 Monitoring Relay Agent Connections"
echo "======================================="
echo ""
echo "Press Ctrl+C to stop"
echo ""

while true; do
  clear
  echo "🔍 TNF Relay Agent Monitor - $(date '+%H:%M:%S')"
  echo "======================================="
  echo ""

  # Get health status
  health=$(curl -s http://localhost:3001/health 2>/dev/null)
  if [ $? -eq 0 ]; then
    echo "✅ Relay Status: ONLINE"
    echo "$health" | jq -r '"Uptime: \(.uptime | floor)s | Agents: \(.agents) | Channels: \(.channels)"'
    echo ""
  else
    echo "❌ Relay Status: OFFLINE"
    echo ""
    exit 1
  fi

  # List connected agents
  echo "📡 Connected Agents:"
  echo "-------------------"
  agents=$(curl -s http://localhost:3001/agents 2>/dev/null)

  if [ $? -eq 0 ]; then
    echo "$agents" | jq -r '.[] | "  \(.id[0:30])... - \(.name) (\(.platform)) - \(.status)"'

    agent_count=$(echo "$agents" | jq '. | length')
    echo ""
    echo "Total: $agent_count agents"
  else
    echo "  (Unable to fetch agents)"
  fi

  echo ""
  echo "🔄 Refreshing in 2 seconds..."
  sleep 2
done
