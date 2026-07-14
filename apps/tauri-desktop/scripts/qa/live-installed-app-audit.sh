#!/usr/bin/env bash
# Visual UX audit of the installed TNF Desktop app via command palette + screencapture.
set -euo pipefail

APP_NAME="TNF (The New Fuse) Desktop App"
PROC="tnf-desktop"
OUT_DIR="${HOME}/.tnf/ux-audit/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$OUT_DIR"

ROUTES=(
  "Dashboard"
  "Platform"
  "Browser Control"
  "Swarm Terminal"
  "OAGI Hub"
  "Antigravity"
  "Agent Hub"
  "A2A Control"
  "Multi-Agent Chat"
  "Knowledge Hub"
  "Workflows"
  "MCP Store"
  "Analytics"
  "Web Parity"
  "Settings"
)

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | tr ' ' '-'
}

echo "[live-audit] Activating ${APP_NAME}"
osascript -e "tell application \"${APP_NAME}\" to activate" >/dev/null
sleep 1

for route in "${ROUTES[@]}"; do
  slug="$(slugify "$route")"
  echo "[live-audit] Navigating → ${route}"
  osascript <<EOF >/dev/null
tell application "${APP_NAME}" to activate
delay 0.4
tell application "System Events"
  tell process "${PROC}"
    set frontmost to true
  end tell
  keystroke "k" using command down
  delay 0.5
  keystroke "a" using command down
  delay 0.1
  keystroke "${route}"
  delay 0.4
  key code 36
end tell
EOF
  sleep 1.2
  win_id="$(osascript -e "tell application \"System Events\" to tell process \"${PROC}\" to get id of window 1" 2>/dev/null || true)"
  if [[ -n "${win_id}" ]]; then
    screencapture -x -l"${win_id}" "${OUT_DIR}/${slug}.png"
    echo "[live-audit] Screenshot → ${OUT_DIR}/${slug}.png"
  else
    screencapture -x "${OUT_DIR}/${slug}-fullscreen.png"
    echo "[live-audit] Fallback fullscreen → ${OUT_DIR}/${slug}-fullscreen.png"
  fi
done

echo "[live-audit] Done — ${#ROUTES[@]} routes captured in ${OUT_DIR}"
