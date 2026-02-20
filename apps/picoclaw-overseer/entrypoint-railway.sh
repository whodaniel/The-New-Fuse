#!/bin/sh
# Railway entrypoint for picoclaw - writes config from env vars then starts picoclaw

CONFIG_FILE="/root/.picoclaw/config.json"

# Create config directory
mkdir -p /root/.picoclaw/workspace

# Railway health checks expect port $PORT (usually 8080)
# Gateway runs on different port (18790 by default)
HEALTH_PORT="${PORT:-8080}"
GATEWAY_PORT="${PICOCLAW_GATEWAY_PORT:-18790}"

# Optional centralized LLM routing (adaptive middleware control plane)
ROUTING_API_BASE="${TNF_LLM_ROUTING_API_BASE:-}"
ROUTING_TOKEN="${TNF_LLM_ROUTING_TOKEN:-}"
ROUTING_TARGET="${TNF_LLM_TARGET:-${TNF_AGENT_ROLE:-picoclaw-overseer}}"

resolve_routing_provider() {
  raw="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  case "$raw" in
    custom:*)
      echo "openai|${raw#custom:}"
      ;;
    kilo|kilocode)
      echo "openai|https://api.kilo.ai/api/gateway"
      ;;
    *)
      echo "${raw}|"
      ;;
  esac
}

if [ -n "${ROUTING_API_BASE}" ]; then
  ENCODED_TARGET="$(printf '%s' "${ROUTING_TARGET}" | sed 's/ /%20/g')"
  ROUTING_URL_PUBLIC="${ROUTING_API_BASE%/}/api/agent-proxy/adaptive/config/${ENCODED_TARGET}"
  ROUTING_URL_ADMIN="${ROUTING_API_BASE%/}/admin/config/llm-routing/effective/${ENCODED_TARGET}"
  AUTH_HEADER=""
  if [ -n "${ROUTING_TOKEN}" ]; then
    AUTH_HEADER="Authorization: Bearer ${ROUTING_TOKEN}"
  fi

  ROUTING_JSON="$(curl -fsS "${ROUTING_URL_PUBLIC}" 2>/dev/null || true)"
  if [ -z "${ROUTING_JSON}" ]; then
    if [ -n "${AUTH_HEADER}" ]; then
      ROUTING_JSON="$(curl -fsS -H "${AUTH_HEADER}" "${ROUTING_URL_ADMIN}" 2>/dev/null || true)"
    else
      ROUTING_JSON="$(curl -fsS "${ROUTING_URL_ADMIN}" 2>/dev/null || true)"
    fi
  fi

  if [ -n "${ROUTING_JSON}" ] && command -v jq >/dev/null 2>&1; then
    PRIMARY_PROVIDER="$(printf '%s' "${ROUTING_JSON}" | jq -r '.primary.provider // empty')"
    PRIMARY_MODEL="$(printf '%s' "${ROUTING_JSON}" | jq -r '.primary.model // empty')"
    FALLBACK_PROVIDER="$(printf '%s' "${ROUTING_JSON}" | jq -r '.fallback.provider // empty')"
    FALLBACK_MODEL="$(printf '%s' "${ROUTING_JSON}" | jq -r '.fallback.model // empty')"

    RESOLVED_PROVIDER="${PRIMARY_PROVIDER}"
    RESOLVED_MODEL="${PRIMARY_MODEL}"
    if [ -z "${RESOLVED_PROVIDER}" ] || [ -z "${RESOLVED_MODEL}" ]; then
      RESOLVED_PROVIDER="${FALLBACK_PROVIDER}"
      RESOLVED_MODEL="${FALLBACK_MODEL}"
    fi

    if [ -n "${RESOLVED_PROVIDER}" ] && [ -n "${RESOLVED_MODEL}" ]; then
      MAPPED="$(resolve_routing_provider "${RESOLVED_PROVIDER}")"
      PICOCLAW_AGENTS_DEFAULTS_PROVIDER="${MAPPED%%|*}"
      ROUTING_API_BASE_OVERRIDE="${MAPPED#*|}"
      PICOCLAW_AGENTS_DEFAULTS_MODEL="${RESOLVED_MODEL}"
      if [ -n "${ROUTING_API_BASE_OVERRIDE}" ]; then
        PICOCLAW_PROVIDERS_OPENAI_API_BASE="${ROUTING_API_BASE_OVERRIDE}"
      fi
      export PICOCLAW_AGENTS_DEFAULTS_PROVIDER
      export PICOCLAW_AGENTS_DEFAULTS_MODEL
      export PICOCLAW_PROVIDERS_OPENAI_API_BASE
      echo "Applied centralized routing target '${ROUTING_TARGET}' => ${PICOCLAW_AGENTS_DEFAULTS_PROVIDER}/${PICOCLAW_AGENTS_DEFAULTS_MODEL}"
    else
      echo "Centralized routing returned no usable primary/fallback for target '${ROUTING_TARGET}'"
    fi
  fi
