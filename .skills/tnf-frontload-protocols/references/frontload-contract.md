# TNF Frontload Contract

## Invariants

- Frontload runs at shell startup exactly once per session.
- Banner output never hard-fails the shell startup.
- Cache regeneration is best-effort when the cache is missing.
- Output uses `~/.tnf/handoff-current.json` as the primary cache.
- Canonical handoff content is TNF-native (`SESSION_HANDOFF_LATEST` / emitted
  cache). OpenClaw `LATEST.md` is an optional legacy host feed.
- Frontload orientation teaches **Work Plane Separation**: core OSS / Super
  Admin harness vs deployer config vs tenant/personal user work (never commit
  the last plane to public `main`). See
  `docs/protocols/ADAPTABLE_HOST_VERIFICATION.md`.

## Signals

- `TNF_STATUS_SHOWN=1` prevents duplicate output in the same session.
- `~/.tnf/tnf-status` is the canonical banner renderer.
- `~/.tnf/update-from-latest.sh` is the canonical cache builder (may ingest
  OpenClaw LATEST when present; must not require it).

## Success Criteria

- `~/.zshrc` contains the frontload block between markers.
- `~/.tnf/tnf-status` executes without returning non-zero on missing cache.
- `~/.tnf/handoff-current.json` exists or can be generated on demand.
- OpenClaw `LATEST.md` is checked only when OpenClaw is enlisted
  (`TNF_OPENCLAW_REQUIRED` / `TNF_OPENCLAW_ACTIVE` /
  `FRONTLOAD_REQUIRE_OPENCLAW_LATEST=1` or live OpenClaw process).
