# OpenClaw Frontload Source

## Source of Truth
- `~/.openclaw/workspace/handoff/LATEST.md`
- `~/.openclaw/workspace/handoff/cloudflare-health.json` (optional)

## Cache Builder
- `~/.tnf/update-from-latest.sh` generates `~/.tnf/handoff-current.json`.

## Verification
- Confirm `LATEST.md` exists and updates with new sessions.
- Regenerate cache: `~/.tnf/update-from-latest.sh`.
- Render banner: `~/.tnf/tnf-status`.
