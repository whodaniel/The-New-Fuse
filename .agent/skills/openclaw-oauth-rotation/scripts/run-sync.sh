#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../.." && pwd)"
cd "$ROOT_DIR"

# NOTE: scripts/railway/ was removed when Railway was retired. The sync scripts
# now live in scripts/cloud-run/.
CONFIG="${1:-scripts/cloud-run/openclaw-oauth-instances.json}"
bash scripts/cloud-run/sync-openclaw-oauth-instances.sh --config "$CONFIG"