fi

# Write config from env vars or use defaults
cat > "$CONFIG_FILE" << EOF
{
  "agents": {
    "defaults": {
      "workspace": "/root/.picoclaw/workspace",
      "restrict_to_workspace": false,
      "provider": "${PICOCLAW_AGENTS_DEFAULTS_PROVIDER:-openai}",
      "model": "${PICOCLAW_AGENTS_DEFAULTS_MODEL:-z-ai/glm-5:free}",
      "max_tokens": ${PICOCLAW_AGENTS_DEFAULTS_MAX_TOKENS:-8192},
      "temperature": ${PICOCLAW_AGENTS_DEFAULTS_TEMPERATURE:-0.7},
      "max_tool_iterations": ${PICOCLAW_AGENTS_DEFAULTS_MAX_TOOL_ITERATIONS:-20}
    }
  },
  "providers": {
    "anthropic": {
      "api_key": "${PICOCLAW_PROVIDERS_ANTHROPIC_API_KEY:-${ANTHROPIC_API_KEY:-}}",
      "api_base": "${PICOCLAW_PROVIDERS_ANTHROPIC_API_BASE:-}"
    },
    "openai": {
      "api_key": "${PICOCLAW_PROVIDERS_OPENAI_API_KEY:-${OPENAI_API_KEY:-${KILO_API_KEY:-}}}",
      "api_base": "${PICOCLAW_PROVIDERS_OPENAI_API_BASE:-https://api.kilo.ai/api/gateway}"
    },
    "openrouter": {
      "api_key": "${PICOCLAW_PROVIDERS_OPENROUTER_API_KEY:-${OPENROUTER_API_KEY:-}}",
      "api_base": "${PICOCLAW_PROVIDERS_OPENROUTER_API_BASE:-}"
    },
    "groq": {
      "api_key": "${PICOCLAW_PROVIDERS_GROQ_API_KEY:-${GROQ_API_KEY:-}}",
      "api_base": "${PICOCLAW_PROVIDERS_GROQ_API_BASE:-}"
    },
    "zhipu": {
      "api_key": "${PICOCLAW_PROVIDERS_ZHIPU_API_KEY:-${ZHIPU_API_KEY:-}}",
      "api_base": "${PICOCLAW_PROVIDERS_ZHIPU_API_BASE:-}"
    },
    "gemini": {
      "api_key": "${PICOCLAW_PROVIDERS_GEMINI_API_KEY:-${GEMINI_API_KEY:-}}",
      "api_base": "${PICOCLAW_PROVIDERS_GEMINI_API_BASE:-}"
    },
    "kilo": {
      "api_key": "${PICOCLAW_PROVIDERS_KILO_API_KEY:-${KILO_API_KEY:-}}",
      "api_base": "${PICOCLAW_PROVIDERS_KILO_API_BASE:-https://api.kilo.ai/api/gateway}"
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
echo "Provider/Model: ${PICOCLAW_AGENTS_DEFAULTS_PROVIDER:-openai}/${PICOCLAW_AGENTS_DEFAULTS_MODEL:-z-ai/glm-5:free}"

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
        -d "{\"agentId\":\"${AGENT_ID}\",\"status\":\"healthy\",\"currentTask\":\"standing-by\",\"lastActivity\":$(date +%s)000,\"metadata\":{\"role\":\"${AGENT_ROLE}\",\"platform\":\"picoclaw-railway\",\"routingTarget\":\"${ROUTING_TARGET}\",\"provider\":\"${PICOCLAW_AGENTS_DEFAULTS_PROVIDER:-openai}\",\"model\":\"${PICOCLAW_AGENTS_DEFAULTS_MODEL:-z-ai/glm-5:free}\"}}" \
        > /dev/null 2>&1 || true
      sleep 300  # Every 5 minutes
    done
  ) &
  echo "TNF heartbeat started (agent: $AGENT_ID, interval: 5min)"
fi

# Give httpd a moment to bind the port
sleep 1

# Validate provider credentials and attempt automatic provider fallback.
ACTIVE_PROVIDER="${PICOCLAW_AGENTS_DEFAULTS_PROVIDER:-openai}"
ACTIVE_MODEL="${PICOCLAW_AGENTS_DEFAULTS_MODEL:-z-ai/glm-5:free}"

provider_has_key() {
  p="$1"
  case "$p" in
    openai|kilo)
      [ -n "${PICOCLAW_PROVIDERS_OPENAI_API_KEY:-${OPENAI_API_KEY:-${KILO_API_KEY:-}}}" ] || [ -n "${PICOCLAW_PROVIDERS_KILO_API_KEY:-${KILO_API_KEY:-}}" ]
      ;;
    openrouter)
      [ -n "${PICOCLAW_PROVIDERS_OPENROUTER_API_KEY:-${OPENROUTER_API_KEY:-}}" ]
      ;;
    anthropic)
      [ -n "${PICOCLAW_PROVIDERS_ANTHROPIC_API_KEY:-${ANTHROPIC_API_KEY:-}}" ]
      ;;
    gemini)
      [ -n "${PICOCLAW_PROVIDERS_GEMINI_API_KEY:-${GEMINI_API_KEY:-}}" ]
      ;;
    groq)
      [ -n "${PICOCLAW_PROVIDERS_GROQ_API_KEY:-${GROQ_API_KEY:-}}" ]
      ;;
    zhipu)
      [ -n "${PICOCLAW_PROVIDERS_ZHIPU_API_KEY:-${ZHIPU_API_KEY:-}}" ]
      ;;
    *)
      [ -n "${PICOCLAW_PROVIDERS_OPENAI_API_KEY:-${OPENAI_API_KEY:-${KILO_API_KEY:-}}}" ]
      ;;
  esac
}

