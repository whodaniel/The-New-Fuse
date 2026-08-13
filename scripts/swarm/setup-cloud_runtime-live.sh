#!/usr/bin/env bash
# setup-cloud_runtime-live.sh — Railway/cloud_runtime path retired.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/tnf-cloud-run.sh
source "${SCRIPT_DIR}/../lib/tnf-cloud-run.sh"

echo "🚄 [TNF Swarm Setup] cloud_runtime live setup is retired."
tnf_cloud_runtime_retired_msg
echo
echo "For Cloud Run env updates, use scripts/lib/tnf-cloud-run.sh helpers,"
echo "or set SEARXNG_BASE_URL / runner vars via:"
echo "  tnf_cloud_run_update_env <service> KEY=VAL ..."
echo "Deploy stack: bash scripts/deployment/gcp-deploy.sh"
exit 1
