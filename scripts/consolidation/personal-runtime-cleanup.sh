#!/bin/bash
# Personal machine cleanup: remove duplicate voice copies; wire ~/.tnf/bin symlinks.
# Default is dry-run. Pass --apply to make changes.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CANON="$MONO_ROOT/scripts/system"
TNF_BIN="${HOME}/.tnf/bin"
HOME_BIN="${HOME}/bin"
APPLY=0

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1 ;;
    --help|-h)
      echo "Usage: personal-runtime-cleanup.sh [--apply]"
      echo "  --apply  Replace ~/bin voice duplicates with symlinks; link ~/.tnf/bin"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

VOICE_NAMES=(
  voice_server.py
  stream_watch.py
  stream_watch_stealth.py
  voice-response-audio-watch.py
  voice
  listen
  voice-agent-send
  voice-agent-relay-loop
  voice-target-here
  voice-target-pick
  voice-target-show
  voice-target-clear
  voice-mic-toggle
  voice-response-audio-toggle
  voice-stt-selftest
  voice-anchor-watchdog.sh
  voice-protocol-coop-loop.sh
  voice-keyword-router.py
  voice-target-click-daemon
  voice-target-click-daemon.swift
  voicebridge-paths.sh
  twipctl
)

echo "TNF personal runtime cleanup"
echo "Monorepo:  $MONO_ROOT"
echo "Canonical: $CANON"
echo "Mode:      $([[ $APPLY -eq 1 ]] && echo APPLY || echo dry-run)"
echo

mkdir -p "$TNF_BIN"

link_tnf_bin() {
  local name="$1"
  local src="$CANON/$name"
  local dst="$TNF_BIN/$name"
  if [[ ! -e "$src" ]]; then
    return 0
  fi
  if [[ -L "$dst" ]] && [[ "$(readlink "$dst")" == "$src" ]]; then
    echo "  OK  $dst"
    return 0
  fi
  if [[ $APPLY -eq 1 ]]; then
    ln -sfn "$src" "$dst"
    echo "  LINK $dst -> $src"
  else
    echo "  WOULD LINK $dst -> $src"
  fi
}

echo "== ~/.tnf/bin (recommended PATH for voice) =="
for name in voice listen voice-target-here voice-target-pick voice-target-show \
  voice-target-clear voice-mic-toggle voice-response-audio-toggle voice-agent-send \
  voice-stt-selftest voicebridge-paths.sh; do
  link_tnf_bin "$name"
done

echo
echo "== ~/bin voice duplicates (optional replace with symlinks) =="
for name in "${VOICE_NAMES[@]}"; do
  src="$CANON/$name"
  dst="$HOME_BIN/$name"
  [[ -e "$src" ]] || continue
  [[ -e "$dst" ]] || continue
  if [[ -L "$dst" ]] && [[ "$(readlink "$dst")" == "$src" ]]; then
    echo "  OK  $dst"
    continue
  fi
  if cmp -s "$src" "$dst" 2>/dev/null; then
    echo "  SAME $dst (identical copy; symlink optional)"
    continue
  fi
  if [[ $APPLY -eq 1 ]]; then
    if [[ -f "$dst" || -L "$dst" ]]; then
      rm -f "$dst"
    fi
    ln -sfn "$src" "$dst"
    echo "  SYMLINK $dst -> $src"
  else
    echo "  DRIFT $dst (differs from canonical)"
  fi
done

echo
echo "== Already removed (verify) =="
for path in "$HOME/app" "$HOME/apps" "$HOME/tnf"; do
  if [[ -e "$path" ]]; then
    echo "  STILL EXISTS: $path"
  else
    echo "  gone: $path"
  fi
done

echo
echo "== Keep on personal machine =="
echo "  $MONO_ROOT          — dev monorepo"
echo "  ~/.tnf/             — operator runtime (director loops, health)"
echo "  $MONO_ROOT/.voicebridge/ — voice state (or project .voicebridge)"
echo "  ~/.whisper-models/  — STT models (if using voice)"
echo "  ~/bin               — personal tools only (gh, icloud, pcloud); voice via symlinks"
echo
echo "Recommended PATH:"
echo "  export PATH=\"\$HOME/.tnf/bin:\$PATH\""
echo
if [[ $APPLY -eq 0 ]]; then
  echo "Dry-run only. Re-run with --apply to symlink voice tools."
fi
