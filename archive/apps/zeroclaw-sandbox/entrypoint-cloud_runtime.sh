#!/bin/sh
# CloudRuntime entrypoint for ZeroClaw — writes config.toml + auth-profiles.json from env vars.
# CloudRuntime injects $PORT which the gateway must bind to.

set -e

CONFIG_DIR="/zeroclaw-data/.zeroclaw"
CONFIG_FILE="${CONFIG_DIR}/config.toml"
AUTH_FILE="${CONFIG_DIR}/auth-profiles.json"

mkdir -p "${CONFIG_DIR}" /zeroclaw-data/workspace

# ── Port ─────────────────────────────────────────────────────
# CloudRuntime exposes only one public port. We bind ZeroClaw internally and place
# a lightweight proxy on the public port so external calls are reliable.
GATEWAY_PORT="${PORT:-3000}"
INTERNAL_GATEWAY_PORT="${ZEROCLAW_INTERNAL_GATEWAY_PORT:-3001}"

# ── Provider Normalization ───────────────────────────────────
# Convert "kilocode"/"kilo" to OpenAI-compatible custom provider format.
RAW_PROVIDER="${PROVIDER:-anthropic}"
RAW_PROVIDER_LC="$(printf '%s' "${RAW_PROVIDER}" | tr '[:upper:]' '[:lower:]')"
RESOLVED_PROVIDER="${RAW_PROVIDER}"
ZEROCLAW_MODEL="${ZEROCLAW_MODEL:-${DEFAULT_MODEL:-}}"
ENABLE_KILO_FALLBACK_RAW="${ZEROCLAW_ENABLE_KILO_FALLBACK:-true}"
ENABLE_KILO_FALLBACK="false"
case "$(printf '%s' "${ENABLE_KILO_FALLBACK_RAW}" | tr '[:upper:]' '[:lower:]')" in
  1|true|yes|on) ENABLE_KILO_FALLBACK="true" ;;
esac
PRIMARY_FALLBACK_MODELS_RAW="${ZEROCLAW_PRIMARY_MODEL_FALLBACKS:-${OPENCLAW_MODEL_FALLBACKS:-openai-codex/gpt-5.2-codex,openai-codex/gpt-5.1,openai-codex/gpt-5-mini}}"
KILO_FALLBACK_MODELS_RAW="${ZEROCLAW_KILO_FALLBACK_MODELS:-minimax/minimax-m2.5:free,moonshotai/kimi-k2.5:free,arcee-ai/trinity-large-preview:free,kilo/auto-free}"

PRIMARY_FALLBACK_MODELS_TOML="$(PRIMARY_FALLBACK_MODELS_RAW="${PRIMARY_FALLBACK_MODELS_RAW}" python3 - <<'PY'
import json
import os
import re
raw = os.environ.get("PRIMARY_FALLBACK_MODELS_RAW", "").strip()
parts = [p for p in re.split(r"[,\s]+", raw) if p]
normalized = []
for part in parts:
    if "/" in part and part.split("/", 1)[0] in {"openai-codex", "codex"}:
        part = part.split("/", 1)[1]
    normalized.append(part)
print(", ".join(json.dumps(p) for p in normalized))
PY
)"
KILO_FALLBACK_MODELS_TOML="$(KILO_FALLBACK_MODELS_RAW="${KILO_FALLBACK_MODELS_RAW}" python3 - <<'PY'
import json
import os
import re
raw = os.environ.get("KILO_FALLBACK_MODELS_RAW", "").strip()
parts = [p for p in re.split(r"[,\s]+", raw) if p]
print(", ".join(json.dumps(p) for p in parts))
PY
)"

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

RAW_PROVIDER_LC="$(printf '%s' "${RAW_PROVIDER}" | tr '[:upper:]' '[:lower:]')"
RESOLVED_PROVIDER="${RAW_PROVIDER}"
case "${RAW_PROVIDER_LC}" in
  kilocode|kilo)
    RESOLVED_PROVIDER="custom:https://api.kilo.ai/api/gateway"
    echo "Normalized provider '${RAW_PROVIDER}' to '${RESOLVED_PROVIDER}'"
    # Strip provider prefix from model if present.
    ZEROCLAW_MODEL="$(printf '%s' "${ZEROCLAW_MODEL}" | sed -E 's/^(kilocode|kilo)\///')"
    # Use KILO_API_KEY / KILOCODE_API_KEY for the API key if not already set.
    API_KEY="${API_KEY:-${KILO_API_KEY:-${KILOCODE_API_KEY:-}}}"
    ;;
  openrouter|openrouterai)
    RESOLVED_PROVIDER="custom:https://openrouter.ai/api/v1"
    echo "Normalized provider '${RAW_PROVIDER}' to '${RESOLVED_PROVIDER}'"
    API_KEY="${API_KEY:-${OPENROUTER_API_KEY:-}}"
    ;;