if ! provider_has_key "${ACTIVE_PROVIDER}"; then
  if provider_has_key openai; then
    ACTIVE_PROVIDER="openai"
  elif provider_has_key openrouter; then
    ACTIVE_PROVIDER="openrouter"
  elif provider_has_key anthropic; then
    ACTIVE_PROVIDER="anthropic"
  elif provider_has_key gemini; then
    ACTIVE_PROVIDER="gemini"
  elif provider_has_key groq; then
    ACTIVE_PROVIDER="groq"
  elif provider_has_key zhipu; then
    ACTIVE_PROVIDER="zhipu"
  else
    echo "No provider API key found; keeping health endpoint alive and skipping gateway startup."
    while true; do sleep 3600; done
  fi
  PICOCLAW_AGENTS_DEFAULTS_PROVIDER="${ACTIVE_PROVIDER}"
  export PICOCLAW_AGENTS_DEFAULTS_PROVIDER
  echo "Auto-switched provider to '${ACTIVE_PROVIDER}' due missing credentials for startup provider."
  if command -v jq >/dev/null 2>&1; then
    tmp_cfg="$(mktemp)"
    jq --arg provider "${PICOCLAW_AGENTS_DEFAULTS_PROVIDER}" '.agents.defaults.provider = $provider' "$CONFIG_FILE" > "$tmp_cfg" && mv "$tmp_cfg" "$CONFIG_FILE"
  fi
fi

# Start picoclaw gateway
exec /usr/local/bin/picoclaw gateway
