# MEMORY.md — Curated Long-Term Facts (TNF)

_Private-session memory. Distilled essence only — not a transcript, not a
replacement for `LIVING_STATE.md` or `SESSION_HANDOFF_LATEST`._

## How To Use

- **Load** in main/private operator sessions during Turn Zero (defer if
  interactive light mode and no memory-relevant task).
- **Do not** load into shared/group channel contexts (personal operator facts).
- **Write** only durable non-profile facts: standing decisions, harness lessons,
  environment truths that outlive a single handoff cycle.
- **Daily raw notes** (optional): `docs/core/memory/YYYY-MM-DD.md` — promote
  stable items here periodically (heartbeat / end-of-session).

## Alias Map

| Informal name              | TNF canonical                                                                 |
| -------------------------- | ----------------------------------------------------------------------------- |
| `brain.md` (static slice)  | This file                                                                     |
| `brain.md` (dynamic slice) | `scripts/harness/memory-layer.cjs` + `docs/protocols/HARNESS_MEMORY_LAYER.md` |
| Ops continuity             | `LIVING_STATE.md` + session handoff (batons — not auto-recall)                |
| `agent.md`                 | Prefer `AGENTS.md`; also `.agent/agents/<id>.md` + `docs/core/IDENTITY.md`    |
| OpenClaw `MEMORY.md`       | This file (static curated)                                                    |

This file is **not** a retain/recall memory layer. Use the harness memory CLI
for session-learned facts; promote durable consensus here during Turn End /
heartbeat.

Operational sync stays in protocols (`LIVING_STATE`, ledger, handoff). Persona
stays in `SOUL.md` / `IDENTITY.md` / `USER.md`.

## Standing Decisions

- TNF is the primary control plane; OpenClaw/Claude/Cursor/Hermes are optional
  harness surfaces TNF may assimilate — never the reverse characterization.
- Local stack defaults: gateway `:3001`, api-local `:3002`, relay `:3007`, Redis
  `:6379` (use `scripts/runtime/redis-service.sh` when launchd stalls).
- Full-auto: prefer env-only super-admin auth (never `--super-admin-token` on
  daemon argv). Post-step broadcast/status are soft-failed with a time cap so a
  hung orchestrate cannot mark a good primary cycle failed.
- Commits/pushes for `TNF_AGENT_ID=tnf-cli-agent` remain gate-bound; live
  operator confirmation still required when handoff marks NEEDS LIVE OPERATOR
  CONFIRMATION for commit packs.

## Harness Lessons

- Incomplete nested `apps/api/node_modules` (missing `dist/`) crash-loops
  api-local; repair with root `pnpm install`, then LaunchAgent restart.
  `tnf-launchd-smart-start.sh` defers when nested css-color/workspace links are
  broken.
- Substrate install-seal drifts after lockfile changes — reseal with
  `node scripts/protocols/validate-substrate-attestation.cjs --write-seal`.
- Frontload pack for new agents: see `docs/core/FRONTLOAD_MANIFEST.md`.
- Harness completeness (UNU 8 layers + injection proof):
  `docs/protocols/HARNESS_CONFIG.md` +
  `node scripts/harness/verify-harness-completeness.cjs`.

## Promote Next

When promoting from daily notes or session handoffs, append short dated bullets
under **Standing Decisions** or **Harness Lessons**, then prune obsolete ones.
