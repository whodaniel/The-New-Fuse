#!/usr/bin/env bash
# deploy-to-cloud_runtime.sh — retired wrapper.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "cloud_runtime CLI does not exist (legacy Railway rename)."
echo "Deploying via scripts/deployment/gcp-deploy.sh instead."
exec bash "${ROOT_DIR}/scripts/deployment/gcp-deploy.sh"
