#!/usr/bin/env bash
set -euo pipefail

SERVICE="${KEYCHAIN_AUTOTYPE_SERVICE:-tnf.autotype.secret}"
ACCOUNT="${KEYCHAIN_AUTOTYPE_ACCOUNT:-$USER}"
LABEL=""

usage() {
  cat <<'USAGE'
Usage:
  scripts/auth/keychain_secret_setup.sh [options]

Options:
  --service <name>      Keychain service name (default: tnf.autotype.secret)
  --account <name>      Keychain account name (default: current user)
  --label <label>       Optional keychain label
  --help, -h            Show help

This command prompts for a secret without echoing and stores it in macOS Keychain.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --service)
      SERVICE="${2:-}"
      shift 2
      ;;
    --account)
      ACCOUNT="${2:-}"
      shift 2
      ;;
    --label)
      LABEL="${2:-}"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$SERVICE" || -z "$ACCOUNT" ]]; then
  echo "Service and account are required." >&2
  exit 1
fi

read -r -s -p "Enter secret for service '$SERVICE' (account '$ACCOUNT'): " SECRET
echo
if [[ -z "${SECRET}" ]]; then
  echo "Secret cannot be empty." >&2
  exit 1
fi

if [[ -n "$LABEL" ]]; then
  security add-generic-password -U -a "$ACCOUNT" -s "$SERVICE" -l "$LABEL" -w "$SECRET" >/dev/null
else
  security add-generic-password -U -a "$ACCOUNT" -s "$SERVICE" -w "$SECRET" >/dev/null
fi

unset SECRET

echo "Stored keychain secret for service='$SERVICE' account='$ACCOUNT'."
echo "Next step: use scripts/auth/keychain_secret_autotype.sh to type it into the focused app."
