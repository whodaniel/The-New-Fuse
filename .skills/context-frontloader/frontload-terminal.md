# Terminal Frontload (zsh)

## Canonical Hook (Observed)

Preferred behavior:

- On a new interactive shell, show `~/.tnf/tnf-status` once if `~/.tnf/handoff-current.json` exists.
- Set `TNF_STATUS_SHOWN=1` to prevent repeat banners in the same session.

Common drift:

- Banner hook removed/commented out.
- Banner hook moved into a non-interactive init file.
- Banner hook prints secrets by accident.

## Recommended Hook Snippet

Keep the banner snippet separate from other concerns (like `~/.tnf-claude-env`).

```
if [ -f "$HOME/.tnf/handoff-current.json" ] && [ -z "$TNF_STATUS_SHOWN" ]; then
  export TNF_STATUS_SHOWN=1
  "$HOME/.tnf/tnf-status" || true
fi
```

