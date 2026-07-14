# picoclaw — DEPRECATED 2026-06-23

`apps/picoclaw-overseer/` and the `.md` agent definitions for the PicoClaw
trinity (Tester, Subject, Perplexity) were deprecated during the
OpenClaw → Hermes migration that landed the 7 OpenClaw launchd cron agents
onto the TNF native runtime.

## What's in this archive

- `bin-picoclaw-binary` — the 26 MB Go binary that was orphaned (no consumer
  in current TNF runtime; only ever referenced via an inactive launchd plist).
- `picoclaw-*.md` (5 files) — agent role descriptions from `.agent/agents/`
  and `.agent/fleet/users/agents/`. Backup copy already lives under
  `archive/agent_consolidation_backup_20260514/agent_agents/`.
- `picoclaw_*.gif` (2 files) — UI assets used by the now-removed overseer app.

## What replaced it

The capability represented by PicoClaw is now owned natively:

- Tester (QA / scenario simulation)  → `thenewfuse-frontend-tester.md`
                                        (Hermes cron, 5 min)
- Subject (domain expert review)     → `continuous-improver.md`
                                        (already native, periodic scan)
- Perplexity (real-time research)    → `scout-llm-discovery.md` /
                                        `tester-llm-endpoints.md` /
                                        `worker-llm-validation.md` trio
- Fleet instance liveness            → `tnf-fleet-health-probe.md`
                                        (Hermes cron, 15 min, config-driven)

## If you find a reason to revive this

Daniel's directive (2026-06-17): "Picoclaw rebuild direction LOCKED: TNF-native
cron + agents, NOT Cloud Run redeployment." If a future need revives picoclaw,
build it natively in `packages/` or `apps/` — do NOT restore from this archive
without explicit user sign-off.
