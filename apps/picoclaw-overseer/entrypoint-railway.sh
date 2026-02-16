#!/bin/sh
# Railway entrypoint - writes config from env vars then starts picoclaw

CONFIG_FILE="/root/.picoclaw/config.json"

# Create config directory
mkdir -p /root/.picoclaw/workspace

# Use Railway's PORT or default to 18790
GATEWAY_PORT="${PORT:-18790}"

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
cat "$CONFIG_FILE"
echo "Gateway will listen on port ${GATEWAY_PORT}"

# Start picoclaw gateway
exec /usr/local/bin/picoclaw gateway --port ${GATEWAY_PORT}
