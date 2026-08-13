#!/usr/bin/env bash
# Smoke-check built SPA via vite preview (inspect → verify).
set -euo pipefail

APP="$(cd "$(dirname "$0")/../../apps/tauri-desktop" && pwd)"
PORT="${SMOKE_PORT:-$(node -e "const n=require('net');const s=n.createServer();s.listen(0,'127.0.0.1',()=>{console.log(s.address().port);s.close()});")}"
PREVIEW_PID=""

cleanup() {
  if [[ -n "${PREVIEW_PID:-}" ]]; then
    pkill -P "$PREVIEW_PID" 2>/dev/null || true
    kill "$PREVIEW_PID" 2>/dev/null || true
  fi
  pkill -f "vite preview --host 127.0.0.1 --port ${PORT}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

cd "$APP"
[[ -d dist ]] || { echo "[smoke] dist missing — run vite build first"; exit 1; }

pnpm exec vite preview --host 127.0.0.1 --port "$PORT" --strictPort >/tmp/tnf-preview-smoke.log 2>&1 &
PREVIEW_PID=$!

READY=0
for _ in $(seq 1 45); do
  if curl -sf --max-time 2 "http://127.0.0.1:${PORT}/" >/tmp/tnf-preview-body.html 2>/dev/null; then
    READY=1
    break
  fi
  sleep 1
done

if [[ "$READY" -ne 1 ]]; then
  echo "[smoke] preview server failed on :${PORT}"
  cat /tmp/tnf-preview-smoke.log
  exit 1
fi

grep -q 'id="root"' /tmp/tnf-preview-body.html || {
  echo "[smoke] index.html missing #root mount"
  exit 1
}

MAIN_JS=$(grep -oE 'assets/js/main\.[^"]+\.js' /tmp/tnf-preview-body.html | head -1)
[[ -n "$MAIN_JS" ]] || { echo "[smoke] main bundle script tag not found"; exit 1; }

curl -sf --max-time 10 "http://127.0.0.1:${PORT}/${MAIN_JS}" >/dev/null

echo "[smoke] pass — preview on :${PORT}, main=${MAIN_JS}"
