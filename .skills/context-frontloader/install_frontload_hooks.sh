#!/usr/bin/env bash
set -euo pipefail

zshrc="$HOME/.zshrc"
if [[ ! -f "$zshrc" ]]; then
  echo "FAIL: missing $zshrc"
  exit 1
fi

marker_begin="# BEGIN TNF FRONTLOAD (managed)"
marker_end="# END TNF FRONTLOAD (managed)"

snippet="$(cat <<'EOS'
# BEGIN TNF FRONTLOAD (managed)
# Show TNF status once per interactive shell session (safe, no secrets).
if [ -f "$HOME/.tnf/handoff-current.json" ] && [ -z "$TNF_STATUS_SHOWN" ]; then
  export TNF_STATUS_SHOWN=1
  "$HOME/.tnf/tnf-status" || true
fi

# TNF Claude wrapper/env interception (separate concern from the banner).
if [[ -f "$HOME/.tnf-claude-env" ]]; then
  source "$HOME/.tnf-claude-env"
fi
# END TNF FRONTLOAD (managed)
EOS
)"

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

if rg -n "^${marker_begin}$" "$zshrc" >/dev/null 2>&1; then
  awk -v begin="$marker_begin" -v end="$marker_end" -v repl="$snippet" '
    $0==begin {print repl; inblock=1; next}
    $0==end {inblock=0; next}
    inblock==1 {next}
    {print}
  ' "$zshrc" > "$tmp"
else
  cat "$zshrc" > "$tmp"
  printf "\n%s\n" "$snippet" >> "$tmp"
fi

cp "$tmp" "$zshrc"
echo "OK: updated $zshrc"

