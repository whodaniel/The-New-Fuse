#!/usr/bin/env bash
set -euo pipefail

REPO=""
MODE="all"
INTERVAL_MINUTES="30"
TARGETS="all"
BASE_URL="https://thenewfuse.com"
API_URL="https://api.thenewfuse.com"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --mode) MODE="$2"; shift 2 ;;
    --interval-minutes) INTERVAL_MINUTES="$2"; shift 2 ;;
    --targets) TARGETS="$2"; shift 2 ;;
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

TOKEN_ARG=()
if [[ -n "${TNF_SUPER_ADMIN_INPUT_TOKEN:-}" ]]; then
  TOKEN_ARG=(--super-admin-token "$TNF_SUPER_ADMIN_INPUT_TOKEN")
elif [[ -n "${CI_SUPER_ADMIN_TOKEN:-}" ]]; then
  TOKEN_ARG=(--super-admin-token "$CI_SUPER_ADMIN_TOKEN")
fi

run_provision() {
  tnf full-auto provision --targets "$TARGETS"
}

run_once() {
  tnf full-auto once \
    --base-url "$BASE_URL" \
    --api-url "$API_URL" \
    "${TOKEN_ARG[@]}"
}

run_start() {
  tnf full-auto start \
    --interval-minutes "$INTERVAL_MINUTES" \
    --max-cycles 0 \
    --broadcast \
    "${TOKEN_ARG[@]}"
}

run_status() {
  tnf full-auto status
}

case "$MODE" in
  provision)
    run_provision
    ;;
  once)
    run_provision
    run_once
    run_status
    ;;
  start)
    run_provision
    run_start
    ;;
  status)
    run_status
    ;;
  all)
    run_provision
    run_once
    run_start
    ;;
  *)
    echo "Unsupported mode: $MODE" >&2
    exit 2
    ;;
esac
