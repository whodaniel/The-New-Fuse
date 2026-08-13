#!/usr/bin/env bash
set -euo pipefail

# Terminal-only Zo login bootstrap:
# 1) Request magic-link email
# 2) Accept pasted magic-link URL
# 3) Capture auth cookies with curl
# 4) Convert cookies -> Playwright storage state
# 5) Open authenticated Zo workspace in Playwright CLI

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Usage:
  scripts/competitive/zo_terminal_login.sh [target_url]

Default target_url:
  https://whodaniel.zo.computer/?chat=new_ftjvdq

This script prompts for:
  1) Zo email
  2) Magic login link URL from email

Then it loads authenticated cookie state into Playwright CLI.
USAGE
  exit 0
fi

TARGET_URL="${1:-https://whodaniel.zo.computer/?chat=new_ftjvdq}"
COOKIE_JAR="${ZO_COOKIE_JAR:-/tmp/zo_login.cookies.txt}"
STATE_FILE="${ZO_PLAYWRIGHT_STATE:-/tmp/zo_playwright_state.json}"

echo "Zo Terminal Login"
echo "Target: ${TARGET_URL}"
echo

read -r -p "Zo email: " ZO_EMAIL
if [[ -z "${ZO_EMAIL}" ]]; then
  echo "Email is required."
  exit 1
fi

REQUEST_PAYLOAD=$(printf '{"email":"%s","redirect":"/?chat=new_ftjvdq"}' "${ZO_EMAIL}")
REQUEST_RESPONSE=$(curl -sS -X POST "https://www.zo.computer/api/email-login/request" \
  -H "content-type: application/json" \
  --data "${REQUEST_PAYLOAD}")

if ! echo "${REQUEST_RESPONSE}" | grep -Eq '"ok"[[:space:]]*:[[:space:]]*true'; then
  echo "Failed to request email login link:"
  echo "${REQUEST_RESPONSE}"
  exit 1
fi

echo
echo "Magic link sent to ${ZO_EMAIL}."
echo "Paste the full login URL from your email (https://www.zo.computer/api/login?...):"
read -r MAGIC_LINK

if [[ -z "${MAGIC_LINK}" ]]; then
  echo "Magic link URL is required."
  exit 1
fi

rm -f "${COOKIE_JAR}"
touch "${COOKIE_JAR}"
chmod 600 "${COOKIE_JAR}"

# Follow redirects and capture resulting auth cookies.
curl -sS -L "${MAGIC_LINK}" \
  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36" \
  -c "${COOKIE_JAR}" \
  -b "${COOKIE_JAR}" \
  -o /tmp/zo_login_last_response.html

if ! grep -Eq $'\t(access_token|refresh_token)\t' "${COOKIE_JAR}"; then
  echo
  echo "No Zo access cookies were captured."
  echo "Possible causes: expired link, wrong link, or auth flow changed."
  echo "Cookie jar path: ${COOKIE_JAR}"
  exit 1
fi

python3 - "${COOKIE_JAR}" "${STATE_FILE}" <<'PY'
import json
import sys

cookie_jar_path, state_path = sys.argv[1], sys.argv[2]
cookies = []

with open(cookie_jar_path, "r", encoding="utf-8", errors="ignore") as f:
    for raw_line in f:
        line = raw_line.strip()
        if not line or line.startswith("#") and not line.startswith("#HttpOnly_"):
            continue

        http_only = False
        if line.startswith("#HttpOnly_"):
            http_only = True
            line = line[len("#HttpOnly_") :]

        parts = line.split("\t")
        if len(parts) != 7:
            continue

        domain, _flag, path, secure_raw, expires_raw, name, value = parts
        secure = secure_raw.upper() == "TRUE"
        try:
            expires = int(expires_raw)
        except ValueError:
            expires = -1

        cookie = {
            "name": name,
            "value": value,
            "domain": domain,
            "path": path or "/",
            "expires": expires if expires > 0 else -1,
            "httpOnly": http_only,
            "secure": secure,
            "sameSite": "Lax",
        }
        cookies.append(cookie)

state = {"cookies": cookies, "origins": []}
with open(state_path, "w", encoding="utf-8") as out:
    json.dump(state, out)
print(f"Wrote Playwright state: {state_path} ({len(cookies)} cookies)")
PY

chmod 600 "${STATE_FILE}"

export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="${PWCLI:-$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh}"
export PLAYWRIGHT_CLI_SESSION="${PLAYWRIGHT_CLI_SESSION:-zo_cookie_auth}"

if [[ ! -x "${PWCLI}" ]]; then
  echo "Playwright CLI wrapper not found at: ${PWCLI}"
  exit 1
fi

"${PWCLI}" open "https://www.zo.computer" --browser chrome >/dev/null
"${PWCLI}" state-load "${STATE_FILE}" >/dev/null
"${PWCLI}" goto "${TARGET_URL}" >/dev/null
"${PWCLI}" snapshot

echo
echo "Authenticated Zo session loaded for Playwright."
echo "State file: ${STATE_FILE}"
