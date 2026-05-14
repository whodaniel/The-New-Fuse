#!/usr/bin/env bash
set -euo pipefail

REPO=""
BASE_URL="https://thenewfuse.com"
API_URL="https://api.thenewfuse.com"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --base-url) BASE_URL="$2"; shift 2 ;;
    --api-url) API_URL="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$REPO" ]]; then
  echo "--repo is required" >&2
  exit 2
fi

cd "$REPO"

if [[ -x "$REPO/tnf" ]]; then
  TNF_CMD=("$REPO/tnf")
else
  TNF_CMD=(node "$REPO/packages/tnf-cli/dist/cli.js")
fi

TOKEN_ARG=()
if [[ -n "${TNF_SUPER_ADMIN_INPUT_TOKEN:-}" ]]; then
  TOKEN_ARG=(--super-admin-token "$TNF_SUPER_ADMIN_INPUT_TOKEN")
elif [[ -n "${CI_SUPER_ADMIN_TOKEN:-}" ]]; then
  TOKEN_ARG=(--super-admin-token "$CI_SUPER_ADMIN_TOKEN")
fi

echo "[1/1] Run canonical TNF self-improvement loop"
"${TNF_CMD[@]}" self-improvement run \
  --base-url "$BASE_URL" \
  --api-url "$API_URL" \
  "${TOKEN_ARG[@]}"

echo "Loop complete (tnf self-improvement run)"
