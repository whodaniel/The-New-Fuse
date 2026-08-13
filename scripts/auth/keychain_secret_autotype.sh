#!/usr/bin/env bash
set -euo pipefail

SERVICE="${KEYCHAIN_AUTOTYPE_SERVICE:-tnf.autotype.secret}"
ACCOUNT="${KEYCHAIN_AUTOTYPE_ACCOUNT:-$USER}"
DELAY_SEC="${KEYCHAIN_AUTOTYPE_DELAY_SEC:-0.2}"
PRESS_RETURN="false"
DRY_RUN="false"

usage() {
  cat <<'USAGE'
Usage:
  scripts/auth/keychain_secret_autotype.sh [options]

Options:
  --service <name>      Keychain service name (default: tnf.autotype.secret)
  --account <name>      Keychain account name (default: current user)
  --delay-sec <sec>     Delay before typing (default: 0.2)
  --press-return        Press Enter after typing secret
  --dry-run             Validate keychain retrieval only (no typing)
  --help, -h            Show help

Requirements:
  - Secret already stored in keychain (see keychain_secret_setup.sh)
  - Terminal/osascript has Accessibility permission (System Settings)
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
    --delay-sec)
      DELAY_SEC="${2:-}"
      shift 2
      ;;
    --press-return)
      PRESS_RETURN="true"
      shift
      ;;
    --dry-run)
      DRY_RUN="true"
      shift
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

SECRET="$(security find-generic-password -w -a "$ACCOUNT" -s "$SERVICE")"
if [[ -z "${SECRET}" ]]; then
  echo "No secret found for service='$SERVICE' account='$ACCOUNT'." >&2
  exit 1
fi

if [[ "$DRY_RUN" == "true" ]]; then
  unset SECRET
  echo "Keychain lookup OK for service='$SERVICE' account='$ACCOUNT'."
  exit 0
fi

SECRET_FILE="$(mktemp /tmp/keychain-autotype.XXXXXX)"
trap 'rm -f "$SECRET_FILE"' EXIT
chmod 600 "$SECRET_FILE"
printf '%s' "$SECRET" >"$SECRET_FILE"
unset SECRET

osascript - "$SECRET_FILE" "$DELAY_SEC" "$PRESS_RETURN" <<'APPLESCRIPT' >/dev/null
on run argv
  set secretPath to item 1 of argv
  set delaySec to (item 2 of argv) as real
  set pressReturn to item 3 of argv

  delay delaySec
  set secretText to do shell script "/bin/cat " & quoted form of secretPath

  tell application "System Events"
    keystroke secretText
    if pressReturn is "true" then key code 36
  end tell
end run
APPLESCRIPT

echo "Typed keychain secret into focused application."
