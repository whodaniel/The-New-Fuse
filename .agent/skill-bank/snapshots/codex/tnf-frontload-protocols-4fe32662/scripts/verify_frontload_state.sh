#!/usr/bin/env bash
set -euo pipefail

ZSHRC="$HOME/.zshrc"
BEGIN_MARK="# BEGIN TNF FRONTLOAD"
END_MARK="# END TNF FRONTLOAD"

status=0

say() { printf "%s\n" "$*"; }
warn() { printf "WARN: %s\n" "$*"; status=1; }

say "TNF frontload verification"

if [ -f "$ZSHRC" ]; then
  if grep -qF "$BEGIN_MARK" "$ZSHRC" && grep -qF "$END_MARK" "$ZSHRC"; then
    say "OK: frontload markers in ~/.zshrc"
  else
    warn "missing frontload markers in ~/.zshrc"
  fi
else
  warn "missing ~/.zshrc"
fi

if command -v tnf-frontload >/dev/null 2>&1; then
  say "OK: tnf-frontload command present"
else
  warn "tnf-frontload command missing"
fi

if [ -x "$HOME/.tnf/tnf-status" ]; then
  say "OK: ~/.tnf/tnf-status executable"
else
  warn "~/.tnf/tnf-status missing or not executable"
fi

if [ -x "$HOME/.tnf/update-from-latest.sh" ]; then
  say "OK: ~/.tnf/update-from-latest.sh executable"
else
  warn "~/.tnf/update-from-latest.sh missing or not executable"
fi

if [ -f "$HOME/.tnf/handoff-current.json" ]; then
  say "OK: ~/.tnf/handoff-current.json present"
else
  warn "~/.tnf/handoff-current.json missing (can be regenerated)"
fi

if [ -f "$HOME/.openclaw/workspace/handoff/LATEST.md" ]; then
  say "OK: OpenClaw LATEST.md present"
else
  warn "OpenClaw LATEST.md missing"
fi

exit $status
