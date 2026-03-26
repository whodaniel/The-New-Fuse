#!/bin/bash
set -euo pipefail

THIS_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_BIN="$THIS_DIR/bin"
TARGET_BIN="$HOME/bin"
mkdir -p "$TARGET_BIN" "$HOME/.openclaw"

copy_tool() {
  local name="$1"
  if [[ -f "$SRC_BIN/$name" ]]; then
    cp "$SRC_BIN/$name" "$TARGET_BIN/$name"
    chmod +x "$TARGET_BIN/$name" || true
    echo "Installed: $TARGET_BIN/$name"
  fi
}

copy_tool "voice"
copy_tool "voice_server.py"
copy_tool "stream_watch.py"
copy_tool "voice-target-click-daemon.swift"
copy_tool "voice-target-click-daemon"
copy_tool "voice-target-here"
copy_tool "voice-target-pick"
copy_tool "voice-target-show"
copy_tool "voice-target-clear"
copy_tool "voice-mic-toggle"
copy_tool "voice-response-audio-toggle"
copy_tool "voice-response-audio-watch.py"

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 not found."
  exit 1
fi

if ! python3 - <<'PY' >/dev/null 2>&1
import flask
PY
then
  echo "Installing Flask for voice server..."
  python3 -m pip install --user --break-system-packages flask >/dev/null 2>&1 || \
  python3 -m pip install --user flask >/dev/null 2>&1 || true
fi

if [[ ! -x "$TARGET_BIN/voice-target-click-daemon" && -f "$TARGET_BIN/voice-target-click-daemon.swift" ]]; then
  if command -v swiftc >/dev/null 2>&1; then
    echo "Compiling click-anchor daemon..."
    swiftc "$TARGET_BIN/voice-target-click-daemon.swift" -o "$TARGET_BIN/voice-target-click-daemon" || true
    chmod +x "$TARGET_BIN/voice-target-click-daemon" || true
  fi
fi

if ! command -v cliclick >/dev/null 2>&1; then
  echo "NOTICE: cliclick not found. Install with: brew install cliclick"
fi

ZSHRC="$HOME/.zshrc"
if [[ ! -f "$ZSHRC" ]]; then
  touch "$ZSHRC"
fi

BLOCK_START="# BEGIN VOICE BRIDGE HOTKEYS"
BLOCK_END="# END VOICE BRIDGE HOTKEYS"
TMP_ZSHRC="$(mktemp)"

awk -v start="$BLOCK_START" -v end="$BLOCK_END" '
$0 == start { in_block=1; next }
$0 == end { in_block=0; next }
!in_block { print }
' "$ZSHRC" > "$TMP_ZSHRC"

cat >> "$TMP_ZSHRC" <<'ZSH'

# BEGIN VOICE BRIDGE HOTKEYS
# Primary shortcuts (Option+key at shell prompt):
# Option+t -> lock destination to current terminal tab.
# Option+m -> toggle browser mic capture on/off.
# Option+a -> capture frontmost app/window as destination (2s countdown).
# Option+r -> toggle AI response audio on/off.
bindkey -s '^[t' 'voice-target-here\n'
bindkey -s '^[m' 'voice-mic-toggle\n'
bindkey -s '^[a' 'voice-target-pick --delay 2\n'
bindkey -s '^[r' 'voice-response-audio-toggle\n'

# Fallback shortcuts (Ctrl+X then key):
# Ctrl+X,t -> lock current terminal.
# Ctrl+X,m -> mic toggle.
# Ctrl+X,a -> lock frontmost app/window.
# Ctrl+X,r -> toggle AI response audio.
bindkey -s '^Xt' 'voice-target-here\n'
bindkey -s '^Xm' 'voice-mic-toggle\n'
bindkey -s '^Xa' 'voice-target-pick --delay 2\n'
bindkey -s '^Xr' 'voice-response-audio-toggle\n'

alias vtarget='voice-target-here'
alias vtapp='voice-target-pick --delay 2'
alias vmic='voice-mic-toggle'
alias vra='voice-response-audio-toggle'
alias vt='voice-target-here'
alias va='voice-target-pick --delay 2'
alias vm='voice-mic-toggle'
alias vr='voice-response-audio-toggle'
# END VOICE BRIDGE HOTKEYS
ZSH

mv "$TMP_ZSHRC" "$ZSHRC"
echo "Refreshed hotkeys block in ~/.zshrc"

echo ""
echo "Install complete."
echo "Next: open a NEW terminal tab, run: voice"
