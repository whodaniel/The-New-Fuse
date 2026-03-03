#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../.." && pwd)"
cd "$ROOT_DIR"

CONFIG="${1:-scripts/railway/openclaw-oauth-instances.json}"
bash scripts/railway/sync-openclaw-oauth-instances.sh --config "$CONFIG"
