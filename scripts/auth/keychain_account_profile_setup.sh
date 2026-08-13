#!/usr/bin/env bash
set -euo pipefail

PROFILE=""
ACCOUNT="${KEYCHAIN_AUTOTYPE_ACCOUNT:-$USER}"
LOGIN_URL=""
USERNAME_SERVICE=""
PASSWORD_SERVICE=""
USERNAME_VALUE=""
PASSWORD_ENV=""
PROFILE_PATH="${KEYCHAIN_LOGIN_PROFILE_PATH:-$HOME/.tnf/auth/keychain-login-profiles.json}"

usage() {
  cat <<'USAGE'
Usage:
  scripts/auth/keychain_account_profile_setup.sh --profile <name> [options]

Options:
  --profile <name>        Profile id (required), e.g. "github-main"
  --account <name>        Keychain account (default: current user)
  --login-url <url>       Optional login URL metadata
  --username-service <s>  Username keychain service name
  --password-service <s>  Password keychain service name
  --username <value>      Username value (otherwise prompted)
  --password-env <VAR>    Read password from env var name (otherwise prompted)
  --profile-path <path>   Profile JSON path (default: ~/.tnf/auth/keychain-login-profiles.json)
  --help, -h              Show help

This script stores username/password in macOS Keychain and writes profile metadata
so login autotype can run by profile name.
USAGE
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
    --login-url)
      LOGIN_URL="${2:-}"
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
    --username)
      USERNAME_VALUE="${2:-}"
      shift 2
      ;;
    --password-env)
      PASSWORD_ENV="${2:-}"
      shift 2
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

if [[ -z "$PROFILE" ]]; then
  echo "--profile is required." >&2
  exit 1
fi

if [[ -z "$USERNAME_SERVICE" ]]; then
  USERNAME_SERVICE="tnf.login.${PROFILE}.username"
fi
if [[ -z "$PASSWORD_SERVICE" ]]; then
  PASSWORD_SERVICE="tnf.login.${PROFILE}.password"
fi

if [[ -z "$USERNAME_VALUE" ]]; then
  read -r -p "Username for profile '$PROFILE': " USERNAME_VALUE
fi
if [[ -z "$USERNAME_VALUE" ]]; then
  echo "Username cannot be empty." >&2
  exit 1
fi

PASSWORD_VALUE=""
if [[ -n "$PASSWORD_ENV" ]]; then
  PASSWORD_VALUE="${!PASSWORD_ENV:-}"
fi
if [[ -z "$PASSWORD_VALUE" ]]; then
  read -r -s -p "Password for profile '$PROFILE': " PASSWORD_VALUE
  echo
fi
if [[ -z "$PASSWORD_VALUE" ]]; then
  echo "Password cannot be empty." >&2
  exit 1
fi

security add-generic-password -U -a "$ACCOUNT" -s "$USERNAME_SERVICE" -w "$USERNAME_VALUE" >/dev/null
security add-generic-password -U -a "$ACCOUNT" -s "$PASSWORD_SERVICE" -w "$PASSWORD_VALUE" >/dev/null

unset PASSWORD_VALUE

mkdir -p "$(dirname "$PROFILE_PATH")"

node - "$PROFILE_PATH" "$PROFILE" "$ACCOUNT" "$USERNAME_SERVICE" "$PASSWORD_SERVICE" "$LOGIN_URL" <<'NODE'
const fs = require('fs');
const path = require('path');

const [filePath, profile, account, usernameService, passwordService, loginUrl] = process.argv.slice(2);
let payload = { version: 1, profiles: {} };

try {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (parsed && typeof parsed === 'object') {
    payload = {
      version: parsed.version || 1,
      profiles: parsed.profiles && typeof parsed.profiles === 'object' ? parsed.profiles : {},
    };
  }
} catch {
  // create new
}

payload.profiles[profile] = {
  account,
  usernameService,
  passwordService,
  loginUrl: loginUrl || null,
  updatedAt: new Date().toISOString(),
};

fs.mkdirSync(path.dirname(filePath), { recursive: true });
fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
NODE

echo "Stored keychain profile '${PROFILE}'."
echo "Profile file: ${PROFILE_PATH}"
echo "Username service: ${USERNAME_SERVICE}"
echo "Password service: ${PASSWORD_SERVICE}"
echo "Next: scripts/auth/keychain_account_login_autotype.sh --profile \"${PROFILE}\""
