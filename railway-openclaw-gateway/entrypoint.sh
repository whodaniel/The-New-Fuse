#!/bin/bash
set -e

# Cache bust: 2026-02-16T02:55:00Z - FIX RESTORE
echo ">>> STARTING ENTRYPOINT SCRIPT - DEBUG MODE" >&2

# Railway persistent volume path used by OpenClaw runtime.
STATE_DIR="${OPENCLAW_STATE_DIR:-/data/.openclaw}"
CONFIG_PATH="${OPENCLAW_CONFIG_PATH:-${STATE_DIR}/openclaw.json}"
AUTH_PROFILES_PATH="${STATE_DIR}/agents/main/agent/auth-profiles.json"
ROOT_CONFIG_PATH="/root/.openclaw/openclaw.json"

echo ">>> STATE_DIR=${STATE_DIR}" >&2
echo ">>> AUTH_PROFILES_PATH=${AUTH_PROFILES_PATH}" >&2

# Check env vars
if [ -n "$ANTHROPIC_OAUTH_ACCESS_TOKEN" ]; then
  echo ">>> ANTHROPIC_OAUTH_ACCESS_TOKEN is set" >&2
else
  echo ">>> ANTHROPIC_OAUTH_ACCESS_TOKEN is unset" >&2
fi

ENV_CONTEXT="$(printf '%s' "${OPENCLAW_ENVIRONMENT:-${ENVIRONMENT:-${NODE_ENV:-${RAILWAY_ENVIRONMENT:-unknown}}}}" | tr '[:upper:]' '[:lower:]')"
case "${ENV_CONTEXT}" in
  local|localhost|devlocal|development|dev|test)
    IS_LOCAL_ENV=1
    ;;
  *)
    IS_LOCAL_ENV=0
    ;;
esac

if [ "${IS_LOCAL_ENV}" -eq 0 ] && [ -z "${OPENCLAW_GATEWAY_TOKEN:-}" ]; then
  echo ">>> FATAL: OPENCLAW_GATEWAY_TOKEN is required in non-local environment (${ENV_CONTEXT})" >&2
  exit 1
fi

# Seed runtime config from image defaults if missing.
mkdir -p "$(dirname "${CONFIG_PATH}")" "$(dirname "${AUTH_PROFILES_PATH}")"
if [ ! -f "${CONFIG_PATH}" ] && [ -f "${ROOT_CONFIG_PATH}" ]; then
  cp "${ROOT_CONFIG_PATH}" "${CONFIG_PATH}"
fi

