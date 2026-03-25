# TNF Frontload Contract

## Invariants
- Frontload runs at shell startup exactly once per session.
- Banner output never hard-fails the shell startup.
- Cache regeneration is best-effort when the cache is missing.
- Output uses `~/.tnf/handoff-current.json` as the primary cache.

## Signals
- `TNF_STATUS_SHOWN=1` prevents duplicate output in the same session.
- `~/.tnf/tnf-status` is the canonical banner renderer.
- `~/.tnf/update-from-latest.sh` is the canonical cache builder.

## Success Criteria
- `~/.zshrc` contains the frontload block between markers.
- `~/.tnf/tnf-status` executes without returning non-zero on missing cache.
- `~/.tnf/handoff-current.json` exists or can be generated on demand.
- OpenClaw `LATEST.md` is readable and recent.
