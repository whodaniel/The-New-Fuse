#!/bin/sh
# Railway entrypoint for picoclaw - writes config from env vars then starts picoclaw

CONFIG_FILE="/root/.picoclaw/config.json"

# Create config directory
mkdir -p /root/.picoclaw/workspace

# Railway health checks expect port $PORT (usually 8080)
# Gateway runs on different port (18790 by default)
HEALTH_PORT="${PORT:-8080}"
GATEWAY_PORT="${PICOCLAW_GATEWAY_PORT:-18790}"

# Write config from env vars or use defaults
cat > "$CONFIG_FILE" << EOF
{
  "agents": {
    "defaults": {
      "workspace": "/root/.picoclaw/workspace",
      "restrict_to_workspace": false,
      "provider": "${PICOCLAW_AGENTS_DEFAULTS_PROVIDER:-openai}",
      "model": "${PICOCLAW_AGENTS_DEFAULTS_MODEL:-minimax-m2.5:free}",
      "max_tokens": ${PICOCLAW_AGENTS_DEFAULTS_MAX_TOKENS:-8192},
      "temperature": ${PICOCLAW_AGENTS_DEFAULTS_TEMPERATURE:-0.7},
      "max_tool_iterations": ${PICOCLAW_AGENTS_DEFAULTS_MAX_TOOL_ITERATIONS:-20}
    }
  },
  "providers": {
    "openai": {
      "api_key": "${PICOCLAW_PROVIDERS_OPENAI_API_KEY:-}",
      "api_base": "${PICOCLAW_PROVIDERS_OPENAI_API_BASE:-https://api.kilo.ai/api/gateway}"
    }
  },
  "gateway": {
    "host": "0.0.0.0",
    "port": ${GATEWAY_PORT}
  },
  "heartbeat": {
    "enabled": ${PICOCLAW_HEARTBEAT_ENABLED:-true},
    "interval": ${PICOCLAW_HEARTBEAT_INTERVAL:-30}
  }
}
EOF

echo "Config written to $CONFIG_FILE"
echo "Health endpoint: port ${HEALTH_PORT}"
echo "Gateway: port ${GATEWAY_PORT}"

# Start HTTP health server on Railway's PORT for health checks
mkdir -p /tmp/www
echo '{"ok":true,"status":"healthy"}' > /tmp/www/health.json
httpd -p ${HEALTH_PORT} -h /tmp/www &
echo "Health server started on port ${HEALTH_PORT}"

# TNF Agent Heartbeat - sends status to TNF orchestration worker
AGENT_ID="${TNF_AGENT_ID:-}"
TNF_WORKER_URL="${TNF_WORKER_URL:-https://tnf-agent-orchestration.bizsynth.workers.dev}"
AGENT_ROLE="${TNF_AGENT_ROLE:-unknown}"

if [ -n "$AGENT_ID" ]; then
  echo "Starting TNF heartbeat for agent $AGENT_ID"
  (
    while true; do
      curl -s -X POST "${TNF_WORKER_URL}/agent/heartbeat" \
        -H "Content-Type: application/json" \
        -d "{\"agentId\":\"${AGENT_ID}\",\"status\":\"healthy\",\"currentTask\":\"standing-by\",\"lastActivity\":$(date +%s)000,\"metadata\":{\"role\":\"${AGENT_ROLE}\",\"platform\":\"picoclaw-railway\"}}" \
        > /dev/null 2>&1 || true
      sleep 300  # Every 5 minutes
    done
  ) &
  echo "TNF heartbeat started (agent: $AGENT_ID, interval: 5min)"
fi

# Give httpd a moment to bind the port
sleep 1

# Start picoclaw gateway
exec /usr/local/bin/picoclaw gateway
