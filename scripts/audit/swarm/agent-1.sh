#!/bin/bash
# TNF Visual QA Agent - OpenRouter/Kimi
export HERMES_OVERRIDE_PROVIDER=openrouter
export HERMES_OVERRIDE_MODEL=moonshotai/kimi-k2.6

echo "[AGENT-1] Starting Visual QA on app.thenewfuse.com..."

# Check each page with curl first, then try webpilot
PAGES="/dashboard /nexus /workflows /docs /features /pricing /settings /agents /analytics /profile /marketplace /help"
DOMAIN="https://app.thenewfuse.com"

for page in $PAGES; do
  URL="${DOMAIN}${page}"
  STATUS=$(curl -sS -L -o /dev/null -w '%{http_code}' --max-time 10 "$URL" 2>/dev/null)
  SIZE=$(curl -sS -L --max-time 10 "$URL" 2>/dev/null | wc -c | tr -d ' ')
  echo "[AGENT-1] $page: HTTP $STATUS (${SIZE}B)"
  
  # Get the actual content for tiny pages
  if [ "$SIZE" -lt 1000 ] 2>/dev/null; then
    echo "[AGENT-1] TINY PAGE CONTENT for $page:"
    curl -sS -L --max-time 10 "$URL" 2>/dev/null
    echo ""
  fi
done

# Deep check - get CSS/color info from the main pages
echo ""
echo "[AGENT-1] Checking dashboard CSS classes..."
curl -sS -L --max-time 15 "${DOMAIN}/dashboard" 2>/dev/null | grep -oP 'class="[^"]*"' | sort -u | head -50

echo ""
echo "[AGENT-1] Checking nexus page content..."
curl -sS -L --max-time 15 "${DOMAIN}/nexus" 2>/dev/null | grep -oP 'class="[^"]*"' | sort -u | head -50

echo ""
echo "[AGENT-1] Checking workflows page content..."
curl -sS -L --max-time 15 "${DOMAIN}/workflows" 2>/dev/null | grep -oP 'class="[^"]*"' | sort -u | head -50

echo "[AGENT-1] Visual QA complete."
