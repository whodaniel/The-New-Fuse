# OpenClaw Frontload Source (optional host)

## Status

OpenClaw is an **optional** assimilation host. It is **not** TNF canonical
handoff SoT. See `docs/protocols/ADAPTABLE_HOST_VERIFICATION.md`.

## When enlisted

- `~/.openclaw/workspace/handoff/LATEST.md` may feed cache builders
- `~/.openclaw/workspace/handoff/cloudflare-health.json` (optional)

Enlist via `TNF_OPENCLAW_REQUIRED=1`, `TNF_OPENCLAW_ACTIVE=1`,
`FRONTLOAD_REQUIRE_OPENCLAW_LATEST=1`, or a live OpenClaw process.

## Cache Builder

- `~/.tnf/update-from-latest.sh` generates `~/.tnf/handoff-current.json`.
- Prefer TNF-emitted handoff when OpenClaw is inactive.

## Verification

- Do **not** fail frontload verification solely because OpenClaw LATEST is
  missing when the host is inactive.
- When enlisted: confirm `LATEST.md` exists and is recent.
- Regenerate cache: `~/.tnf/update-from-latest.sh`.
- Render banner: `~/.tnf/tnf-status`.