# Configuration Injection
echo "Configuring OpenClaw Gateway..." >&2
node -e "
  const fs = require('fs');
  const path = require('path');
  const cfgPath = process.env.OPENCLAW_CONFIG_PATH || '/data/.openclaw/openclaw.json';
  const rootCfgPath = '/root/.openclaw/openclaw.json';
  const kiloAuthPath = '/root/.local/share/kilo/auth.json';
  const authProfilesPath = process.env.OPENCLAW_AUTH_PROFILES_PATH || '/data/.openclaw/agents/main/agent/auth-profiles.json';

  const toBool = (value) => String(value || '').toLowerCase() === 'true';

  function updateConfig(configPath) {
    if (!fs.existsSync(configPath)) {
      console.error('Config file not found:', configPath);
      return;
    }

    try {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));

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
      // Don't set bind in config - let CLI flag handle it (proxy.js passes --bind all)

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

        const primaryModel = process.env.OPENCLAW_MODEL_PRIMARY || 'openai-codex/gpt-5.2-codex';
        const fallbackModels = (process.env.OPENCLAW_MODEL_FALLBACKS || 'openai-codex/gpt-5.1-codex,openai-codex/gpt-5-mini')
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean);

        cfg.agents.defaults.model.primary = primaryModel;
        cfg.agents.defaults.model.fallbacks = fallbackModels;
        console.error('Configured Codex default model routing');
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
        console.error('Configured UI branding');
      }

      // Discord Channel
      if (process.env.OPENCLAW_CHANNELS_DISCORD_TOKEN) {
        if (!cfg.channels) cfg.channels = {};
        if (!cfg.channels.discord) cfg.channels.discord = {};
        cfg.channels.discord.enabled = true;
        cfg.channels.discord.token = process.env.OPENCLAW_CHANNELS_DISCORD_TOKEN;
        cfg.channels.discord.groupPolicy = 'allowlist';
        if (!cfg.channels.discord.dm) cfg.channels.discord.dm = { policy: 'pairing' };
        console.error('Configured Discord channel');
      }

      fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
      console.error('Updated config:', configPath);
    } catch (e) {
      console.error('Error updating config at', configPath, ':', e);
    }
  }

  // Update both the persistent volume config and the root config
  // This ensures the gateway finds valid config regardless of which path it reads
  updateConfig(cfgPath);
  updateConfig(rootCfgPath);

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
      console.error('Updated auth-profiles.json for openai-codex OAuth');
    } catch (e) {
      console.error('Error updating auth-profiles.json:', e);
    }
  }

  // Update auth-profiles.json for Anthropic OAuth (Claude subscription)
  if (process.env.ANTHROPIC_OAUTH_REFRESH_TOKEN || process.env.ANTHROPIC_OAUTH_ACCESS_TOKEN) {
    try {
      console.error('>>> Processing Anthropic OAuth...');
      const authDir = path.dirname(authProfilesPath);
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
      }

      const now = Date.now();
      const defaultExpiry = now + 24 * 60 * 60 * 1000; // 24 hours
      const profileKey = 'anthropic:default';
      const refreshToken = process.env.ANTHROPIC_OAUTH_REFRESH_TOKEN || '';
      const accessToken = process.env.ANTHROPIC_OAUTH_ACCESS_TOKEN || refreshToken;
      const expires = Number(process.env.ANTHROPIC_OAUTH_EXPIRES || defaultExpiry);

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
        provider: 'anthropic',
        access: accessToken,
        refresh: refreshToken,
        expires
      };

      authProfiles.lastGood['anthropic'] = profileKey;

      fs.writeFileSync(authProfilesPath, JSON.stringify(authProfiles, null, 2));
      console.error('Updated auth-profiles.json for Anthropic OAuth');
    } catch (e) {
      console.error('Error updating auth-profiles.json for Anthropic:', e);
    }
  }

  // Update auth-profiles.json for Google Antigravity OAuth (fallback)
  if (process.env.GOOGLE_ANTIGRAVITY_REFRESH_TOKEN || process.env.GOOGLE_ANTIGRAVITY_ACCESS_TOKEN) {
    try {
      const authDir = path.dirname(authProfilesPath);
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
      }

      const now = Date.now();
      const defaultExpiry = now + 60 * 60 * 1000; // 1 hour
      const profileKey = process.env.GOOGLE_ANTIGRAVITY_PROFILE_KEY || 'google-antigravity:default';
      const refreshToken = process.env.GOOGLE_ANTIGRAVITY_REFRESH_TOKEN || '';
      const accessToken = process.env.GOOGLE_ANTIGRAVITY_ACCESS_TOKEN || refreshToken;
      const expires = Number(process.env.GOOGLE_ANTIGRAVITY_EXPIRES || defaultExpiry);
      const email = process.env.GOOGLE_ANTIGRAVITY_EMAIL || '';
      const projectId = process.env.GOOGLE_ANTIGRAVITY_PROJECT_ID || '';

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
          console.warn('auth-profiles.json parse failed, rebuilding:', parseErr.message);
        }
      }

      const profile = {
        type: 'oauth',
        provider: 'google-antigravity',
        access: accessToken,
        refresh: refreshToken,
        expires
      };
      if (email) profile.email = email;
      if (projectId) profile.projectId = projectId;

      authProfiles.profiles[profileKey] = profile;
      authProfiles.lastGood['google-antigravity'] = profileKey;

      fs.writeFileSync(authProfilesPath, JSON.stringify(authProfiles, null, 2));
      console.error('Updated auth-profiles.json for Google Antigravity OAuth');
    } catch (e) {
      console.error('Error updating auth-profiles.json for Google Antigravity:', e);
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
      console.error('Updated kilo auth.json');
    } catch (e) {
      console.error('Error updating kilo auth.json:', e);
    }
  }
"

# Use Railway's PORT (required for Railway deployments)
GATEWAY_PORT="${PORT:-8080}"

echo ">>> VERIFYING AUTH FILE..." >&2
ls -la "${AUTH_PROFILES_PATH}" || echo "AUTH FILE NOT FOUND" >&2
if [ -r "${AUTH_PROFILES_PATH}" ]; then
  echo ">>> AUTH FILE READABLE (contents redacted)" >&2
else
  echo ">>> CANNOT READ AUTH FILE" >&2
fi

echo "Starting OpenClaw gateway on bind=all port=${GATEWAY_PORT}..." >&2
export OPENCLAW_CONFIG_PATH="${CONFIG_PATH}"
export OPENCLAW_AUTH_PROFILES_PATH="${AUTH_PROFILES_PATH}"
exec node /proxy.js "$@"
