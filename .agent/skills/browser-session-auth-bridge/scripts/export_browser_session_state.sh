#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/export_browser_session_state.sh --url <target_url> [options]

Options:
  --url <url>            Target URL that needs authenticated access (required)
  --domain <domain>      Cookie domain override (default: hostname from --url)
  --state-file <path>    Storage state output file (default: /tmp/playwright_state_<domain>.json)
  --browser <name>       Browser family: chrome|chromium|brave|edge|firefox (default: chrome)
  --help, -h             Show help

Environment:
  BROWSER_COOKIE_VENV    Python venv path for browser-cookie3 dependency

Output:
  Writes a Playwright storage state file that can be loaded with:
    playwright_cli.sh state-load <state_file>
USAGE
}

TARGET_URL=""
DOMAIN_OVERRIDE=""
STATE_FILE=""
BROWSER_NAME="chrome"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url)
      TARGET_URL="${2:-}"
      shift 2
      ;;
    --domain)
      DOMAIN_OVERRIDE="${2:-}"
      shift 2
      ;;
    --state-file)
      STATE_FILE="${2:-}"
      shift 2
      ;;
    --browser)
      BROWSER_NAME="${2:-}"
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

if [[ -z "${TARGET_URL}" ]]; then
  echo "--url is required." >&2
  usage
  exit 1
fi

if [[ -z "${DOMAIN_OVERRIDE}" ]]; then
  DOMAIN_OVERRIDE="$(python3 - "${TARGET_URL}" <<'PY'
import sys
from urllib.parse import urlparse
print(urlparse(sys.argv[1]).hostname or "")
PY
)"
fi

if [[ -z "${DOMAIN_OVERRIDE}" ]]; then
  echo "Could not derive a domain from URL: ${TARGET_URL}" >&2
  exit 1
fi

case "${BROWSER_NAME}" in
  chrome|chromium|brave|edge|firefox) ;;
  *)
    echo "Unsupported browser: ${BROWSER_NAME}" >&2
    exit 1
    ;;
esac

safe_domain="$(printf '%s' "${DOMAIN_OVERRIDE}" | tr -c 'A-Za-z0-9._-' '_' | sed 's/^_//;s/_$//')"
if [[ -z "${STATE_FILE}" ]]; then
  STATE_FILE="/tmp/playwright_state_${safe_domain}.json"
fi

VENV_DIR="${BROWSER_COOKIE_VENV:-/tmp/browser_cookie3_venv}"
PYTHON_BIN="${VENV_DIR}/bin/python"
PIP_BIN="${VENV_DIR}/bin/pip"

if [[ ! -x "${PYTHON_BIN}" ]]; then
  python3 -m venv "${VENV_DIR}"
fi

"${PIP_BIN}" install --quiet --upgrade pip >/dev/null
"${PIP_BIN}" install --quiet browser-cookie3 >/dev/null

"${PYTHON_BIN}" - "${BROWSER_NAME}" "${DOMAIN_OVERRIDE}" "${TARGET_URL}" "${STATE_FILE}" <<'PY'
import json
import sys
from urllib.parse import urlparse

browser_name, domain, target_url, state_file = sys.argv[1:5]

import browser_cookie3


def load_cookie_jar(name: str):
    loaders = {
        "chrome": browser_cookie3.chrome,
        "chromium": browser_cookie3.chromium,
        "brave": browser_cookie3.brave,
        "edge": browser_cookie3.edge,
        "firefox": browser_cookie3.firefox,
    }
    loader = loaders[name]
    return loader()


def same_site_value(cookie) -> str:
    rest = getattr(cookie, "_rest", {}) or {}
    raw = rest.get("SameSite") or rest.get("samesite") or ""
    value = str(raw).strip().lower()
    if value == "strict":
        return "Strict"
    if value == "none":
        return "None"
    return "Lax"


def is_domain_match(cookie_domain: str, wanted_domain: str) -> bool:
    cd = (cookie_domain or "").lstrip(".").lower()
    wd = (wanted_domain or "").lstrip(".").lower()
    if not cd or not wd:
        return False
    return cd == wd or cd.endswith("." + wd) or wd.endswith("." + cd)


def candidate_domains(host: str) -> set[str]:
    raw = (host or "").lstrip(".").lower()
    if not raw:
        return set()
    parts = [part for part in raw.split(".") if part]
    domains = {raw}
    for i in range(1, len(parts) - 1):
        domains.add(".".join(parts[i:]))
    return domains


cookie_jar = load_cookie_jar(browser_name)
target_host = (urlparse(target_url).hostname or "").lower()
allowed_domains = candidate_domains(domain) | candidate_domains(target_host)
cookies = []

for cookie in cookie_jar:
    cookie_domain = (cookie.domain or "").lower()
    if not any(is_domain_match(cookie_domain, allowed) for allowed in allowed_domains):
        continue

    expires = -1
    if getattr(cookie, "expires", None):
        try:
            expires = int(cookie.expires)
        except Exception:
            expires = -1

    rest = getattr(cookie, "_rest", {}) or {}
    http_only = "HttpOnly" in rest or "httponly" in rest

    cookies.append(
        {
            "name": cookie.name,
            "value": cookie.value,
            "domain": cookie.domain,
            "path": cookie.path or "/",
            "expires": expires,
            "httpOnly": bool(http_only),
            "secure": bool(cookie.secure),
            "sameSite": same_site_value(cookie),
        }
    )

with open(state_file, "w", encoding="utf-8") as fp:
    json.dump({"cookies": cookies, "origins": []}, fp)

print(f"Wrote {len(cookies)} cookies to {state_file}")
if not cookies:
    raise SystemExit("No cookies found for target domain. Sign in first in your browser.")
PY

chmod 600 "${STATE_FILE}"
echo "Storage state file: ${STATE_FILE}"
