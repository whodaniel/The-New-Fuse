#!/bin/bash
set -e

# Override config values from Railway env vars if provided
if [ -n "$KILO_API_KEY" ]; then
  echo "Injecting KILO_API_KEY into openclaw.json..."
  # Use node to safely update JSON
  node -e "
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync('/root/.openclaw/openclaw.json','utf8'));
    if(cfg.models?.providers?.kilo) cfg.models.providers.kilo.apiKey = process.env.KILO_API_KEY;
    if(cfg.models?.providers?.kilocode) cfg.models.providers.kilocode.apiKey = process.env.KILO_API_KEY;
    fs.writeFileSync('/root/.openclaw/openclaw.json', JSON.stringify(cfg, null, 2));
  "
fi

if [ -n "$KILO_REFRESH_TOKEN" ]; then
  echo "Injecting Kilo auth tokens..."
  node -e "
    const fs = require('fs');
    const auth = {kilo:{type:'oauth',refresh:process.env.KILO_REFRESH_TOKEN,access:process.env.KILO_ACCESS_TOKEN||process.env.KILO_REFRESH_TOKEN,expires:Date.now()+365*24*60*60*1000}};
    fs.writeFileSync('/root/.local/share/kilo/auth.json', JSON.stringify(auth, null, 2));
  "
fi

# Use Railway's PORT if available, otherwise default
GATEWAY_PORT="${PORT:-${OPENCLAW_GATEWAY_PORT:-18789}}"
GATEWAY_BIND="${OPENCLAW_GATEWAY_BIND:-0.0.0.0}"

echo "Starting OpenClaw gateway on ${GATEWAY_BIND}:${GATEWAY_PORT}..."
# In cloud environments, we MUST bind to 0.0.0.0 and use the injected PORT
exec openclaw gateway --allow-unconfigured --port "${GATEWAY_PORT}" --bind "${GATEWAY_BIND}"

