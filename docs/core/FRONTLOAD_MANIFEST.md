# FRONTLOAD_MANIFEST.md — Canonical Agent Harness Injection Order

TNF frontload = **OpenClaw-compatible workspace pack** ∩ **TNF protocol
authority pack**. Mirrors under `~/` or other CLIs are non-authoritative
(`DIRECTIVES.md`).

Use this file as the single ordered checklist for onboarding and for
`scripts/verify-repo-frontload.cjs`.

## Stage A — Eager (every interactive Turn Zero)

| #   | Path                                                 | Role                           |
| --- | ---------------------------------------------------- | ------------------------------ |
| 1   | `docs/protocols/TURN_ZERO_MANDATE.md`                | Operating loop + startup law   |
| 2   | `docs/protocols/LIVING_STATE.md`                     | Active directive / sync status |
| 3   | `docs/protocols/reports/SESSION_HANDOFF_LATEST.json` | Batton / next actions          |
| 4   | `.agent/SYSTEM_PROMPT.md`                            | Runtime system prompt          |

## Stage B — Deferred (after orientation / when task needs it)

| #   | Path                                    | Role                                     |
| --- | --------------------------------------- | ---------------------------------------- |
| 5   | `docs/protocols/AGENT_STATUS_LEDGER.md` | Fleet / known gaps                       |
| 6   | `.agent/context/agent-onboarding.md`    | Local onboarding contract                |
| 7   | `.agent/workflows/frontload.md`         | `/frontload` workflow                    |
| 8   | `.agent/context/resource-map.md`        | Skills / agents index                    |
| 9   | `docs/core/SOUL.md`                     | Persona + absolute guardrails            |
| 10  | `docs/core/IDENTITY.md`                 | Agent identity                           |
| 11  | `docs/core/USER.md`                     | Operator profile                         |
| 12  | `docs/core/TOOLS.md`                    | Environment-specific tool notes          |
| 13  | `docs/core/HEARTBEAT.md`                | Proactive checklist                      |
| 14  | `docs/core/SECURITY.md`                 | Security constraints                     |
| 15  | `docs/core/MEMORY.md`                   | Curated long-term facts                  |
| 16  | `docs/core/ENGINEERING_PRINCIPLES.md`   | Engineering norms                        |
| 17  | `docs/core/BOOTSTRAP.md`                | First-run ritual (pending/complete)      |
| 18  | `docs/protocols/HARNESS_CONFIG.md`      | UNU-aligned harness inventory (8 layers) |
| 19  | `data/harness/harness-config.json`      | Machine-readable harness config          |
| 20  | `data/mcp_config.json`                  | MCP inventory (metadata)                 |

## Stage C — Task / swarm (optional)

| Path                                        | Role                                          |
| ------------------------------------------- | --------------------------------------------- |
| `~/.tnf/swarm-context.md`                   | Swarm terminal coordination                   |
| `docs/operations/STALL_DEFENSE.md`          | Stall defense                                 |
| `docs/protocols/TNF_FRONTEND_IA_CANON.md`   | Frontend IA canon                             |
| `docs/protocols/TNF_AGENT_SHELL_HYGIENE.md` | Shell hygiene                                 |
| `.agent/runtime-state/harness-context.md`   | Adaptive models/hosts (`tnf harness context`) |
| `docs/core/memory/YYYY-MM-DD.md`            | Daily raw notes (optional)                    |
| `docs/protocols/HARNESS_MEMORY_LAYER.md`    | Dynamic retain/recall (≠ MEMORY.md)           |
| `docs/protocols/HARNESS_TRAJECTORY.md`      | Trajectory + compaction records               |
| `docs/protocols/HARNESS_PERMISSION_BERM.md` | Permissions outside the model                 |

## Progressive Disclosure

- **Interactive / light Turn Zero**: Stage A only (+ `tnf onboard` quick
  snapshot). Do not dump Stage B into the first reply unless needed.
- **Swarm / harness onboarding / BOOTSTRAP pending**: Stage A + Stage B.
- **Token budget**: Prefer summaries of `LIVING_STATE` / large ledgers; open
  full files when acting.

## Informal → Canonical Aliases

| Said                    | Means                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `soul.md`               | `docs/core/SOUL.md` (persona pack — OpenClaw-family)                                                                   |
| `agent.md`              | Prefer industry `AGENTS.md`; also `.agent/agents/<id>.md` + `docs/core/IDENTITY.md`                                    |
| `brain.md`              | **Disambiguate:** static `docs/core/MEMORY.md` **or** dynamic `scripts/harness/memory-layer.cjs` — never collapse them |
| OpenClaw workspace pack | SOUL / IDENTITY / USER / TOOLS / HEARTBEAT / MEMORY / AGENTS / BOOTSTRAP                                               |
| UNU harness             | `docs/protocols/HARNESS_CONFIG.md` + `data/harness/harness-config.json`                                                |

**Injection ≠ file presence.** Repo docs must also appear on host surfaces
(`.cursor/rules/tnf-harness.mdc`, root `CLAUDE.md`, OpenClaw workspace
pointers).

## Verify

```bash
tnf onboard
node scripts/verify-repo-frontload.cjs
node scripts/harness/verify-harness-completeness.cjs --provision
node scripts/install-agent-frontload.cjs --verify
```
