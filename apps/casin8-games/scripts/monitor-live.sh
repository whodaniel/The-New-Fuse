#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://casin8-games-production-b06e.up.railway.app}"

echo "BASE_URL=$BASE_URL"
echo

echo "[1/5] Health"
curl -sS "${BASE_URL}/api/health" | jq -c '.'
echo

echo "[2/5] Chain Config"
curl -sS "${BASE_URL}/api/chain-config" | jq -c '.'
echo

echo "[3/5] Metrics"
curl -sS "${BASE_URL}/api/metrics" | jq -c '.'
echo

echo "[4/5] Roundtrip Session + Play"
SESSION_JSON="$(curl -sS -X POST "${BASE_URL}/api/session" \
  -H 'content-type: application/json' \
  -d '{"playerName":"MonitorBot","clientSeed":"monitor-seed-1","tableId":"monitor"}')"
SESSION_ID="$(printf '%s' "$SESSION_JSON" | jq -r '.session.sessionId')"
printf '%s\n' "$SESSION_JSON" | jq -c '.'
PLAY_JSON="$(curl -sS -X POST "${BASE_URL}/api/play" \
  -H 'content-type: application/json' \
  -d "{\"sessionId\":\"${SESSION_ID}\",\"game\":\"slots\",\"bet\":1}")"
printf '%s\n' "$PLAY_JSON" | jq -c '.ok,.round.game,.round.bet,.round.delta'
echo

echo "[5/5] Subdomain TLS Status"
for sub in poker blackjack roulette slots; do
  host="${sub}.ai-arcade.xyz"
  printf '%s -> ' "$host"
  if curl -sS -I "https://${host}" >/dev/null 2>&1; then
    echo "TLS_OK"
  else
    echo "TLS_PENDING_OR_ERROR"
  fi
done
