#!/usr/bin/env bash
#
# enable-hsts.sh — Enable HSTS on thenewfuse.com via Cloudflare API
#
# Prerequisites:
#   - CLOUDFLARE_API_TOKEN in env with Zone.Settings.Edit scope
#   - CLOUDFLARE_ZONE_ID in env (find in CF dashboard → Overview → API section)
#
# Usage:
#   CLOUDFLARE_API_TOKEN=*** CLOUDFLARE_ZONE_ID=*** bash enable-hsts.sh [--test]
#
# --test: enable with 5-min max-age for safe staging before committing to 1-year + preload

set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN env var}"
: "${CLOUDFLARE_ZONE_ID:?Set CLOUDFLARE_ZONE_ID env var}"

API_BASE="https://api.cloudflare.com/client/v4"

# Decide max-age + preload based on --test flag
if [[ "${1:-}" == "--test" ]]; then
  MAX_AGE=300       # 5 minutes (safe to roll back instantly)
  INCLUDE_SUBDOMAINS=false
  PRELOAD=false
  echo "🧪 TEST MODE: max-age=300s, no subdomains, no preload"
else
  MAX_AGE=31536000  # 1 year
  INCLUDE_SUBDOMAINS=true
  PRELOAD=true
  echo "🔒 PRODUCTION MODE: max-age=1y, subdomains, preload"
fi

echo "▶ Enabling HSTS on zone $CLOUDFLARE_ZONE_ID..."
curl -X PATCH "$API_BASE/zones/$CLOUDFLARE_ZONE_ID/settings/security_header" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"value\": {\"strict_transport_security\": {\"enabled\": true, \"max_age\": $MAX_AGE, \"include_subdomains\": $INCLUDE_SUBDOMAINS, \"preload\": $PRELOAD, \"nosniff\": true}}}" \
  | tee /tmp/hsts-patch-result.json

echo ""
echo "▶ Verifying response..."
if grep -q '"success":true' /tmp/hsts-patch-result.json; then
  echo "✅ HSTS enabled successfully"
  echo ""
  echo "▶ Probe now:"
  echo "   curl -sI https://thenewfuse.com | grep -i strict-transport-security"
else
  echo "❌ HSTS enable failed — check /tmp/hsts-patch-result.json"
  exit 1
fi
