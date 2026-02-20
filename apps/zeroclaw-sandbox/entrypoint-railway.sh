#!/bin/sh
# Railway entrypoint for ZeroClaw — writes config.toml + auth-profiles.json from env vars.
# Railway injects $PORT which the gateway must bind to.

set -e

CONFIG_DIR="/zeroclaw-data/.zeroclaw"
CONFIG_FILE="${CONFIG_DIR}/config.toml"
AUTH_FILE="${CONFIG_DIR}/auth-profiles.json"

mkdir -p "${CONFIG_DIR}" /zeroclaw-data/workspace

# ── Port ─────────────────────────────────────────────────────
GATEWAY_PORT="${PORT:-3000}"

# ── Provider Normalization ───────────────────────────────────
# Convert "kilocode"/"kilo" to OpenAI-compatible custom provider format.
RAW_PROVIDER="${PROVIDER:-anthropic}"
RAW_PROVIDER_LC="$(printf '%s' "${RAW_PROVIDER}" | tr '[:upper:]' '[:lower:]')"
RESOLVED_PROVIDER="${RAW_PROVIDER}"
ZEROCLAW_MODEL="${ZEROCLAW_MODEL:-${DEFAULT_MODEL:-}}"

# Optional centralized LLM routing (adaptive middleware control plane)
ROUTING_API_BASE="${TNF_LLM_ROUTING_API_BASE:-}"
ROUTING_TOKEN="${TNF_LLM_ROUTING_TOKEN:-}"
ROUTING_TARGET="${TNF_LLM_TARGET:-${TNF_AGENT_ROLE:-zeroclaw-sandbox}}"

if [ -n "${ROUTING_API_BASE}" ]; then
  ENCODED_TARGET="$(printf '%s' "${ROUTING_TARGET}" | sed 's/ /%20/g')"
  ROUTING_URL_PUBLIC="${ROUTING_API_BASE%/}/api/agent-proxy/adaptive/config/${ENCODED_TARGET}"
  ROUTING_URL_ADMIN="${ROUTING_API_BASE%/}/admin/config/llm-routing/effective/${ENCODED_TARGET}"
  ROUTING_JSON="$(curl -fsS "${ROUTING_URL_PUBLIC}" 2>/dev/null || true)"
  if [ -z "${ROUTING_JSON}" ]; then
    if [ -n "${ROUTING_TOKEN}" ]; then
      ROUTING_JSON="$(curl -fsS -H "Authorization: Bearer ${ROUTING_TOKEN}" "${ROUTING_URL_ADMIN}" 2>/dev/null || true)"
    else
      ROUTING_JSON="$(curl -fsS "${ROUTING_URL_ADMIN}" 2>/dev/null || true)"
    fi
  fi

  if [ -n "${ROUTING_JSON}" ]; then
    SELECTED_LINE="$(printf '%s' "${ROUTING_JSON}" | python3 -c "import sys, json
try:
    d = json.load(sys.stdin)
except Exception:
    print('\\t')
    raise SystemExit(0)
p = (d.get('primary') or {})
f = (d.get('fallback') or {})
provider = (p.get('provider') or '').strip()
model = (p.get('model') or '').strip()
if not provider or not model:
    provider = (f.get('provider') or '').strip()
    model = (f.get('model') or '').strip()
print(f'{provider}\\t{model}')")"
    ROUTE_PROVIDER="$(printf '%s' "${SELECTED_LINE}" | cut -f1)"
    ROUTE_MODEL="$(printf '%s' "${SELECTED_LINE}" | cut -f2)"
    if [ -n "${ROUTE_PROVIDER}" ] && [ -n "${ROUTE_MODEL}" ]; then
      RAW_PROVIDER="${ROUTE_PROVIDER}"
      RAW_PROVIDER_LC="$(printf '%s' "${RAW_PROVIDER}" | tr '[:upper:]' '[:lower:]')"
      ZEROCLAW_MODEL="${ROUTE_MODEL}"
      echo "Applied centralized routing target '${ROUTING_TARGET}' => ${RAW_PROVIDER}/${ZEROCLAW_MODEL}"
    else
      echo "Centralized routing returned no usable primary/fallback for target '${ROUTING_TARGET}'"
    fi
  fi
