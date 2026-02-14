#!/bin/bash
set -e

# Railway persistent volume path used by OpenClaw runtime.
STATE_DIR="${OPENCLAW_STATE_DIR:-/data/.openclaw}"
CONFIG_PATH="${OPENCLAW_CONFIG_PATH:-${STATE_DIR}/openclaw.json}"
AUTH_PROFILES_PATH="${STATE_DIR}/agents/main/agent/auth-profiles.json"

# Seed runtime config from image defaults if missing.
mkdir -p "$(dirname "${CONFIG_PATH}")" "$(dirname "${AUTH_PROFILES_PATH}")"
if [ ! -f "${CONFIG_PATH}" ] && [ -f /root/.openclaw/openclaw.json ]; then
  cp /root/.openclaw/openclaw.json "${CONFIG_PATH}"
fi

# Configuration Injection
echo "Configuring OpenClaw Gateway..."
node -e "
  const fs = require('fs');
  const path = require('path');
  const cfgPath = process.env.OPENCLAW_CONFIG_PATH || '/data/.openclaw/openclaw.json';
  const kiloAuthPath = '/root/.local/share/kilo/auth.json';
  const authProfilesPath = process.env.OPENCLAW_AUTH_PROFILES_PATH || '/data/.openclaw/agents/main/agent/auth-profiles.json';

  const toBool = (value) => String(value || '').toLowerCase() === 'true';

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
      // Note: If using proxy.js, the gateway should listen on the internal port (19001)
      if (process.env.PORT) {
        if (!cfg.gateway) cfg.gateway = {};
        cfg.gateway.port = parseInt(process.env.OPENCLAW_INTERNAL_PORT || '19001', 10);
      }

      // Railway runtime should run the foreground gateway process directly
      // and bypass service-manager assumptions.
      if (!cfg.gateway) cfg.gateway = {};
      cfg.gateway.mode = process.env.OPENCLAW_GATEWAY_MODE || 'local';

      // Kilo API Key
      if (process.env.KILO_API_KEY) {
        if (!cfg.models) cfg.models = {};
        if (!cfg.models.providers) cfg.models.providers = {};
        if (cfg.models.providers.kilo) cfg.models.providers.kilo.apiKey = process.env.KILO_API_KEY;
        if (cfg.models.providers.kilocode) cfg.models.providers.kilocode.apiKey = process.env.KILO_API_KEY;
      }

      // Optional: switch default model to Codex OAuth-backed model
      const codexOAuthEnabled = toBool(process.env.OPENCLAW_USE_CODEX_OAUTH) ||
        !!process.env.OPENAI_CODEX_REFRESH_TOKEN ||
        !!process.env.OPENAI_CODEX_ACCESS_TOKEN;

      if (codexOAuthEnabled) {
        if (!cfg.agents) cfg.agents = {};
        if (!cfg.agents.defaults) cfg.agents.defaults = {};
        if (!cfg.agents.defaults.model) cfg.agents.defaults.model = {};

        const primaryModel = process.env.OPENCLAW_MODEL_PRIMARY || 'copilot-proxy/gpt-5.2-codex';
        const fallbackModels = (process.env.OPENCLAW_MODEL_FALLBACKS || 'copilot-proxy/gpt-5.1-codex,copilot-proxy/gpt-5-mini')
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean);

        cfg.agents.defaults.model.primary = primaryModel;
        cfg.agents.defaults.model.fallbacks = fallbackModels;
        console.log('Configured Codex default model routing');
      }

      // UI Branding
      if (process.env.OPENCLAW_UI_ASSISTANT_NAME || process.env.OPENCLAW_UI_ASSISTANT_AVATAR) {
        if (!cfg.ui) cfg.ui = {};
        if (!cfg.ui.assistant) cfg.ui.assistant = {};
        if (process.env.OPENCLAW_UI_ASSISTANT_NAME) {
          cfg.ui.assistant.name = process.env.OPENCLAW_UI_ASSISTANT_NAME;
        }
        if (process.env.OPENCLAW_UI_ASSISTANT_AVATAR) {
          cfg.ui.assistant.avatar = process.env.OPENCLAW_UI_ASSISTANT_AVATAR;
        }
        console.log('Configured UI branding');
      }

      fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
      console.log('Updated openclaw.json configuration');
    } catch (e) {
      console.error('Error updating openclaw.json:', e);
    }
  }

  // Update OpenClaw auth-profiles.json for Codex OAuth
  if (process.env.OPENAI_CODEX_REFRESH_TOKEN || process.env.OPENAI_CODEX_ACCESS_TOKEN) {
    try {
      const authDir = path.dirname(authProfilesPath);
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
      }

      const now = Date.now();
      const defaultExpiry = now + 30 * 24 * 60 * 60 * 1000; // 30 days
      const profileKey = process.env.OPENAI_CODEX_PROFILE_KEY || 'openai-codex:default';
      const accountId = process.env.OPENAI_CODEX_ACCOUNT_ID || 'default';
      const refreshToken = process.env.OPENAI_CODEX_REFRESH_TOKEN || '';
      const accessToken = process.env.OPENAI_CODEX_ACCESS_TOKEN || refreshToken;
      const expires = Number(process.env.OPENAI_CODEX_EXPIRES || defaultExpiry);

      let authProfiles = {
        version: 1,
        profiles: {},
        order: {},
        lastGood: {},
        usageStats: {}
      };

      if (fs.existsSync(authProfilesPath)) {
        try {
          const raw = JSON.parse(fs.readFileSync(authProfilesPath, 'utf8'));
          if (raw && typeof raw === 'object') {
            authProfiles = {
              version: raw.version || 1,
              profiles: raw.profiles || {},
              order: raw.order || {},
              lastGood: raw.lastGood || {},
              usageStats: raw.usageStats || {}
            };
          }
        } catch (parseErr) {
          console.warn('auth-profiles.json parse failed, rebuilding file:', parseErr.message);
        }
      }

      authProfiles.profiles[profileKey] = {
        type: 'oauth',
        provider: 'openai-codex',
        accountId,
        access: accessToken,
        refresh: refreshToken,
        expires
      };

      const existingOrder = Array.isArray(authProfiles.order['openai-codex'])
        ? authProfiles.order['openai-codex']
        : [];
      authProfiles.order['openai-codex'] = [profileKey, ...existingOrder.filter((k) => k !== profileKey)];
      authProfiles.lastGood['openai-codex'] = profileKey;

      fs.writeFileSync(authProfilesPath, JSON.stringify(authProfiles, null, 2));
      console.log('Updated auth-profiles.json for openai-codex OAuth');
    } catch (e) {
      console.error('Error updating auth-profiles.json:', e);
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

echo "Starting OpenClaw gateway on bind=lan port=${GATEWAY_PORT}..."
export OPENCLAW_CONFIG_PATH="${CONFIG_PATH}"
export OPENCLAW_AUTH_PROFILES_PATH="${AUTH_PROFILES_PATH}"
exec node /proxy.js
