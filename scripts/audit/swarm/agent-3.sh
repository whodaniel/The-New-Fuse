#!/bin/bash
# TNF Infrastructure Audit Agent - OpenRouter/DeepSeek
echo "[AGENT-3] Starting headless infrastructure audit..."

# Security headers
echo ""
echo "[AGENT-3] === SECURITY HEADERS - app.thenewfuse.com ==="
curl -sI --max-time 10 "https://app.thenewfuse.com/" 2>/dev/null | grep -iE "x-frame|x-content-type|content-security|referrer-policy|permissions-policy|strict-transport|x-powered-by|server|access-control"

echo ""
echo "[AGENT-3] === SECURITY HEADERS - api.thenewfuse.com ==="
curl -sI --max-time 10 "https://api.thenewfuse.com/" 2>/dev/null | grep -iE "x-frame|x-content-type|content-security|referrer-policy|permissions-policy|strict-transport|x-powered-by|server|access-control"

echo ""
echo "[AGENT-3] === SECURITY HEADERS - thenewfuse.com ==="
curl -sI --max-time 10 "https://thenewfuse.com/" 2>/dev/null | grep -iE "x-frame|x-content-type|content-security|referrer-policy|permissions-policy|strict-transport|x-powered-by|server|access-control"

# CORS checks
echo ""
echo "[AGENT-3] === CORS AUDIT - api.thenewfuse.com ==="
curl -sI -H "Origin: https://evil-test.com" --max-time 10 "https://api.thenewfuse.com/api/v1/health" 2>/dev/null | grep -i "access-control-allow-origin"

echo ""
echo "[AGENT-3] === CORS AUDIT - app.thenewfuse.com ==="
curl -sI -H "Origin: https://evil-test.com" --max-time 10 "https://app.thenewfuse.com/" 2>/dev/null | grep -i "access-control-allow-origin"

# DNS checks
echo ""
echo "[AGENT-3] === DNS RESOLUTION ==="
for domain in thenewfuse.com app.thenewfuse.com api.thenewfuse.com relay.thenewfuse.com extreamix.com app.extreamix.com; do
  DNS=$(dig +short "$domain" 2>/dev/null | head -1)
  if [ -z "$DNS" ]; then
    echo "NXDOMAIN: $domain"
  else
    echo "OK: $domain -> $DNS"
  fi
done

# API health checks
echo ""
echo "[AGENT-3] === API HEALTH ==="
curl -sS --max-time 10 "https://api.thenewfuse.com/health" 2>/dev/null
echo ""
curl -sS --max-time 10 "https://api.thenewfuse.com/api/v1/health" 2>/dev/null
echo ""

# Check tiny pages content
echo ""
echo "[AGENT-3] === TINY PAGE CONTENT ANALYSIS ==="
for page in docs features pricing; do
  echo "--- /$page ---"
  curl -sS -L --max-time 10 "https://app.thenewfuse.com/$page" 2>/dev/null
  echo ""
done

echo "[AGENT-3] Infrastructure audit complete."
