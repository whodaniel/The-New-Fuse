#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"
LOG_FILE="${TMPDIR:-/tmp}/tnf-api-smoke.log"
PORT="${PORT:-3001}"
HOST="${HOST:-127.0.0.1}"
BASE_URL="http://${HOST}:${PORT}"
JWT_SECRET="${JWT_SECRET:-local-dev-secret}"
STARTUP_WAIT_SEC="${STARTUP_WAIT_SEC:-90}"
FAILURES=0
WARNINGS=0

# Load local env for smoke runs when shell env is empty.
if [[ -z "${DATABASE_URL:-}" ]] && [[ -f "$ROOT_DIR/.env" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ROOT_DIR/.env" && set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[smoke] DATABASE_URL is required. Export DATABASE_URL or set it in $ROOT_DIR/.env"
  exit 1
fi

has_provider_keys() {
  [[ -n "${OPENAI_API_KEY:-}" ]] || [[ -n "${ANTHROPIC_API_KEY:-}" ]] || [[ -n "${GEMINI_API_KEY:-}" ]] || [[ -n "${MISTRAL_API_KEY:-}" ]] || [[ -n "${AZURE_OPENAI_API_KEY:-}" ]]
}

echo "[smoke] building api..."
cd "$API_DIR"
pnpm build >/dev/null

echo "[smoke] starting api on ${BASE_URL}..."
JWT_SECRET="$JWT_SECRET" NODE_ENV=development PORT="$PORT" node dist/main.js >"$LOG_FILE" 2>&1 &
PID=$!

cleanup() {
  kill "$PID" >/dev/null 2>&1 || true
  wait "$PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

sleep 8

if ! kill -0 "$PID" >/dev/null 2>&1; then
  echo "[smoke] api process exited before probes"
  tail -n 80 "$LOG_FILE" || true
  exit 1
fi

echo "[smoke] waiting for health endpoint..."
READY=0
for _ in $(seq 1 "${STARTUP_WAIT_SEC}"); do
  if ! kill -0 "$PID" >/dev/null 2>&1; then
    echo "[smoke] api process exited during startup wait"
    tail -n 80 "$LOG_FILE" || true
    exit 1
  fi

  code="$(curl -sS -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" || true)"
  if [[ "$code" =~ ^2[0-9][0-9]$ ]]; then
    READY=1
    break
  fi

  sleep 1
done

if [[ "$READY" -ne 1 ]]; then
  echo "[smoke] health endpoint did not become ready in ${STARTUP_WAIT_SEC}s"
  tail -n 80 "$LOG_FILE" || true
  exit 1
fi

probe() {
  local method="$1"
  local path="$2"
  local expected_regex="${3:-^[1-5][0-9][0-9]$}"
  local body="${4:-}"
  local out
  out="$(mktemp)"

  if [[ -n "$body" ]]; then
    code="$(curl -sS -o "$out" -w "%{http_code}" -X "$method" "$BASE_URL$path" -H "Content-Type: application/json" --data "$body" || true)"
  else
    code="$(curl -sS -o "$out" -w "%{http_code}" -X "$method" "$BASE_URL$path" || true)"
  fi

  echo "=== $method $path -> HTTP $code ==="
  head -c 500 "$out"
  echo

  if ! [[ "$code" =~ $expected_regex ]]; then
    echo "[smoke] expected status pattern $expected_regex but got $code for $method $path"
    FAILURES=$((FAILURES + 1))
  fi

  rm -f "$out"
}

probe_ai() {
  local path="$1"
  local body="$2"
  local out
  out="$(mktemp)"
  local code

  code="$(curl -sS -o "$out" -w "%{http_code}" -X POST "$BASE_URL$path" -H "Content-Type: application/json" --data "$body" || true)"

  echo "=== POST $path -> HTTP $code ==="
  head -c 500 "$out"
  echo

  if has_provider_keys; then
    if [[ "$code" == "500" || "$code" == "000" ]]; then
      echo "[smoke] provider keys detected but $path returned $code"
      FAILURES=$((FAILURES + 1))
    fi
  else
    if [[ "$code" =~ ^2[0-9][0-9]$ ]]; then
      echo "[smoke] provider keys absent but $path returned success; continuing"
      WARNINGS=$((WARNINGS + 1))
    elif [[ "$code" == "500" || "$code" == "000" ]]; then
      echo "[smoke] provider keys absent but $path returned hard failure code $code"
      FAILURES=$((FAILURES + 1))
    elif [[ ! "$code" =~ ^[1-5][0-9][0-9]$ ]]; then
      echo "[smoke] unexpected status $code for $path without provider keys"
      FAILURES=$((FAILURES + 1))
    fi
  fi

  rm -f "$out"
}

probe GET /api/health '^2[0-9][0-9]$'
probe GET /api/system/logs '^([1-5][0-9][0-9])$'
probe GET /api/a2a/system/stats '^([1-5][0-9][0-9])$'
probe GET /api/a2a/status '^([1-5][0-9][0-9])$'
probe_ai /api/ai/text-completion '{"prompt":"healthcheck"}'
probe_ai /api/ai/image-generation '{"prompt":"healthcheck image"}'
probe GET /api/chat/chats '^(200|401|403)$'

echo
echo "[smoke] last server log lines:"
tail -n 40 "$LOG_FILE" || true

if [[ "$FAILURES" -gt 0 ]]; then
  echo "[smoke] failed with $FAILURES probe error(s) and $WARNINGS warning(s)"
  exit 1
fi

echo "[smoke] all required probes passed with $WARNINGS warning(s)"