esac

# For custom-provider fallbacks (e.g. Kilo gateway), the custom provider resolves
# credentials from generic ZEROCLAW_API_KEY/API_KEY. Reuse KILOCODE_API_KEY when set.
if [ "${ENABLE_KILO_FALLBACK}" = "true" ]; then
  API_KEY="${API_KEY:-${ZEROCLAW_API_KEY:-${KILOCODE_API_KEY:-${KILO_API_KEY:-}}}}"
fi

if [ -z "${ZEROCLAW_MODEL}" ]; then
  echo "WARN: ZEROCLAW_MODEL is not set. Configure model centrally or via CloudRuntime env vars." >&2
fi

# ── Optional Telegram Channel Boot Config ───────────────────
# Supports both ZEROCLAW_* and legacy PICOCLAW_* variable names.
TELEGRAM_ENABLED_RAW="${ZEROCLAW_CHANNELS_TELEGRAM_ENABLED:-${PICOCLAW_CHANNELS_TELEGRAM_ENABLED:-false}}"
TELEGRAM_TOKEN="${ZEROCLAW_CHANNELS_TELEGRAM_TOKEN:-${PICOCLAW_CHANNELS_TELEGRAM_TOKEN:-}}"
TELEGRAM_PROXY="${ZEROCLAW_CHANNELS_TELEGRAM_PROXY:-${PICOCLAW_CHANNELS_TELEGRAM_PROXY:-}}"
TELEGRAM_ALLOW_FROM_RAW="${ZEROCLAW_CHANNELS_TELEGRAM_ALLOW_FROM:-${PICOCLAW_CHANNELS_TELEGRAM_ALLOW_FROM:-}}"

TELEGRAM_ENABLED="false"
case "$(printf '%s' "${TELEGRAM_ENABLED_RAW}" | tr '[:upper:]' '[:lower:]')" in
  1|true|yes|on) TELEGRAM_ENABLED="true" ;;
esac

TELEGRAM_ALLOW_FROM_TOML="$(TELEGRAM_ALLOW_FROM_RAW="${TELEGRAM_ALLOW_FROM_RAW}" python3 - <<'PY'
import json
import os
import re
raw = os.environ.get("TELEGRAM_ALLOW_FROM_RAW", "").strip()
if not raw:
    print("")
    raise SystemExit(0)
parts = [p for p in re.split(r"[,\s]+", raw) if p]
print(", ".join(json.dumps(p) for p in parts))
PY
)"

# ── Optional Discord Channel Boot Config ────────────────────
# Supports both ZEROCLAW_* and legacy PICOCLAW_* variable names.
DISCORD_ENABLED_RAW="${ZEROCLAW_CHANNELS_DISCORD_ENABLED:-${PICOCLAW_CHANNELS_DISCORD_ENABLED:-false}}"
DISCORD_TOKEN="${ZEROCLAW_CHANNELS_DISCORD_TOKEN:-${PICOCLAW_CHANNELS_DISCORD_TOKEN:-}}"
DISCORD_ALLOW_FROM_RAW="${ZEROCLAW_CHANNELS_DISCORD_ALLOW_FROM:-${PICOCLAW_CHANNELS_DISCORD_ALLOW_FROM:-}}"

DISCORD_ENABLED="false"
case "$(printf '%s' "${DISCORD_ENABLED_RAW}" | tr '[:upper:]' '[:lower:]')" in
  1|true|yes|on) DISCORD_ENABLED="true" ;;
esac

DISCORD_ALLOW_FROM_TOML="$(DISCORD_ALLOW_FROM_RAW="${DISCORD_ALLOW_FROM_RAW}" python3 - <<'PY'
import json
import os
import re
raw = os.environ.get("DISCORD_ALLOW_FROM_RAW", "").strip()
if not raw:
    print("")
    raise SystemExit(0)
parts = [p for p in re.split(r"[,\s]+", raw) if p]
print(", ".join(json.dumps(p) for p in parts))
PY
)"

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
port              = ${INTERNAL_GATEWAY_PORT}
host              = "127.0.0.1"
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

