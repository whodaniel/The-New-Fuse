#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/auth/browser_session_to_playwright_state.sh --url <target_url> [options]

Options:
  --url <url>            Target URL to open with authenticated state (required)
  --domain <domain>      Cookie domain override (default: host from --url)
  --state-file <path>    Playwright storage state output file
  --browser <name>       Browser profile for cookie extraction (default: chrome)
                         Supported: chrome, chromium, brave, edge, firefox
  --skip-playwright      Only export storage state; do not open Playwright CLI
  --help, -h             Show this help

Environment overrides:
  BROWSER_COOKIE_VENV    Path to Python venv used for browser_cookie3
  PWCLI                  Playwright CLI wrapper path
  CODEX_HOME             Used to resolve default PWCLI path

Examples:
  scripts/auth/browser_session_to_playwright_state.sh --url "https://example.com/dashboard"
  scripts/auth/browser_session_to_playwright_state.sh --url "https://app.example.com" --domain example.com --skip-playwright
USAGE
}

TARGET_URL=""
DOMAIN_OVERRIDE=""
STATE_FILE=""
BROWSER_NAME="chrome"
SKIP_PLAYWRIGHT="false"

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
    --skip-playwright)
      SKIP_PLAYWRIGHT="true"
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

if [[ -z "${TARGET_URL}" ]]; then
  echo "--url is required." >&2
  usage
  exit 1
fi

if [[ -z "${DOMAIN_OVERRIDE}" ]]; then
  DOMAIN_OVERRIDE="$(python3 - "${TARGET_URL}" <<'PY'
import sys
from urllib.parse import urlparse

url = sys.argv[1]
parsed = urlparse(url)
print(parsed.hostname or "")
PY
)"
fi

if [[ -z "${DOMAIN_OVERRIDE}" ]]; then
  echo "Could not derive domain from URL: ${TARGET_URL}" >&2
  exit 1
fi

safe_domain="$(printf '%s' "${DOMAIN_OVERRIDE}" | tr -c 'A-Za-z0-9._-' '_' | sed 's/^_//;s/_$//')"
if [[ -z "${STATE_FILE}" ]]; then
  STATE_FILE="/tmp/playwright_state_${safe_domain}.json"
fi

case "${BROWSER_NAME}" in
  chrome|chromium|brave|edge|firefox) ;;
  *)
    echo "Unsupported --browser value: ${BROWSER_NAME}" >&2
    echo "Supported values: chrome, chromium, brave, edge, firefox" >&2
    exit 1
    ;;
esac

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

try:
    import browser_cookie3
except Exception as exc:
    raise SystemExit(f"Failed to import browser_cookie3: {exc}")


def load_cookie_jar(name: str):
    loaders = {
        "chrome": browser_cookie3.chrome,
        "chromium": browser_cookie3.chromium,
        "brave": browser_cookie3.brave,
        "edge": browser_cookie3.edge,
        "firefox": browser_cookie3.firefox,
    }
    loader = loaders.get(name)
    if loader is None:
        raise SystemExit(f"Unsupported browser loader: {name}")

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
target_origin = urlparse(target_url)
target_host = (target_origin.hostname or "").lower()
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

state = {"cookies": cookies, "origins": []}
with open(state_file, "w", encoding="utf-8") as fp:
    json.dump(state, fp)

print(f"Wrote {len(cookies)} cookies to {state_file}")
if not cookies:
    raise SystemExit("No cookies matched target domain. Sign in via browser first, then rerun.")
PY

chmod 600 "${STATE_FILE}"
echo "Playwright storage state ready: ${STATE_FILE}"

if [[ "${SKIP_PLAYWRIGHT}" == "true" ]]; then
  exit 0
fi

export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
PWCLI="${PWCLI:-$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh}"

if [[ ! -x "${PWCLI}" ]]; then
  echo "Playwright CLI wrapper not found at: ${PWCLI}" >&2
  echo "Run again with --skip-playwright and load state manually." >&2
  exit 1
fi

TARGET_ORIGIN="$(python3 - "${TARGET_URL}" <<'PY'
import sys
from urllib.parse import urlparse

parsed = urlparse(sys.argv[1])
origin = f"{parsed.scheme}://{parsed.netloc}"
print(origin)
PY
)"

"${PWCLI}" open "${TARGET_ORIGIN}" --browser "${BROWSER_NAME}" >/dev/null
"${PWCLI}" state-load "${STATE_FILE}" >/dev/null
"${PWCLI}" goto "${TARGET_URL}" >/dev/null
SNAPSHOT_OUTPUT="$("${PWCLI}" snapshot)"
printf '%s\n' "${SNAPSHOT_OUTPUT}"

CURRENT_URL="$(printf '%s\n' "${SNAPSHOT_OUTPUT}" | sed -n 's/^- Page URL: //p' | head -n 1)"
if [[ -n "${CURRENT_URL}" ]]; then
  CURRENT_HOST="$(python3 - "${CURRENT_URL}" <<'PY'
import sys
from urllib.parse import urlparse
print(urlparse(sys.argv[1]).hostname or "")
PY
)"
  TARGET_HOST="$(python3 - "${TARGET_URL}" <<'PY'
import sys
from urllib.parse import urlparse
print(urlparse(sys.argv[1]).hostname or "")
PY
)"

  if printf '%s' "${CURRENT_URL}" | grep -Eiq '/(login|signin|sign-in|signup|register)'; then
    echo "Warning: current URL looks like an auth page: ${CURRENT_URL}" >&2
    exit 2
  fi

  if [[ -n "${TARGET_HOST}" && -n "${CURRENT_HOST}" && "${CURRENT_HOST}" != "${TARGET_HOST}" ]]; then
    echo "Warning: expected host ${TARGET_HOST} but landed on ${CURRENT_HOST} (${CURRENT_URL})" >&2
    exit 2
  fi
fi

echo "Authenticated state loaded in Playwright for ${TARGET_URL}"
