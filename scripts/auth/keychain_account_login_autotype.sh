#!/usr/bin/env bash
set -euo pipefail

PROFILE=""
ACCOUNT="${KEYCHAIN_AUTOTYPE_ACCOUNT:-$USER}"
USERNAME_SERVICE=""
PASSWORD_SERVICE=""
DELAY_SEC="${KEYCHAIN_AUTOTYPE_DELAY_SEC:-0.25}"
BETWEEN_SEC="${KEYCHAIN_AUTOTYPE_BETWEEN_SEC:-0.12}"
PRESS_RETURN="false"
ONLY_MODE="both"
DRY_RUN="false"
PROFILE_PATH="${KEYCHAIN_LOGIN_PROFILE_PATH:-$HOME/.tnf/auth/keychain-login-profiles.json}"

usage() {
  cat <<'USAGE'
Usage:
  scripts/auth/keychain_account_login_autotype.sh [options]

Options:
  --profile <name>         Profile name from profile JSON
  --account <name>         Keychain account (default: current user)
  --username-service <s>   Username service override
  --password-service <s>   Password service override
  --delay-sec <sec>        Delay before typing starts (default: 0.25)
  --between-sec <sec>      Delay between username and password (default: 0.12)
  --only <mode>            one of: both|username|password (default: both)
  --press-return           Press Enter after typing
  --dry-run                Validate retrieval only (no typing)
  --profile-path <path>    Profile file path (default: ~/.tnf/auth/keychain-login-profiles.json)
  --help, -h               Show help

Examples:
  scripts/auth/keychain_account_login_autotype.sh --profile "github-main"
  scripts/auth/keychain_account_login_autotype.sh --profile "my-site" --press-return
  scripts/auth/keychain_account_login_autotype.sh --username-service "svc.user" --password-service "svc.pass"

Requirements:
  - Terminal/osascript has Accessibility permission
  - Focus the username field before running (for --only both)
USAGE
}

load_profile() {
  local profile_path="$1"
  local profile_name="$2"
  node - "$profile_path" "$profile_name" <<'NODE'
const fs = require('fs');

const [filePath, profile] = process.argv.slice(2);
try {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  const row = parsed?.profiles?.[profile];
  if (!row) {
    process.stdout.write('');
    process.exit(0);
  }
  process.stdout.write(
    JSON.stringify({
      account: row.account || '',
      usernameService: row.usernameService || '',
      passwordService: row.passwordService || '',
      loginUrl: row.loginUrl || '',
    })
  );
} catch {
  process.stdout.write('');
}
NODE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      PROFILE="${2:-}"
      shift 2
      ;;
    --account)
      ACCOUNT="${2:-}"
      shift 2
      ;;
    --username-service)
      USERNAME_SERVICE="${2:-}"
      shift 2
      ;;
    --password-service)
      PASSWORD_SERVICE="${2:-}"
      shift 2
      ;;
    --delay-sec)
      DELAY_SEC="${2:-}"
      shift 2
      ;;
    --between-sec)
      BETWEEN_SEC="${2:-}"
      shift 2
      ;;
    --only)
      ONLY_MODE="${2:-}"
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
    --profile-path)
      PROFILE_PATH="${2:-}"
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

if [[ "$ONLY_MODE" != "both" && "$ONLY_MODE" != "username" && "$ONLY_MODE" != "password" ]]; then
  echo "--only must be one of both|username|password" >&2
  exit 1
fi

