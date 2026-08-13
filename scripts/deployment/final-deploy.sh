#!/usr/bin/env bash
# final-deploy.sh — Railway/cloud_runtime path retired.
# Use GCP Cloud Build / Cloud Run instead.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "========================================="
echo "TNF final-deploy (Cloud Run)"
echo "========================================="
echo
echo "The legacy cloud_runtime/railway variable-set path is retired."
echo "Delegating to scripts/deployment/gcp-deploy.sh"
echo

exec bash "${ROOT_DIR}/scripts/deployment/gcp-deploy.sh"
