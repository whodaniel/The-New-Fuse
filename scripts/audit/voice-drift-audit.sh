#!/bin/bash
# Compare voice bridge tooling: canonical scripts/system vs live PATH copies.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CANON="$MONO_ROOT/scripts/system"
LIVE="${HOME}/bin"
TNF_BIN="${HOME}/.tnf/bin"

FILES=(
  voice_server.py
  stream_watch.py
  voice-response-audio-watch.py
  voice
  listen
  voice-agent-send
  twipctl
  voicebridge-paths.sh
)

echo "TNF Voice Drift Audit"
echo "Canonical: $CANON"
echo "Live:      $LIVE"
echo "TNF bin:   $TNF_BIN"
echo

fail=0
for f in "${FILES[@]}"; do
  c="$CANON/$f"
  l="$LIVE/$f"
  t="$TNF_BIN/$f"
  printf '%-32s' "$f"
  if [[ -f "$c" && -f "$l" ]]; then
    if [[ -L "$l" ]] && [[ "$(readlink "$l")" == "$c" ]]; then
      printf ' canon==live(symlink)'
    elif cmp -s "$c" "$l"; then
      printf ' canon==live'
    else
      printf ' DRIFT canon!=live'
      fail=$((fail + 1))
    fi
  elif [[ -f "$c" ]]; then
    printf ' canon-only'
  elif [[ -f "$l" ]]; then
    printf ' live-only'
    fail=$((fail + 1))
  else
    printf ' missing'
    fail=$((fail + 1))
  fi
  if [[ -L "$t" ]] && [[ "$(readlink "$t")" == "$c" ]]; then
    printf ' | tnf-bin OK'
  elif [[ -e "$t" ]]; then
    printf ' | tnf-bin drift'
  fi
  echo
done

echo
if [[ "$fail" -gt 0 ]]; then
  echo "FAIL: $fail drift issue(s). Canonical source: scripts/system/"
  echo "Fix: bash scripts/consolidation/personal-runtime-cleanup.sh --apply"
  exit 1
fi
echo "PASS: canonical matches live for tracked files"
