#!/bin/bash
export HERMES_OVERRIDE_PROVIDER=openrouter
export HERMES_OVERRIDE_MODEL=meta-llama/llama-3.3-70b-instruct
export HERMES_OVERRIDE_API_KEY=$OPENROUTER_API_KEY

echo "[AGENT-1] Starting Visual QA on app.thenewfuse.com (using openrouter)..."
DOMAIN="https://app.thenewfuse.com"

# Check each page
PAGES="/dashboard /nexus /workflows /docs /features /pricing /settings /agents /analytics /profile /marketplace /help"
for page in $PAGES; do
  URL="${DOMAIN}${page}"
  STATUS=$(curl -sS -L -o /dev/null -w '%{http_code}' --max-time 10 "$URL" 2>/dev/null)
  SIZE=$(curl -sS -L --max-time 10 "$URL" 2>/dev/null | wc -c | tr -d ' ')
  echo "[AGENT-1] $page: HTTP $STATUS (${SIZE}B)" >> $HOME/tnf-swarm-audit/agent1-visual.log
  
  if [ "$SIZE" -lt 1000 ] 2>/dev/null; then
    echo "[AGENT-1] TINY PAGE CONTENT for $page:" >> $HOME/tnf-swarm-audit/agent1-visual.log
    curl -sS -L --max-time 10 "$URL" 2>/dev/null >> $HOME/tnf-swarm-audit/agent1-visual.log
    echo "" >> $HOME/tnf-swarm-audit/agent1-visual.log
  fi
done

# Get CSS classes for visual inspection
echo "[AGENT-1] Checking CSS for contrast issues..." >> $HOME/tnf-swarm-audit/agent1-visual.log
for page in dashboard nexus workflows; do
  echo "=== $page ===" >> $HOME/tnf-swarm-audit/agent1-visual.log
  curl -sS -L --max-time 15 "${DOMAIN}/${page}" 2>/dev/null | grep -oE 'class="[^"]*"' | sort -u | head -30 >> $HOME/tnf-swarm-audit/agent1-visual.log
done

echo "[AGENT-1] Visual QA complete." >> $HOME/tnf-swarm-audit/agent1-visual.log
