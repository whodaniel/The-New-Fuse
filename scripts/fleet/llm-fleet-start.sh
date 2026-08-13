#!/bin/bash
# TNF Free LLM API Fleet Supervisor
# Runs all three tiers of the LLM discovery fleet

cd "$(dirname "$0")/../../"

export TNF_FLEET_MODE=background
export AGENT_HEARTBEAT_FILE=".agent/fleet/llm/heartbeat.json"

mkdir -p .agent/fleet/llm-endpoints/{unvalidated,tested,active,dead}

echo "[$(date)] Starting TNF Free LLM API Fleet"

# Ensure we are in TNF repo
if [ ! -f AGENTS.md ]; then
  echo "ERROR: Not running from TNF repository root"
  exit 1
fi

# Start scout agent if not running
if ! pgrep -f "scout:llm-discovery" > /dev/null; then
  echo "Starting Scout Agent (Tier 1: Discovery)"
  node packages/tnf-cli/dist/agent.js run scout-llm-discovery --supervisor --interval 1320 &
  echo $! > .agent/fleet/llm/scout.pid
fi

# Start tester agent if not running
if ! pgrep -f "tester:llm-endpoints" > /dev/null; then
  echo "Starting Tester Agent (Tier 2: Endpoint Testing)"
  node packages/tnf-cli/dist/agent.js run tester-llm-endpoints --supervisor --interval 660 &
  echo $! > .agent/fleet/llm/tester.pid
fi

# Start validation worker if not running
if ! pgrep -f "worker:llm-validation" > /dev/null; then
  echo "Starting Validation Worker Agent (Tier 3: Full Agent Validation)"
  node packages/tnf-cli/dist/agent.js run worker-llm-validation --supervisor --continuous &
  echo $! > .agent/fleet/llm/worker.pid
fi

echo "✅ All three LLM Fleet agents running"
echo "  Scout:    $(cat .agent/fleet/llm/scout.pid)"
echo "  Tester:   $(cat .agent/fleet/llm/tester.pid)"
echo "  Worker:   $(cat .agent/fleet/llm/worker.pid)"
echo ""
echo "Status: tnf fleet status llm"
echo "Stop:   tnf fleet stop llm"

# Write heartbeat
cat > "$AGENT_HEARTBEAT_FILE" <<EOF
{
  "started": "$(date -Is)",
  "status": "running",
  "agents": {
    "scout": $(cat .agent/fleet/llm/scout.pid),
    "tester": $(cat .agent/fleet/llm/tester.pid),
    "worker": $(cat .agent/fleet/llm/worker.pid)
  }
}
EOF

exit 0