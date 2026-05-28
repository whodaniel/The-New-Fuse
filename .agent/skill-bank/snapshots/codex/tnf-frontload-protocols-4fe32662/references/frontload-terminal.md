# Terminal Frontload (zsh)

## Hook Location
- `~/.zshrc` contains the TNF frontload hook.
- Required markers:
  - `# BEGIN TNF FRONTLOAD`
  - `# END TNF FRONTLOAD`

## Expected Block
```
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
```

## Controls
- `tnf-frontload on|off|status` toggles the block by commenting lines.
- For manual repair, run `scripts/install_frontload_hooks.sh`.
