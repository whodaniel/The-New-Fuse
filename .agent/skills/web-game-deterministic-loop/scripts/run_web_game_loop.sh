#!/usr/bin/env bash
set -euo pipefail

PROJECT=""
PAGE="/"
PORT="8000"
ITERATIONS="3"
PAUSE_MS="250"
ACTIONS_FILE=""
ACTIONS_JSON=""
CLICK_SELECTOR=""
HEADLESS="1"
OUTDIR="output/web-game"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project) PROJECT="$2"; shift 2 ;;
    --page) PAGE="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --iterations) ITERATIONS="$2"; shift 2 ;;
    --pause-ms) PAUSE_MS="$2"; shift 2 ;;
    --actions-file) ACTIONS_FILE="$2"; shift 2 ;;
    --actions-json) ACTIONS_JSON="$2"; shift 2 ;;
    --click-selector) CLICK_SELECTOR="$2"; shift 2 ;;
    --headless) HEADLESS="$2"; shift 2 ;;
    --outdir) OUTDIR="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$PROJECT" ]]; then
  echo "Missing --project /absolute/path"
  exit 1
fi

if [[ ! -d "$PROJECT" ]]; then
  echo "Project directory not found: $PROJECT"
  exit 1
fi

export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
WEB_GAME_CLIENT="$CODEX_HOME/skills/develop-web-game/scripts/web_game_playwright_client.js"
DEFAULT_ACTIONS="$CODEX_HOME/skills/develop-web-game/references/action_payloads.json"

if [[ ! -f "$WEB_GAME_CLIENT" ]]; then
  echo "Playwright client not found: $WEB_GAME_CLIENT"
  exit 1
fi

if [[ -z "$ACTIONS_FILE" && -z "$ACTIONS_JSON" ]]; then
  ACTIONS_FILE="$DEFAULT_ACTIONS"
fi

if [[ ! -f "$ACTIONS_FILE" && -z "$ACTIONS_JSON" ]]; then
  echo "Actions file not found: $ACTIONS_FILE"
  exit 1
fi

URL="http://127.0.0.1:${PORT}${PAGE}"

cd "$PROJECT"
python3 -m http.server "$PORT" >/tmp/web_game_loop_server.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true' EXIT
sleep 1

CMD=(node "$WEB_GAME_CLIENT" --url "$URL" --iterations "$ITERATIONS" --pause-ms "$PAUSE_MS" --headless "$HEADLESS" --screenshot-dir "$OUTDIR")

if [[ -n "$CLICK_SELECTOR" ]]; then
  CMD+=(--click-selector "$CLICK_SELECTOR")
fi
if [[ -n "$ACTIONS_JSON" ]]; then
  CMD+=(--actions-json "$ACTIONS_JSON")
else
  CMD+=(--actions-file "$ACTIONS_FILE")
fi

"${CMD[@]}"

echo "Artifacts: $PROJECT/$OUTDIR"
ls -la "$OUTDIR"