fi

case "${RAW_PROVIDER_LC}" in
  kilocode|kilo)
    RESOLVED_PROVIDER="custom:https://api.kilo.ai/api/gateway"
    echo "Normalized provider '${RAW_PROVIDER}' to '${RESOLVED_PROVIDER}'"
    # Strip provider prefix from model if present.
    ZEROCLAW_MODEL="$(printf '%s' "${ZEROCLAW_MODEL}" | sed -E 's/^(kilocode|kilo)\///')"
    # Use KILO_API_KEY for the API key if not already set.
    API_KEY="${API_KEY:-${KILO_API_KEY:-}}"
    ;;
esac

if [ -z "${ZEROCLAW_MODEL}" ]; then
  echo "WARN: ZEROCLAW_MODEL is not set. Configure model centrally or via Railway env vars." >&2
fi

# ── Write config.toml from env vars ─────────────────────────
cat > "${CONFIG_FILE}" <<EOF
api_key             = "${API_KEY:-${ZEROCLAW_API_KEY:-}}"
default_provider    = "${RESOLVED_PROVIDER}"
default_model       = "${ZEROCLAW_MODEL}"
default_temperature = ${ZEROCLAW_TEMPERATURE:-0.7}

[observability]
backend = "none"

[autonomy]
level                = "${ZEROCLAW_AUTONOMY_LEVEL:-supervised}"
workspace_only       = true
allowed_commands     = ["git", "npm", "cargo", "ls", "cat", "grep", "find", "echo", "pwd", "wc", "head", "tail"]
forbidden_paths      = ["/etc", "/root", "/proc", "/sys", "/boot", "/dev", "/var", "/tmp", "~/.ssh", "~/.gnupg", "~/.aws"]
max_actions_per_hour = 100
max_cost_per_day_cents = 500

[runtime]
kind = "native"

[memory]
backend            = "${ZEROCLAW_MEMORY_BACKEND:-sqlite}"
auto_save          = true
embedding_provider = "${ZEROCLAW_EMBEDDING_PROVIDER:-none}"
vector_weight      = 0.7
keyword_weight     = 0.3

[gateway]
port              = ${GATEWAY_PORT}
host              = "0.0.0.0"
allow_public_bind = true
require_pairing   = ${ZEROCLAW_REQUIRE_PAIRING:-false}

[secrets]
encrypt = false

[heartbeat]
enabled          = false
interval_minutes = 30

[tunnel]
provider = "none"

[identity]
format = "aieos"
aieos_inline = '''
{
  "identity": {
    "names": {
      "first": "ZeroClaw",
      "nickname": "ZC"
    }
  },
  "psychology": {
    "traits": {
      "mbti": "INTJ"
    },
    "moral_compass": {
      "alignment": "Lawful Neutral"
    }
  },
  "motivations": {
    "core_drive": "Execute tasks efficiently within the TNF agent network"
  }
}
'''
EOF

chmod 600 "${CONFIG_FILE}"

# ── Write auth-profiles.json ────────────────────────────────
# ZeroClaw uses ~/.zeroclaw/auth-profiles.json for subscription/OAuth auth.

NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Initialize empty profiles object
cat > "${AUTH_FILE}" <<AUTHEOF
{
  "schema_version": 1,
  "updated_at": "${NOW}",
  "active_profiles": {},
  "profiles": {}
}
AUTHEOF

