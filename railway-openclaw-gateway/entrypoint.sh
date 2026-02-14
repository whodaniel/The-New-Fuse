#!/bin/bash
set -e

# Configuration Injection
echo "Configuring OpenClaw Gateway..."
node -e "
  const fs = require('fs');
  const path = require('path');
  const cfgPath = '/root/.openclaw/openclaw.json';
  const kiloAuthPath = '/root/.local/share/kilo/auth.json';

  // Update openclaw.json
  if (fs.existsSync(cfgPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));

      // Gateway Token
      if (process.env.OPENCLAW_GATEWAY_TOKEN) {
        if (!cfg.gateway) cfg.gateway = {};
        if (!cfg.gateway.auth) cfg.gateway.auth = {};
        cfg.gateway.auth.token = process.env.OPENCLAW_GATEWAY_TOKEN;
      } else if (cfg.gateway?.auth?.token === '\${OPENCLAW_GATEWAY_TOKEN}') {
        if (cfg.gateway.auth) cfg.gateway.auth.token = '';
      }

      // Port override from Railway
      if (process.env.PORT) {
        if (!cfg.gateway) cfg.gateway = {};
        cfg.gateway.port = parseInt(process.env.PORT, 10);
      }

      // Kilo API Key
      if (process.env.KILO_API_KEY) {
        if (!cfg.models) cfg.models = {};
        if (!cfg.models.providers) cfg.models.providers = {};
        if (cfg.models.providers.kilo) cfg.models.providers.kilo.apiKey = process.env.KILO_API_KEY;
        if (cfg.models.providers.kilocode) cfg.models.providers.kilocode.apiKey = process.env.KILO_API_KEY;
      }

      fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
      console.log('Updated openclaw.json configuration');
    } catch (e) {
      console.error('Error updating openclaw.json:', e);
    }
  }

  // Update kilo auth.json
  if (process.env.KILO_REFRESH_TOKEN) {
    try {
      const kiloDir = path.dirname(kiloAuthPath);
      if (!fs.existsSync(kiloDir)) {
        fs.mkdirSync(kiloDir, { recursive: true });
      }
      const auth = {
        kilo: {
          type: 'oauth',
          refresh: process.env.KILO_REFRESH_TOKEN,
          access: process.env.KILO_ACCESS_TOKEN || process.env.KILO_REFRESH_TOKEN,
          expires: Date.now() + 365 * 24 * 60 * 60 * 1000
        }
      };
      fs.writeFileSync(kiloAuthPath, JSON.stringify(auth, null, 2));
      console.log('Updated kilo auth.json');
    } catch (e) {
      console.error('Error updating kilo auth.json:', e);
    }
  }
"

# Use Railway's PORT (required for Railway deployments)
GATEWAY_PORT="${PORT:-8080}"

echo "Starting OpenClaw gateway on 0.0.0.0:${GATEWAY_PORT}..."
exec openclaw gateway start --allow-unconfigured --bind 0.0.0.0 --port "${GATEWAY_PORT}"
