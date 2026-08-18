#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../.." && pwd)"
cd "$ROOT_DIR"

# NOTE: scripts/railway/ was removed when Railway was retired. The sync scripts
# now live in scripts/cloud_runtime/.
CONFIG="${1:-scripts/cloud_runtime/openclaw-oauth-instances.json}"
bash scripts/cloud_runtime/sync-openclaw-oauth-instances.sh --config "$CONFIG"
