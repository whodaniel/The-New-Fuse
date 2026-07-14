#!/usr/bin/env bash
# Autonomous TNF desktop dev → QA → package → verify pipeline (inspect → act → verify).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP="$ROOT/apps/tauri-desktop"
LOG_DIR="$ROOT/.agent/runtime-logs"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$LOG_DIR/autonomous-pipeline-${STAMP}.json"
DMG_PATH="$APP/src-tauri/target/release/bundle/dmg/TNF (The New Fuse) Desktop App_4.1.0_x64.dmg"

mkdir -p "$LOG_DIR"
cd "$ROOT"

phase() { echo ""; echo "========== [pipeline] $1 =========="; }

FAILURES=()
pass() { echo "[pipeline] OK: $1"; }
fail() { echo "[pipeline] FAIL: $1"; FAILURES+=("$1"); }

phase "1/8 — shared + relay-core + chrome extension build"
if (cd "$ROOT/packages/shared" && pnpm run build); then pass "shared build"; else fail "shared build"; fi
if [[ -f "$ROOT/packages/relay-core/dist/standalone-relay.js" ]] || (cd "$ROOT/packages/relay-core" && pnpm run build 2>/dev/null); then
  pass "relay-core build"
else
  fail "relay-core build"
fi
if (cd "$ROOT/apps/chrome-extension" && pnpm run build:v7); then pass "chrome extension build"; else fail "chrome extension build"; fi

phase "2/8 — start local services (relay :3007, API :3001)"
chmod +x "$ROOT/scripts/qa/start-local-relay.sh" "$ROOT/scripts/qa/start-local-api-3001.sh" || true
RELAY_PORT=3007 bash "$ROOT/scripts/qa/start-local-relay.sh" || fail "relay start"
bash "$ROOT/scripts/qa/start-local-api-3001.sh" || fail "api start"

phase "3/8 — tauri-desktop type-check + unit + vite build"
cd "$APP"
if pnpm run type-check; then pass "type-check"; else fail "type-check"; fi
if pnpm run test; then pass "vitest"; else fail "vitest"; fi
if pnpm run build; then pass "vite build"; else fail "vite build"; fi

phase "4/8 — preview smoke"
if bash "$ROOT/scripts/qa/smoke-tauri-desktop-preview.sh"; then pass "preview smoke"; else fail "preview smoke"; fi

phase "5/8 — playwright e2e (all specs)"
if ! (cd "$APP" && pnpm exec playwright install chromium); then fail "playwright install"; fi
E2E_PORT=$(( (RANDOM % 2000) + 4600 ))
export PREVIEW_PORT="$E2E_PORT"
if PREVIEW_PORT="$E2E_PORT" pnpm exec playwright test --reporter=line; then
  pass "playwright e2e"
else
  fail "playwright e2e"
fi

phase "6/8 — dual-mode + web parity"
if bash "$ROOT/scripts/qa/dual-mode-parity-qa.sh"; then pass "dual-mode parity"; else fail "dual-mode parity"; fi

phase "7/8 — package DMG"
cd "$ROOT"
if pnpm run tnf:tauri:dmg; then pass "dmg build"; else fail "dmg build"; fi

phase "8/8 — verify artifact + open"
if [[ -f "$DMG_PATH" ]]; then
  pass "dmg exists"
  if hdiutil verify "$DMG_PATH" >/dev/null 2>&1; then pass "hdiutil verify"; else fail "hdiutil verify"; fi
  open "$DMG_PATH" || true
else
  fail "dmg missing at $DMG_PATH"
fi

STATUS="verified"
if ((${#FAILURES[@]} > 0)); then STATUS="degraded"; fi

FAILURES_JSON='[]'
if ((${#FAILURES[@]} > 0)); then
  FAILURES_JSON="$(printf '"%s",' "${FAILURES[@]}" | sed 's/,$//')"
  FAILURES_JSON="[${FAILURES_JSON}]"
fi

cat >"$OUT" <<EOF
{
  "timestamp": "${STAMP}",
  "phase": "autonomous-dev-production-pipeline",
  "status": "${STATUS}",
  "failures": ${FAILURES_JSON},
  "artifacts": {
    "dmg": "${DMG_PATH}",
    "receipt": "${OUT}"
  },
  "services": {
    "relay": "http://127.0.0.1:3007/health",
    "api": "http://127.0.0.1:3001/api/health"
  },
  "branch": "$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)",
  "commit": "$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)"
}
EOF

echo ""
echo "[pipeline] receipt → $OUT"
cat "$OUT"

if ((${#FAILURES[@]} > 0)); then
  echo "[pipeline] completed with failures: ${FAILURES[*]}"
  exit 1
fi

echo "[pipeline] autonomous pipeline VERIFIED"
exit 0
