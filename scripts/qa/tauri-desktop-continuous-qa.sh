#!/usr/bin/env bash
# TNF inspect → act → verify loop for tauri-desktop swarm QA.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP="$ROOT/apps/tauri-desktop"
LOG_DIR="$ROOT/.agent/runtime-logs"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$LOG_DIR/tauri-desktop-qa-${STAMP}.json"

mkdir -p "$LOG_DIR"
cd "$APP"

echo "[qa] type-check"
pnpm run type-check

echo "[qa] unit tests"
pnpm run test

echo "[qa] production build"
pnpm run build

MAIN_KB=$(find dist/assets/js -name 'main.*.js' -exec du -k {} + 2>/dev/null | awk '{print $1}' | head -1 || echo 0)
VENDOR_KB=$(find dist/assets/js -name 'vendor.*.js' -exec du -k {} + 2>/dev/null | awk '{print $1}' | head -1 || echo 0)

echo "[qa] preview smoke"
bash "$ROOT/scripts/qa/smoke-tauri-desktop-preview.sh"

E2E_STATUS="skipped"
if [[ -f "$APP/node_modules/@playwright/test/package.json" ]]; then
  cd "$APP"
  # Ensure the browser binary exists (idempotent; fast when already cached).
  echo "[qa] ensuring playwright chromium is installed"
  pnpm exec playwright install chromium >/dev/null 2>&1 || true
  # Unique preview port per run so a stray :4173 server can't serve a stale build.
  E2E_PORT=$(( (RANDOM % 2000) + 4200 ))
  echo "[qa] playwright route e2e (port ${E2E_PORT})"
  if PREVIEW_PORT="$E2E_PORT" pnpm exec playwright test --reporter=line; then
    E2E_STATUS="pass"
  else
    E2E_STATUS="fail"
    exit 1
  fi
else
  echo "[qa] playwright skipped (run pnpm add -D @playwright/test in apps/tauri-desktop)"
fi

cd "$APP"

cat >"$OUT" <<EOF
{
  "timestamp": "${STAMP}",
  "phase": "continuous-qa",
  "status": "verified",
  "checks": {
    "typeCheck": "pass",
    "vitest": "pass",
    "viteBuild": "pass",
    "previewSmoke": "pass",
    "playwrightE2e": "${E2E_STATUS}"
  },
  "bundleKb": {
    "main": ${MAIN_KB:-0},
    "vendor": ${VENDOR_KB:-0}
  },
  "repo": "apps/tauri-desktop",
  "branch": "$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)",
  "commit": "$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)"
}
EOF

echo "[qa] log → $OUT"
cat "$OUT"
