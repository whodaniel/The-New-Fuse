#!/usr/bin/env bash
# run-cloud_runtime-supercycle.sh — Railway/cloud_runtime remote run path retired.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
# shellcheck source=scripts/lib/tnf-cloud-run.sh
source "${SCRIPT_DIR}/../lib/tnf-cloud-run.sh"

echo "🚄 [TNF Swarm Run] remote cloud_runtime supercycle is retired."
tnf_cloud_runtime_retired_msg
echo
echo "Run locally instead:"
echo "  cd ${ROOT_DIR} && node scripts/orchestrator/supercycle-flywheel.cjs"
echo "Or exec into a Cloud Run revision with gcloud run services proxy / jobs."
exit 1
