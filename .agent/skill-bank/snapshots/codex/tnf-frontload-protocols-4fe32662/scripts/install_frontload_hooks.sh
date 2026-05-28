#!/usr/bin/env bash
set -euo pipefail

ZSHRC="$HOME/.zshrc"
BEGIN_MARK="# BEGIN TNF FRONTLOAD"
END_MARK="# END TNF FRONTLOAD"

if [ ! -f "$ZSHRC" ]; then
  echo "~/.zshrc missing; create it first." >&2
  exit 1
fi

if ! grep -qF "$BEGIN_MARK" "$ZSHRC"; then
  cat >>"$ZSHRC" <<'BLOCK'

# BEGIN TNF FRONTLOAD
# TNF Frontload Integration: Auto-display status on shell startup (once per session)
if [ -z "$TNF_STATUS_SHOWN" ]; then
  export TNF_STATUS_SHOWN=1
  if [ ! -f "$HOME/.tnf/handoff-current.json" ] && [ -x "$HOME/.tnf/update-from-latest.sh" ]; then
    "$HOME/.tnf/update-from-latest.sh" >/dev/null 2>&1 || true
  fi
  if [ -x "$HOME/.tnf/tnf-status" ]; then
    "$HOME/.tnf/tnf-status" || true
  fi
fi
# END TNF FRONTLOAD
BLOCK
  echo "Installed frontload block in ~/.zshrc"
else
  echo "Frontload block already present in ~/.zshrc"
fi
