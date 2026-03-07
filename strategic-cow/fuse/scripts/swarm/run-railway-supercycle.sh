#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REDIS_RESOLVER="${ROOT_DIR}/scripts/runtime/resolve-cloud-redis.sh"
ENVIRONMENT="${RAILWAY_ENVIRONMENT_NAME:-production}"
RUNNER_SERVICE="${RAILWAY_RUNNER_SERVICE:-}"
RUNNER_SERVICES_CSV="${RAILWAY_RUNNER_SERVICES:-api3,api,backend}"

echo "🚄 [TNF Railway Run] Executing supercycle remotely..."
echo "   Environment: $ENVIRONMENT"
if [ -n "$RUNNER_SERVICE" ]; then
  echo "   Service: $RUNNER_SERVICE"
else
  echo "   Candidate Services: $RUNNER_SERVICES_CSV"
fi

if ! command -v railway >/dev/null 2>&1; then
  echo "❌ railway CLI is not installed."
  exit 1
fi

if ! railway whoami >/dev/null 2>&1; then
  echo "❌ Not logged into Railway. Run: railway login"
  exit 1
fi

REMOTE_CMD='
set -e
ROOT=""
for d in /app /workspace /srv/app .; do
  if [ -f "$d/scripts/orchestrator/supercycle-flywheel.cjs" ]; then
    ROOT="$d"
    break
  fi
done
if [ -z "$ROOT" ]; then
  echo "❌ Could not find scripts/orchestrator/supercycle-flywheel.cjs in container"
  exit 1
fi
cd "$ROOT"
echo "📦 Running from $ROOT"
node scripts/orchestrator/supercycle-flywheel.cjs
'

if [ -n "$RUNNER_SERVICE" ]; then
  CANDIDATES=("$RUNNER_SERVICE")
else
  IFS=',' read -r -a CANDIDATES <<< "$RUNNER_SERVICES_CSV"
fi

for svc in "${CANDIDATES[@]}"; do
  echo "🔍 Trying runner service: $svc"

  RUNNER_PUBLIC_DOMAIN="$(
    railway variable list -s "$svc" -e "$ENVIRONMENT" -k 2>/dev/null \
      | sed -n 's/^RAILWAY_PUBLIC_DOMAIN=//p' \
      | head -n 1
  )"

  if [ -n "$RUNNER_PUBLIC_DOMAIN" ]; then
    echo "🌐 Waking $svc via https://$RUNNER_PUBLIC_DOMAIN/health ..."
    curl -fsS "https://$RUNNER_PUBLIC_DOMAIN/health" >/dev/null 2>&1 || true
    curl -fsS "https://$RUNNER_PUBLIC_DOMAIN/" >/dev/null 2>&1 || true
  fi

  for attempt in 1; do
    if railway ssh -s "$svc" -e "$ENVIRONMENT" "$REMOTE_CMD"; then
      echo "✅ Supercycle executed successfully on $svc"
      exit 0
    fi
    echo "⏳ SSH attempt $attempt on $svc failed..."
  done
done

echo "⚠️ SSH execution unavailable on candidates: ${CANDIDATES[*]}"
echo "   Falling back to local execution with Railway public endpoints..."

REDIS_PUBLIC_URL=""
if [ -x "$REDIS_RESOLVER" ]; then
  REDIS_PUBLIC_URL="$(RAILWAY_ENVIRONMENT_NAME="$ENVIRONMENT" "$REDIS_RESOLVER" 2>/dev/null || true)"
fi
if [ -z "$REDIS_PUBLIC_URL" ]; then
  REDIS_PUBLIC_URL="$(
    railway variable list -s Redis -e "$ENVIRONMENT" -k 2>/dev/null \
      | sed -n 's/^REDIS_PUBLIC_URL=//p' \
      | head -n 1
  )"
fi

SEARXNG_BASE_URL="$(
  railway variable list -s "${CANDIDATES[0]}" -e "$ENVIRONMENT" -k 2>/dev/null \
    | sed -n 's/^SEARXNG_BASE_URL=//p' \
    | head -n 1
)"

if [ -z "$SEARXNG_BASE_URL" ]; then
  SEARXNG_DOMAIN="$(
    railway variable list -s Redis -e "$ENVIRONMENT" -k 2>/dev/null \
      | sed -n 's/^RAILWAY_SERVICE_SEARXNG_URL=//p' \
      | head -n 1
  )"
  if [ -n "$SEARXNG_DOMAIN" ]; then
    SEARXNG_BASE_URL="https://$SEARXNG_DOMAIN"
  fi
fi

if [ -z "$REDIS_PUBLIC_URL" ]; then
  echo "❌ No production Redis URL resolved for Railway fallback."
  exit 1
fi

if [ -z "$SEARXNG_BASE_URL" ]; then
  echo "❌ SEARXNG_BASE_URL could not be resolved from Railway variables."
  exit 1
fi

echo "🌐 Local fallback with Railway endpoints:"
echo "   REDIS_URL=$REDIS_PUBLIC_URL"
echo "   SEARXNG_BASE_URL=$SEARXNG_BASE_URL"

export REDIS_URL="$REDIS_PUBLIC_URL"
export SEARXNG_BASE_URL="$SEARXNG_BASE_URL"
node scripts/orchestrator/supercycle-flywheel.cjs
