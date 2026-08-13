#!/usr/bin/env bash
# cloud_runtime-deploy.sh — retired wrapper → gcp-deploy.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "cloud_runtime-deploy.sh is retired (legacy Railway/cloud_runtime CLI)."
echo "Delegating to scripts/deployment/gcp-deploy.sh"
exec bash "${ROOT_DIR}/scripts/deployment/gcp-deploy.sh"
