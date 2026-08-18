#!/usr/bin/env bash
# TNF boot hook — runs the environment discovery adapter on every boot.
# Idempotent. Never blocks. The adapter records a manifest, the boot does
# not depend on success.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ADAPTER="$ROOT/scripts/tnf-environment-adapter.mjs"

if [[ ! -f "$ADAPTER" ]]; then
  exit 0
fi

# First-run nudging: if no manifest has ever been produced, mention it.
if [[ ! -f "$HOME/.tnf/environment-manifest.json" ]]; then
  echo "[tnf boot 0/14] First run detected — building environment manifest"
  echo "[tnf boot 0/14] Run 'tnf environment show --summary' after boot to inspect"
fi

node "$ADAPTER" >/dev/null 2>&1 || true
