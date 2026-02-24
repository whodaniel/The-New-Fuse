#!/usr/bin/env bash
set -euo pipefail

# Manage Cloudflare Turnstile widgets and optionally write keys to local env files.
# Required env:
#   ACCOUNT_ID, API_TOKEN
# Optional env:
#   MODE=create|list (default: create)
#   WIDGET_NAME (default: TNF Auth Widget)
#   TURNSTILE_DOMAINS=comma,separated,domains (default includes localhost)
#   TURNSTILE_MODE=managed|invisible|non-interactive (default: managed)
#   WRITE_ENV=true|false (default: true)
#   ROOT_ENV_FILE (default: .env.local)
#   FRONTEND_ENV_FILE (default: apps/frontend/.env.local)
#   REQUIRE_TURNSTILE=true|false (default: true)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MODE="${MODE:-create}"
WIDGET_NAME="${WIDGET_NAME:-TNF Auth Widget}"
TURNSTILE_DOMAINS="${TURNSTILE_DOMAINS:-localhost,127.0.0.1,thenewfuse.com}"
TURNSTILE_MODE="${TURNSTILE_MODE:-managed}"
WRITE_ENV="${WRITE_ENV:-true}"
ROOT_ENV_FILE="${ROOT_ENV_FILE:-$ROOT_DIR/.env.local}"
FRONTEND_ENV_FILE="${FRONTEND_ENV_FILE:-$ROOT_DIR/apps/frontend/.env.local}"
REQUIRE_TURNSTILE="${REQUIRE_TURNSTILE:-true}"

if [[ -z "${ACCOUNT_ID:-}" ]]; then
  echo "Missing ACCOUNT_ID env var." >&2
  exit 1
fi
if [[ -z "${API_TOKEN:-}" ]]; then
  echo "Missing API_TOKEN env var." >&2
  exit 1
fi

CF_URL="https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/challenges/widgets"

json_parse() {
  local expr="$1"
  if command -v jq >/dev/null 2>&1; then
    jq -r "$expr"
  else
    node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));const pick=(e)=>e.split('.').filter(Boolean).reduce((a,k)=>a?.[k],d);const p='${expr#\.}';const v=pick(p)||'';process.stdout.write(String(v));"
  fi
}

upsert_env() {
  local file="$1"
  local key="$2"
  local value="$3"
  mkdir -p "$(dirname "$file")"
  touch "$file"
  if rg -n "^${key}=" "$file" >/dev/null 2>&1; then
    sed -i '' "s|^${key}=.*$|${key}=${value}|" "$file"
  else
    printf "%s=%s\n" "$key" "$value" >> "$file"
  fi
}

list_widgets() {
  curl -sS -X GET "$CF_URL" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json"
}

create_widget() {
  local domains_json
  domains_json="$(printf '%s' "$TURNSTILE_DOMAINS" | awk -F',' '
    BEGIN { printf "[" }
    {
      for (i = 1; i <= NF; i++) {
        gsub(/^[ \t]+|[ \t]+$/, "", $i)
        if ($i != "") {
          if (count > 0) printf ","
          printf "\"%s\"", $i
          count++
        }
      }
    }
    END { printf "]" }'
  )"

  curl -sS -X POST "$CF_URL" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"domains\":$domains_json,\"mode\":\"$TURNSTILE_MODE\",\"name\":\"$WIDGET_NAME\"}"
}

response="$(
  if [[ "$MODE" == "list" ]]; then
    list_widgets
  elif [[ "$MODE" == "create" ]]; then
    create_widget
  else
    echo "Unsupported MODE: $MODE (use create or list)" >&2
    exit 1
  fi
)"

success="$(printf '%s' "$response" | json_parse '.success')"
if [[ "$success" != "true" ]]; then
  echo "Cloudflare API call failed:" >&2
  printf '%s\n' "$response" >&2
  exit 1
fi

if [[ "$MODE" == "list" ]]; then
  echo "$response"
  exit 0
fi

sitekey="$(printf '%s' "$response" | json_parse '.result.sitekey')"
secret="$(printf '%s' "$response" | json_parse '.result.secret')"
widget_id="$(printf '%s' "$response" | json_parse '.result.widget_id')"
widget_name="$(printf '%s' "$response" | json_parse '.result.name')"

if [[ -z "$sitekey" || -z "$secret" ]]; then
  echo "Could not parse sitekey/secret from Cloudflare response:" >&2
  printf '%s\n' "$response" >&2
  exit 1
fi

if [[ "$WRITE_ENV" == "true" ]]; then
  upsert_env "$ROOT_ENV_FILE" "AUTH_REQUIRE_TURNSTILE" "$REQUIRE_TURNSTILE"
  upsert_env "$ROOT_ENV_FILE" "CLOUDFLARE_TURNSTILE_SECRET_KEY" "$secret"
  upsert_env "$ROOT_ENV_FILE" "VITE_TURNSTILE_SITE_KEY" "$sitekey"
  upsert_env "$ROOT_ENV_FILE" "VITE_AUTH_REQUIRE_TURNSTILE" "$REQUIRE_TURNSTILE"

  upsert_env "$FRONTEND_ENV_FILE" "VITE_TURNSTILE_SITE_KEY" "$sitekey"
  upsert_env "$FRONTEND_ENV_FILE" "VITE_AUTH_REQUIRE_TURNSTILE" "$REQUIRE_TURNSTILE"
fi

echo "Turnstile widget ready:"
echo "  widget_id: $widget_id"
echo "  name: $widget_name"
echo "  sitekey: $sitekey"
echo "  secret: [stored in env file]"
if [[ "$WRITE_ENV" == "true" ]]; then
  echo "Updated env files:"
  echo "  $ROOT_ENV_FILE"
  echo "  $FRONTEND_ENV_FILE"
fi