if [[ -n "$PROFILE" ]]; then
  PROFILE_JSON="$(load_profile "$PROFILE_PATH" "$PROFILE")"
  if [[ -z "$PROFILE_JSON" ]]; then
    echo "Profile '${PROFILE}' not found in ${PROFILE_PATH}" >&2
    exit 1
  fi
  PROFILE_ACCOUNT="$(printf '%s' "$PROFILE_JSON" | node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(d.account||'')")"
  PROFILE_USERNAME_SERVICE="$(printf '%s' "$PROFILE_JSON" | node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(d.usernameService||'')")"
  PROFILE_PASSWORD_SERVICE="$(printf '%s' "$PROFILE_JSON" | node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(d.passwordService||'')")"

  if [[ -z "$ACCOUNT" && -n "$PROFILE_ACCOUNT" ]]; then
    ACCOUNT="$PROFILE_ACCOUNT"
  fi
  if [[ -z "$USERNAME_SERVICE" ]]; then
    USERNAME_SERVICE="$PROFILE_USERNAME_SERVICE"
  fi
  if [[ -z "$PASSWORD_SERVICE" ]]; then
    PASSWORD_SERVICE="$PROFILE_PASSWORD_SERVICE"
  fi
fi

if [[ -z "$USERNAME_SERVICE" ]]; then
  USERNAME_SERVICE="tnf.login.${PROFILE}.username"
fi
if [[ -z "$PASSWORD_SERVICE" ]]; then
  PASSWORD_SERVICE="tnf.login.${PROFILE}.password"
fi

USERNAME_VALUE=""
PASSWORD_VALUE=""

if [[ "$ONLY_MODE" == "both" || "$ONLY_MODE" == "username" ]]; then
  USERNAME_VALUE="$(security find-generic-password -w -a "$ACCOUNT" -s "$USERNAME_SERVICE")"
  if [[ -z "$USERNAME_VALUE" ]]; then
    echo "Username secret not found (service='$USERNAME_SERVICE', account='$ACCOUNT')." >&2
    exit 1
  fi
fi

if [[ "$ONLY_MODE" == "both" || "$ONLY_MODE" == "password" ]]; then
  PASSWORD_VALUE="$(security find-generic-password -w -a "$ACCOUNT" -s "$PASSWORD_SERVICE")"
  if [[ -z "$PASSWORD_VALUE" ]]; then
    echo "Password secret not found (service='$PASSWORD_SERVICE', account='$ACCOUNT')." >&2
    exit 1
  fi
fi

if [[ "$DRY_RUN" == "true" ]]; then
  unset USERNAME_VALUE PASSWORD_VALUE
  echo "Keychain lookup OK for profile='${PROFILE:-custom}' account='$ACCOUNT'."
  exit 0
fi

USERNAME_FILE="$(mktemp /tmp/keychain-user.XXXXXX)"
PASSWORD_FILE="$(mktemp /tmp/keychain-pass.XXXXXX)"
trap 'rm -f "$USERNAME_FILE" "$PASSWORD_FILE"' EXIT
chmod 600 "$USERNAME_FILE" "$PASSWORD_FILE"
printf '%s' "$USERNAME_VALUE" >"$USERNAME_FILE"
printf '%s' "$PASSWORD_VALUE" >"$PASSWORD_FILE"
unset USERNAME_VALUE PASSWORD_VALUE

osascript - "$USERNAME_FILE" "$PASSWORD_FILE" "$DELAY_SEC" "$BETWEEN_SEC" "$ONLY_MODE" "$PRESS_RETURN" <<'APPLESCRIPT' >/dev/null
on run argv
  set userPath to item 1 of argv
  set passPath to item 2 of argv
  set delaySec to (item 3 of argv) as real
  set betweenSec to (item 4 of argv) as real
  set onlyMode to item 5 of argv
  set pressReturn to item 6 of argv

  delay delaySec
  set userText to do shell script "/bin/cat " & quoted form of userPath
  set passText to do shell script "/bin/cat " & quoted form of passPath

  tell application "System Events"
    if onlyMode is "both" then
      keystroke userText
      key code 48
      delay betweenSec
      keystroke passText
    else if onlyMode is "username" then
      keystroke userText
    else
      keystroke passText
    end if

    if pressReturn is "true" then
      key code 36
    end if
  end tell
end run
APPLESCRIPT

echo "Autotyped credentials for profile='${PROFILE:-custom}' into focused app."
