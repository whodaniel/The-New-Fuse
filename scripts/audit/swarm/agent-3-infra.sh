#!/bin/bash
export HERMES_OVERRIDE_PROVIDER=openrouter
export HERMES_OVERRIDE_MODEL=deepseek/deepseek-chat-v3-0324
export HERMES_OVERRIDE_API_KEY=$OPENROUTER_API_KEY

echo "[AGENT-3] Starting headless infrastructure audit (using openrouter/deepseek)..." >> $HOME/tnf-swarm-audit/agent3-infra.log

# Security headers
echo "" >> $HOME/tnf-swarm-audit/agent3-infra.log
echo "[AGENT-3] === SECURITY HEADERS ===" >> $HOME/tnf-swarm-audit/agent3-infra.log
for domain in app.thenewfuse.com api.thenewfuse.com thenewfuse.com; do
  echo "--- $domain ---" >> $HOME/tnf-swarm-audit/agent3-infra.log
  curl -sI --max-time 10 "https://$domain/" 2>/dev/null | grep -iE "x-frame|x-content-type|content-security|referrer-policy|permissions-policy|strict-transport|x-powered-by|server|access-control" >> $HOME/tnf-swarm-audit/agent3-infra.log
done

# CORS checks
echo "" >> $HOME/tnf-swarm-audit/agent3-infra.log
echo "[AGENT-3] === CORS AUDIT ===" >> $HOME/tnf-swarm-audit/agent3-infra.log
curl -sI -H "Origin: https://evil-test.com" --max-time 10 "https://api.thenewfuse.com/api/v1/health" 2>/dev/null | grep -iE "access-control-allow-origin" >> $HOME/tnf-swarm-audit/agent3-infra.log
curl -sI -H "Origin: https://evil-test.com" --max-time 10 "https://app.thenewfuse.com/" 2>/dev/null | grep -iE "access-control-allow-origin" >> $HOME/tnf-swarm-audit/agent3-infra.log

# DNS checks
echo "" >> $HOME/tnf-swarm-audit/agent3-infra.log
echo "[AGENT-3] === DNS RESOLUTION ===" >> $HOME/tnf-swarm-audit/agent3-infra.log
for domain in thenewfuse.com app.thenewfuse.com api.thenewfuse.com relay.thenewfuse.com extreamix.com app.extreamix.com; do
  DNS=$(dig +short "$domain" 2>/dev/null | head -1)
  if [ -z "$DNS" ]; then
    echo "NXDOMAIN: $domain" >> $HOME/tnf-swarm-audit/agent3-infra.log
  else
    echo "OK: $domain -> $DNS" >> $HOME/tnf-swarm-audit/agent3-infra.log
  fi
done

# API health
echo "" >> $HOME/tnf-swarm-audit/agent3-infra.log
echo "[AGENT-3] === API HEALTH ===" >> $HOME/tnf-swarm-audit/agent3-infra.log
curl -sS --max-time 10 "https://api.thenewfuse.com/health" 2>/dev/null >> $HOME/tnf-swarm-audit/agent3-infra.log
echo "" >> $HOME/tnf-swarm-audit/agent3-infra.log
curl -sS --max-time 10 "https://api.thenewfuse.com/api/v1/health" 2>/dev/null >> $HOME/tnf-swarm-audit/agent3-infra.log

# Tiny pages content
echo "" >> $HOME/tnf-swarm-audit/agent3-infra.log
echo "[AGENT-3] === TINY PAGE CONTENT ===" >> $HOME/tnf-swarm-audit/agent3-infra.log
for page in docs features pricing; do
  echo "--- /$page ---" >> $HOME/tnf-swarm-audit/agent3-infra.log
  curl -sS -L --max-time 10 "https://app.thenewfuse.com/$page" 2>/dev/null >> $HOME/tnf-swarm-audit/agent3-infra.log
  echo "" >> $HOME/tnf-swarm-audit/agent3-infra.log
done

echo "[AGENT-3] Infrastructure audit complete." >> $HOME/tnf-swarm-audit/agent3-infra.log
