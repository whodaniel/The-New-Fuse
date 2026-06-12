#!/bin/bash
# Pi Redis Wrapper launchd helper — sources .env then runs the node script
set -euo pipefail

TNF_ROOT="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse"
cd "$TNF_ROOT"

# Source .env if present
if [ -f "$TNF_ROOT/.env" ]; then
    set -a
    source "$TNF_ROOT/.env"
    set +a
fi

source /Users/danielgoldberg/.tnf-claude-env
export AGENT_ID="tnf-pi-redis-wrapper"

# Set Pi-specific env vars (override .env if needed)
export PI_PROVIDER="${PI_PROVIDER:-google}"
export PI_MODEL="${PI_MODEL:-gemini-2.5-flash}"
export PI_VALIDATION_MODE="${PI_VALIDATION_MODE:-off}"
export PI_ENABLE_HANDOFF="${PI_ENABLE_HANDOFF:-true}"
export PI_ENABLE_MODEL_WATCHDOG="${PI_ENABLE_MODEL_WATCHDOG:-true}"
export NODE_OPTIONS="--max-old-space-size=256"
export NODE_PATH="/Users/danielgoldberg/.tnf/pi-wrapper-deps/node_modules"
export PATH="/Users/danielgoldberg/.hermes/node/bin:/Users/danielgoldberg/Library/pnpm:/usr/local/bin:/usr/bin:/bin:$PATH"

exec /Users/danielgoldberg/.nvm/versions/node/v20.20.2/bin/node "$TNF_ROOT/scripts/pi-redis-wrapper.cjs"
