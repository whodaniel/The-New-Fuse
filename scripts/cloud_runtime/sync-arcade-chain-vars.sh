#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

AI_SERVICE="${AI_SERVICE:-ai-arcade}"
API_SERVICE="${API_SERVICE:-api}"
TRIGGER_DEPLOY="${TRIGGER_DEPLOY:-false}"

required_vars=(
  ARCADE_RPC_WSS_URL
  ARCADE_RPC_HTTP_URL
  ARCADE_AUCTION_ENGINE_ADDRESS
  ARCADE_SIDEPOT_MANAGER_ADDRESS
  ARCADE_PT_HOOK_ROUTER_ADDRESS
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "ERROR: missing required env var ${var_name}"
    exit 1
  fi
done

# Frontend contract vars default to backend arcade vars when not explicitly set.
VITE_CHAIN_NETWORK="${VITE_CHAIN_NETWORK:-base}"
VITE_CHAIN_ID="${VITE_CHAIN_ID:-8453}"
VITE_CHAIN_RPC_URL="${VITE_CHAIN_RPC_URL:-${ARCADE_RPC_HTTP_URL}}"
VITE_CONTRACT_ENGINE="${VITE_CONTRACT_ENGINE:-${ARCADE_AUCTION_ENGINE_ADDRESS}}"
VITE_CONTRACT_SIDEPOT_MANAGER="${VITE_CONTRACT_SIDEPOT_MANAGER:-${ARCADE_SIDEPOT_MANAGER_ADDRESS}}"
VITE_CONTRACT_PRIZE_HOOK_ROUTER="${VITE_CONTRACT_PRIZE_HOOK_ROUTER:-${ARCADE_PT_HOOK_ROUTER_ADDRESS}}"
VITE_CONTRACT_TOKEN="${VITE_CONTRACT_TOKEN:-0x0000000000000000000000000000000000000000}"
VITE_CONTRACT_MERKABA="${VITE_CONTRACT_MERKABA:-0x0000000000000000000000000000000000000000}"
VITE_CONTRACT_GENESIS="${VITE_CONTRACT_GENESIS:-0x0000000000000000000000000000000000000000}"

if ! command -v cloud_runtime >/dev/null 2>&1; then
  echo "ERROR: cloud_runtime CLI is not installed."
  exit 1
fi

if ! cloud_runtime whoami >/dev/null 2>&1; then
  echo "ERROR: cloud_runtime CLI is not authenticated. Run: cloud_runtime login"
  exit 1
fi

echo "Syncing production arcade chain variables..."
echo "API service: ${API_SERVICE}"
echo "AI service: ${AI_SERVICE}"

api_var_args=(
  "ARCADE_RPC_WSS_URL=${ARCADE_RPC_WSS_URL}"
  "ARCADE_RPC_HTTP_URL=${ARCADE_RPC_HTTP_URL}"
  "ARCADE_AUCTION_ENGINE_ADDRESS=${ARCADE_AUCTION_ENGINE_ADDRESS}"
  "ARCADE_SIDEPOT_MANAGER_ADDRESS=${ARCADE_SIDEPOT_MANAGER_ADDRESS}"
  "ARCADE_PT_HOOK_ROUTER_ADDRESS=${ARCADE_PT_HOOK_ROUTER_ADDRESS}"
  "ARCADE_SWEEP_BLOCK_WINDOW=${ARCADE_SWEEP_BLOCK_WINDOW:-12000}"
)

mongo_uri="${MONGODB_URI:-${MONGODB_URL:-}}"
if [[ -n "${mongo_uri}" ]]; then
  api_var_args+=("MONGODB_URI=${mongo_uri}")
fi

cloud_runtime variable set --service "${API_SERVICE}" "${api_var_args[@]}"

cloud_runtime variable set --service "${AI_SERVICE}" \
  "VITE_CHAIN_NETWORK=${VITE_CHAIN_NETWORK}" \
  "VITE_CHAIN_ID=${VITE_CHAIN_ID}" \
  "VITE_CHAIN_RPC_URL=${VITE_CHAIN_RPC_URL}" \
  "VITE_CONTRACT_TOKEN=${VITE_CONTRACT_TOKEN}" \
  "VITE_CONTRACT_MERKABA=${VITE_CONTRACT_MERKABA}" \
  "VITE_CONTRACT_GENESIS=${VITE_CONTRACT_GENESIS}" \
  "VITE_CONTRACT_ENGINE=${VITE_CONTRACT_ENGINE}" \
  "VITE_CONTRACT_SIDEPOT_MANAGER=${VITE_CONTRACT_SIDEPOT_MANAGER}" \
  "VITE_CONTRACT_PRIZE_HOOK_ROUTER=${VITE_CONTRACT_PRIZE_HOOK_ROUTER}"

if [[ "${TRIGGER_DEPLOY}" == "true" ]]; then
  echo "Triggering deploy for ${AI_SERVICE}..."
  cloud_runtime up --service "${AI_SERVICE}" --detach
  echo "Triggering deploy for ${API_SERVICE}..."
  cloud_runtime up --service "${API_SERVICE}" --detach
fi

echo "Arcade production variable sync complete."
