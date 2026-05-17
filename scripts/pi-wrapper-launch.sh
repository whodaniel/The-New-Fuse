#!/bin/bash
# pi-wrapper-launch.sh — Source .env then exec the Pi Redis Wrapper
# This is the entrypoint used by launchd; it parses .env into exports
# and then execs node with the wrapper script.

set -euo pipefail

TNF_ROOT="/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse"
ENV_FILE="${TNF_ROOT}/.env"
WRAPPER_SCRIPT="${TNF_ROOT}/scripts/pi-redis-wrapper.cjs"
NODE_BIN="/usr/local/bin/node"

# ── Load .env (simple KEY=VALUE parser, skips comments & blanks) ──
if [[ -f "$ENV_FILE" ]]; then
    while IFS='=' read -r key value; do
        # Skip comments and blank lines
        [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
        # Trim whitespace
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        # Export it (override what launchd already set if needed)
        export "$key=$value"
    done < "$ENV_FILE"
else
    echo "[pi-wrapper-launch] FATAL: .env not found at ${ENV_FILE}" >&2
    exit 1
fi

# ── Parse REDIS_URL into REDIS_HOST / REDIS_PORT / REDIS_PASSWORD ──
# The wrapper's RedisAgentClient reads these separately; .env only has REDIS_URL.
if [[ -n "${REDIS_URL:-}" ]]; then
    # Strip the redis:// or rediss:// prefix for URL parsing
    REDIS_URL_NORMALIZED="${REDIS_URL#*://}"
    # Extract password (between : and @)
    if [[ "$REDIS_URL_NORMALIZED" =~ ^([^:@]+):([^@]+)@([^:]+):([0-9]+)$ ]]; then
        export REDIS_HOST="${BASH_REMATCH[3]}"
        export REDIS_PORT="${BASH_REMATCH[4]}"
        export REDIS_PASSWORD="${BASH_REMATCH[2]}"
    fi
fi

# ── Ensure required vars are present ──
for var in REDIS_URL REDIS_HOST REDIS_PORT REDIS_PASSWORD; do
    if [[ -z "${!var:-}" ]]; then
        echo "[pi-wrapper-launch] WARNING: ${var} is not set" >&2
    fi
done

echo "[pi-wrapper-launch] Starting Pi Redis Wrapper..."
echo "[pi-wrapper-launch]   PI_PROVIDER=${PI_PROVIDER:-not set}"
echo "[pi-wrapper-launch]   PI_MODEL=${PI_MODEL:-not set}"
echo "[pi-wrapper-launch]   PI_VALIDATION_MODE=${PI_VALIDATION_MODE:-not set}"
echo "[pi-wrapper-launch]   PI_ENABLE_HANDOFF=${PI_ENABLE_HANDOFF:-not set}"
echo "[pi-wrapper-launch]   PI_ENABLE_MODEL_WATCHDOG=${PI_ENABLE_MODEL_WATCHDOG:-not set}"
echo "[pi-wrapper-launch]   REDIS_HOST=${REDIS_HOST:-not set}"
echo "[pi-wrapper-launch]   REDIS_PORT=${REDIS_PORT:-not set}"
echo "[pi-wrapper-launch]   REDIS_PASSWORD=${REDIS_PASSWORD:+***set***}"

# ── Exec node with the wrapper ──
cd "$TNF_ROOT"
exec "$NODE_BIN" "$WRAPPER_SCRIPT"
