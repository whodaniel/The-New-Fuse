#!/bin/bash
# Symlink repo voice tools into ~/.tnf/bin for PATH convenience (optional).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SYSTEM="$MONO_ROOT/scripts/system"
DEST="${HOME}/.tnf/bin"
mkdir -p "$DEST"

link_one() {
  local name="$1"
  local src="$SYSTEM/$name"
  local dst="$DEST/$name"
  [[ -e "$src" ]] || return 0
  ln -sfn "$src" "$dst"
  echo "linked $dst -> $src"
}

for name in voice listen voice-target-here voice-target-pick voice-target-show \
  voice-target-clear voice-mic-toggle voice-response-audio-toggle voice-agent-send \
  voice-stt-selftest ai-speak cursor-speak voicebridge-paths.sh; do
  link_one "$name"
done

echo "Add to PATH if needed: export PATH=\"$DEST:\$PATH\""
