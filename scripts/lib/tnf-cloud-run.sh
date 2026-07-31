#!/usr/bin/env bash
# TNF Cloud Run helpers — replaces the dead `cloud_runtime` CLI.
#
# History: commit 62b2a3e2f1 string-replaced `railway` → `cloud_runtime` across
# the repo. `cloud_runtime` is not a real binary. TNF now deploys on GCP Cloud
# Run + Cloudflare + Supabase + Upstash.
#
# Source this file from bash scripts:
#   # shellcheck source=scripts/lib/tnf-cloud-run.sh
#   source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/lib/tnf-cloud-run.sh"
#
# See: packages/compounding-memory/wiki/doc-cloud-migration-blueprint.md
#      Retired Railway-era scripts: github.com/whodaniel/tnf-railway-era-archive (private)

: "${TNF_GCP_PROJECT_ID:=${GCP_PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-the-new-fuse-2025}}}"
: "${TNF_GCP_REGION:=${GCP_REGION:-${CLOUD_RUN_REGION:-us-central1}}}"

tnf_cloud_runtime_retired_msg() {
  cat >&2 <<'EOF'
ERROR: `cloud_runtime` is not a real CLI (legacy Railway → cloud_runtime rename).
TNF deploys via GCP Cloud Run. Use:
  gcloud auth list
  gcloud run services list --project=the-new-fuse-2025 --region=us-central1
  scripts/deployment/gcp-deploy.sh
Docs: packages/compounding-memory/wiki/doc-cloud-migration-blueprint.md
EOF
}

# Soft notice for optional code paths (do not exit).
tnf_cloud_runtime_retired_soft() {
  echo "[tnf-cloud-run] cloud_runtime CLI retired — skipping Railway-era path. Prefer gcloud / scripts/deployment/gcp-deploy.sh." >&2
}

tnf_refuse_dead_cloud_runtime_cli() {
  tnf_cloud_runtime_retired_msg
  exit 1
}

tnf_gcp_project() {
  printf '%s\n' "${TNF_GCP_PROJECT_ID}"
}

tnf_gcp_region() {
  printf '%s\n' "${TNF_GCP_REGION}"
}

tnf_require_gcloud() {
  if ! command -v gcloud >/dev/null 2>&1; then
    echo "ERROR: gcloud CLI is not installed." >&2
    exit 1
  fi
  if ! command -v jq >/dev/null 2>&1; then
    echo "ERROR: jq is required." >&2
    exit 1
  fi
  local account
  account="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | head -n1 || true)"
  if [[ -z "${account}" ]]; then
    echo "ERROR: no active gcloud account (run: gcloud auth login)." >&2
    exit 1
  fi
}

# Write KEY=VAL pairs to a YAML env-vars file (safe for tokens / special chars).
# Usage: tnf_cloud_run_write_env_file /tmp/env.yaml KEY=VAL KEY2=VAL2 ...
tnf_cloud_run_write_env_file() {
  local out="$1"
  shift
  : >"${out}"
  local pair key value
  for pair in "$@"; do
    key="${pair%%=*}"
    value="${pair#*=}"
    # YAML double-quoted string with escapes
    value="${value//\\/\\\\}"
    value="${value//\"/\\\"}"
    value="${value//$'\n'/\\n}"
    printf '%s: "%s"\n' "${key}" "${value}" >>"${out}"
  done
}

# Update Cloud Run service env vars (merge — never replace the full set).
# Remaining args are KEY=VAL pairs.
# Usage: tnf_cloud_run_update_env SERVICE KEY=VAL ...
#
# IMPORTANT: `gcloud run ... --env-vars-file` replaces ALL env vars. Callers that
# only pass rotated secrets would wipe service-specific keys (e.g.
# OPENCLAW_GATEWAY_TOKEN). We merge with the current service template env first.
tnf_cloud_run_update_env() {
  local service="$1"
  shift
  if [[ -z "${service}" || "$#" -lt 1 ]]; then
    echo "ERROR: tnf_cloud_run_update_env SERVICE KEY=VAL..." >&2
    return 1
  fi
  tnf_require_gcloud
  local tmp existing updates merged pair key value
  tmp="$(mktemp)"
  existing="$(tnf_cloud_run_env_json "${service}" 2>/dev/null || echo '{}')"
  [[ -n "${existing}" ]] || existing='{}'
  updates='{}'
  for pair in "$@"; do
    key="${pair%%=*}"
    value="${pair#*=}"
    updates="$(jq -c --arg k "${key}" --arg v "${value}" '.[$k]=$v' <<<"${updates}")"
  done
  merged="$(jq -c -n --argjson a "${existing}" --argjson b "${updates}" '$a + $b')"
  : >"${tmp}"
  while IFS= read -r key; do
    value="$(jq -r --arg k "${key}" '.[$k] // empty' <<<"${merged}")"
    value="${value//\\/\\\\}"
    value="${value//\"/\\\"}"
    value="${value//$'\n'/\\n}"
    printf '%s: "%s"\n' "${key}" "${value}" >>"${tmp}"
  done < <(jq -r 'keys[]' <<<"${merged}")
  gcloud run services update "${service}" \
    --project="$(tnf_gcp_project)" \
    --region="$(tnf_gcp_region)" \
    --env-vars-file="${tmp}" \
    --quiet
  local rc=$?
  rm -f "${tmp}"
  return "${rc}"
}

# Emit flat JSON object of container env vars (Railway-compatible shape for jq).
# Usage: tnf_cloud_run_env_json SERVICE
tnf_cloud_run_env_json() {
  local service="$1"
  gcloud run services describe "${service}" \
    --project="$(tnf_gcp_project)" \
    --region="$(tnf_gcp_region)" \
    --format=json \
    | jq -c '
      (.spec.template.spec.containers[0].env // [])
      | map(select(.value != null) | {(.name): .value})
      | add // {}
    '
}

# Wait until latest ready revision exists (Cloud Run "SUCCESS" analogue).
# Usage: tnf_cloud_run_wait_ready SERVICE [max_attempts] [sleep_seconds]
tnf_cloud_run_wait_ready() {
  local service="$1"
  local max_attempts="${2:-90}"
  local sleep_seconds="${3:-3}"
  local attempt ready status
  for attempt in $(seq 1 "${max_attempts}"); do
    ready="$(gcloud run services describe "${service}" \
      --project="$(tnf_gcp_project)" \
      --region="$(tnf_gcp_region)" \
      --format='value(status.latestReadyRevisionName)' 2>/dev/null || true)"
    status="$(gcloud run services describe "${service}" \
      --project="$(tnf_gcp_project)" \
      --region="$(tnf_gcp_region)" \
      --format='value(status.conditions[0].status)' 2>/dev/null || true)"
    echo "  attempt=${attempt} readyRevision=${ready:-n/a} condition=${status:-n/a}"
    if [[ -n "${ready}" && "${status}" == "True" ]]; then
      return 0
    fi
    sleep "${sleep_seconds}"
  done
  echo "ERROR: Cloud Run service ${service} did not become ready in time." >&2
  return 1
}

# True when gcloud is available (for optional deploy branches).
tnf_has_cloud_deploy_cli() {
  command -v gcloud >/dev/null 2>&1
}
