#!/usr/bin/env bash
# Dual-mode QA: local installed preview + SaaS endpoint parity
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP="$ROOT/apps/tauri-desktop"
LOG_DIR="$ROOT/.agent/runtime-logs"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$LOG_DIR/dual-mode-parity-${STAMP}.json"

mkdir -p "$LOG_DIR"
cd "$APP"

LOCAL_E2E="skipped"
SAAS_E2E="skipped"
CONTRAST="skipped"

echo "[dual-mode] ensuring playwright chromium"
if ! pnpm exec playwright install chromium; then
  echo "[dual-mode] playwright install failed"
  exit 1
fi

E2E_PORT=$(( (RANDOM % 2000) + 4300 ))
export PREVIEW_PORT="$E2E_PORT"

echo "[dual-mode] local harness e2e (port ${E2E_PORT})"
if PREVIEW_PORT="$E2E_PORT" pnpm exec playwright test e2e/dual-mode-harness.spec.ts --reporter=line; then
  LOCAL_E2E="pass"
else
  LOCAL_E2E="fail"
  exit 1
fi

echo "[dual-mode] contrast readability e2e"
if PREVIEW_PORT="$E2E_PORT" pnpm exec playwright test e2e/contrast-readability.spec.ts --reporter=line; then
  CONTRAST="pass"
else
  CONTRAST="fail"
  exit 1
fi

echo "[dual-mode] web surface parity (thenewfuse.com)"
if TNF_WEB_BASE_URL="${TNF_WEB_BASE_URL:-https://thenewfuse.com}" \
  PREVIEW_PORT="$E2E_PORT" pnpm exec playwright test e2e/web-surface-parity.spec.ts --reporter=line; then
  SAAS_E2E="pass"
else
  SAAS_E2E="fail"
  exit 1
fi

cat >"$OUT" <<EOF
{
  "timestamp": "${STAMP}",
  "phase": "dual-mode-parity",
  "checks": {
    "localHarnessE2e": "${LOCAL_E2E}",
    "contrastReadability": "${CONTRAST}",
    "webSurfaceParity": "${SAAS_E2E}"
  },
  "previewPort": ${E2E_PORT},
  "webBase": "${TNF_WEB_BASE_URL:-https://thenewfuse.com}"
}
EOF

echo "[dual-mode] log → $OUT"
cat "$OUT"