# Function to add profile (simple JSON merge hack for shell)
add_profile() {
  local provider="$1"
  local profile_name="$2"
  local kind="$3"
  local token="$4"
  local refresh="$5"
  local expires="$6"
  local account_id="$7"

  # Use a temporary file to build the profile
  local tmp_profile="/tmp/profile.json"

  if [ "$kind" = "oauth" ]; then
    cat > "$tmp_profile" <<PROFILEEOF
    {
      "provider": "$provider",
      "profile_name": "$profile_name",
      "kind": "oauth",
      "account_id": "$account_id",
      "access_token": "$token",
      "refresh_token": "$refresh",
      "expires_at": "$expires",
      "token_type": "Bearer",
      "created_at": "$NOW",
      "updated_at": "$NOW"
    }
PROFILEEOF
  else
    cat > "$tmp_profile" <<PROFILEEOF
    {
      "provider": "$provider",
      "profile_name": "$profile_name",
      "kind": "token",
      "token": "$token",
      "created_at": "$NOW",
      "updated_at": "$NOW"
    }
PROFILEEOF
  fi

  # Merge into AUTH_FILE (requires python3 or similar for real JSON handling)
  # But we can just overwrite if it's the main one, or use a simple python line
  python3 -c "
import sys, json
provider = '$provider'
profile_name = '$profile_name'
id = f'{provider}:{profile_name}'
with open('${AUTH_FILE}', 'r') as f: data = json.load(f)
with open('$tmp_profile', 'r') as f: profile = json.load(f)
data['profiles'][id] = profile
data['active_profiles'][provider] = id
with open('${AUTH_FILE}', 'w') as f: json.dump(data, f, indent=2)
"
}

# ── Process Anthropic OAuth ────────────────
if [ -n "${ANTHROPIC_ACCESS_TOKEN:-}" ]; then
  add_profile "anthropic" "default" "token" "${ANTHROPIC_ACCESS_TOKEN}" "" "" ""
  export ANTHROPIC_OAUTH_TOKEN="${ANTHROPIC_ACCESS_TOKEN}"
  echo "Auth profiles updated: anthropic:default (and exported ANTHROPIC_OAUTH_TOKEN)"
fi

# ── Process OpenAI Codex OAuth ────────────────
if [ -n "${OPENAI_CODEX_ACCESS_TOKEN:-}" ] || [ -n "${OPENAI_CODEX_REFRESH_TOKEN:-}" ]; then
  EXPIRES_AT="${OPENAI_CODEX_EXPIRES_AT:-$(date -u -d "+10 days" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || echo "2030-01-01T00:00:00Z")}"
  add_profile "openai-codex" "default" "oauth" "${OPENAI_CODEX_ACCESS_TOKEN:-}" "${OPENAI_CODEX_REFRESH_TOKEN:-}" "${EXPIRES_AT}" "${OPENAI_CODEX_ACCOUNT_ID:-}"
  echo "Auth profiles updated: openai-codex:default"
fi

chmod 600 "${AUTH_FILE}"

echo "=== ZeroClaw Railway Sandbox ==="
echo "Config written to ${CONFIG_FILE}"
echo "Gateway port:    ${GATEWAY_PORT}"
echo "Provider:        ${RESOLVED_PROVIDER}"
echo "Model:           ${ZEROCLAW_MODEL:-<unset>}"
echo "TNF Agent ID:    ${TNF_AGENT_ID:-zeroclaw-railway-01}"

# ── TNF Agent Heartbeat ──────────────────────────────────────
AGENT_ID="${TNF_AGENT_ID:-zeroclaw-railway-01}"
TNF_WORKER_URL="${TNF_WORKER_URL:-https://tnf-agent-orchestration.bizsynth.workers.dev}"
AGENT_ROLE="${TNF_AGENT_ROLE:-zeroclaw-sandbox}"

echo "Starting TNF heartbeat for agent ${AGENT_ID}"
(
  while true; do
    curl -s -X POST "${TNF_WORKER_URL}/agent/heartbeat" \
      -H "Content-Type: application/json" \
      -d "{\"agentId\":\"${AGENT_ID}\",\"status\":\"healthy\",\"currentTask\":\"standing-by\",\"lastActivity\":$(date +%s)000,\"metadata\":{\"role\":\"${AGENT_ROLE}\",\"platform\":\"zeroclaw-railway\",\"routingTarget\":\"${ROUTING_TARGET}\",\"provider\":\"${RESOLVED_PROVIDER}\",\"model\":\"${ZEROCLAW_MODEL:-}\"}}" \
      > /dev/null 2>&1 || true
    sleep 300
  done
) &
echo "TNF heartbeat started (agent: ${AGENT_ID}, interval: 5min)"

sleep 1

# ── Launch ZeroClaw Gateway ──────────────────────────────────
echo "Starting zeroclaw gateway on port ${GATEWAY_PORT}..."
exec /usr/local/bin/zeroclaw gateway