if [ "${ENABLE_KILO_FALLBACK}" = "true" ]; then
  {
    echo ""
    echo "[reliability]"
    echo "provider_retries = 2"
    echo "provider_backoff_ms = 500"
    echo "fallback_providers = [\"custom:https://api.kilo.ai/api/gateway\"]"
    echo ""
    echo "[reliability.model_fallbacks]"
    if [ -n "${PRIMARY_FALLBACK_MODELS_TOML}" ]; then
      echo "\"openai-codex\" = [${PRIMARY_FALLBACK_MODELS_TOML}]"
    fi
    if [ -n "${KILO_FALLBACK_MODELS_TOML}" ]; then
      echo "\"custom:https://api.kilo.ai/api/gateway\" = [${KILO_FALLBACK_MODELS_TOML}]"
    fi
  } >> "${CONFIG_FILE}"
  echo "Kilo fallback provider/model chain appended to config.toml"
fi

CHANNELS_CONFIG_STARTED="false"
start_channels_config() {
  if [ "${CHANNELS_CONFIG_STARTED}" = "true" ]; then
    return
  fi
  {
    echo ""
    echo "[channels_config]"
    echo "cli = true"
  } >> "${CONFIG_FILE}"
  CHANNELS_CONFIG_STARTED="true"
}

if [ "${TELEGRAM_ENABLED}" = "true" ] || [ -n "${TELEGRAM_TOKEN}" ]; then
  if [ -z "${TELEGRAM_TOKEN}" ]; then
    echo "WARN: Telegram channel requested but no token provided. Skipping telegram channel config." >&2
  else
    start_channels_config
    {
      echo ""
      # ZeroClaw expects channel config under [channels_config.<name>].
      echo "[channels_config.telegram]"
      echo "bot_token = \"${TELEGRAM_TOKEN}\""
      if [ -n "${TELEGRAM_ALLOW_FROM_TOML}" ]; then
        echo "allowed_users = [${TELEGRAM_ALLOW_FROM_TOML}]"
      else
        # Empty allowlist denies all Telegram users by design.
        echo "allowed_users = []"
      fi
    } >> "${CONFIG_FILE}"
    echo "Telegram channel config appended to config.toml"
  fi
fi

if [ "${DISCORD_ENABLED}" = "true" ] || [ -n "${DISCORD_TOKEN}" ]; then
  if [ -z "${DISCORD_TOKEN}" ]; then
    echo "WARN: Discord channel requested but no token provided. Skipping discord channel config." >&2
  else
    start_channels_config
    {
      echo ""
      echo "[channels_config.discord]"
      # Keep both keys for compatibility across zeroclaw builds.
      echo "token = \"${DISCORD_TOKEN}\""
      echo "bot_token = \"${DISCORD_TOKEN}\""
      if [ -n "${DISCORD_ALLOW_FROM_TOML}" ]; then
        echo "allowed_users = [${DISCORD_ALLOW_FROM_TOML}]"
      else
        echo "allowed_users = []"
      fi
    } >> "${CONFIG_FILE}"
    echo "Discord channel config appended to config.toml"
  fi
fi

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

echo "=== ZeroClaw CloudRuntime Sandbox ==="
echo "Config written to ${CONFIG_FILE}"
echo "Gateway port:    ${GATEWAY_PORT} (public proxy)"
echo "Internal port:   ${INTERNAL_GATEWAY_PORT} (zeroclaw gateway)"
echo "Provider:        ${RESOLVED_PROVIDER}"
echo "Model:           ${ZEROCLAW_MODEL:-<unset>}"
echo "TNF Agent ID:    ${TNF_AGENT_ID:-zeroclaw-cloud_runtime-01}"

# Ensure custom provider credential resolution sees a concrete key.
export ZEROCLAW_API_KEY="${ZEROCLAW_API_KEY:-${API_KEY:-${KILOCODE_API_KEY:-${KILO_API_KEY:-}}}}"

# ── TNF Agent Heartbeat ──────────────────────────────────────
AGENT_ID="${TNF_AGENT_ID:-zeroclaw-cloud_runtime-01}"
TNF_WORKER_URL="${TNF_WORKER_URL:-https://tnf-agent-orchestration.bizsynth.workers.dev}"
AGENT_ROLE="${TNF_AGENT_ROLE:-zeroclaw-sandbox}"

echo "Starting TNF heartbeat for agent ${AGENT_ID}"
(
  while true; do
    curl -s -X POST "${TNF_WORKER_URL}/agent/heartbeat" \
      -H "Content-Type: application/json" \
      -d "{\"agentId\":\"${AGENT_ID}\",\"status\":\"healthy\",\"currentTask\":\"standing-by\",\"lastActivity\":$(date +%s)000,\"metadata\":{\"role\":\"${AGENT_ROLE}\",\"platform\":\"zeroclaw-cloud_runtime\",\"routingTarget\":\"${ROUTING_TARGET}\",\"provider\":\"${RESOLVED_PROVIDER}\",\"model\":\"${ZEROCLAW_MODEL:-}\"}}" \
      > /dev/null 2>&1 || true
    sleep 300
  done
) &
echo "TNF heartbeat started (agent: ${AGENT_ID}, interval: 5min)"

sleep 1

# ── Launch ZeroClaw Daemon (gateway + channels) + Public Proxy ────────
echo "Starting zeroclaw daemon on 127.0.0.1:${INTERNAL_GATEWAY_PORT}..."
export ZEROCLAW_GATEWAY_PORT="${INTERNAL_GATEWAY_PORT}"
/usr/local/bin/zeroclaw daemon &
ZEROCLAW_PID=$!

echo "Waiting for internal gateway readiness..."
i=0
while [ "$i" -lt 80 ]; do
  if curl -fsS "http://127.0.0.1:${INTERNAL_GATEWAY_PORT}/health" >/dev/null 2>&1; then
    break
  fi
  i=$((i + 1))
  sleep 0.25
done

cat >/tmp/zeroclaw_proxy.py <<'PYEOF'
#!/usr/bin/env python3
import http.server
import os
import socketserver
import urllib.request
import urllib.error

PUBLIC_PORT = int(os.environ.get("PORT", os.environ.get("ZEROCLAW_GATEWAY_PORT", "3000")))
INTERNAL_PORT = int(os.environ.get("ZEROCLAW_INTERNAL_GATEWAY_PORT", "3001"))
INTERNAL_BASE = f"http://127.0.0.1:{INTERNAL_PORT}"
PUBLIC_API_KEY = os.environ.get("ZEROCLAW_PUBLIC_API_KEY", "").strip()
AUTH_REQUIRED = os.environ.get("ZEROCLAW_PUBLIC_PROXY_REQUIRE_AUTH", "false").lower() in ("1", "true", "yes", "on")


class ProxyHandler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _authorized(self):
        if not AUTH_REQUIRED:
            return True
        if not PUBLIC_API_KEY:
            return False
        auth = self.headers.get("Authorization", "")
        api_key = self.headers.get("X-API-Key", "")
        if auth.startswith("Bearer ") and auth[7:].strip() == PUBLIC_API_KEY:
            return True
        if api_key.strip() == PUBLIC_API_KEY:
            return True
        return False

    def _proxy(self):
        if not self._authorized():
            body = b'{"error":"Unauthorized"}'
            self.send_response(401)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        content_length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(content_length) if content_length > 0 else None
        target = INTERNAL_BASE + self.path
        req = urllib.request.Request(target, data=body, method=self.command)

        skip_headers = {"host", "content-length", "connection"}
        for k, v in self.headers.items():
            if k.lower() in skip_headers:
                continue
            req.add_header(k, v)

        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = resp.read()
                self.send_response(resp.getcode())
                for k, v in resp.getheaders():
                    kl = k.lower()
                    if kl in ("transfer-encoding", "connection", "content-length"):
                        continue
                    self.send_header(k, v)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            data = e.read() if hasattr(e, "read") else b""
            self.send_response(e.code)
            self.send_header("Content-Type", e.headers.get("Content-Type", "application/json"))
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            if data:
                self.wfile.write(data)
        except Exception as exc:
            msg = ('{"error":"proxy_error","detail":"%s"}' % str(exc).replace('"', "'")).encode("utf-8")
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)

    def do_GET(self):
        self._proxy()

    def do_POST(self):
        self._proxy()

    def do_PUT(self):
        self._proxy()

    def do_PATCH(self):
        self._proxy()

    def do_DELETE(self):
        self._proxy()

    def log_message(self, fmt, *args):
        return


class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    server = ThreadingServer(("0.0.0.0", PUBLIC_PORT), ProxyHandler)
    print(f"ZeroClaw public proxy listening on http://0.0.0.0:{PUBLIC_PORT} -> {INTERNAL_BASE}")
    server.serve_forever()
PYEOF

echo "Starting public proxy on :${GATEWAY_PORT}..."
python3 /tmp/zeroclaw_proxy.py &
PROXY_PID=$!

cleanup() {
  kill "${PROXY_PID}" "${ZEROCLAW_PID}" >/dev/null 2>&1 || true
}
trap cleanup INT TERM EXIT

wait "${ZEROCLAW_PID}"
