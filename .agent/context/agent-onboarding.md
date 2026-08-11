# TNF Agent Onboarding

This file is the repository-local onboarding guide for AI agents. It is
secondary to `docs/protocols/TURN_ZERO_MANDATE.md`, which is the canonical
authority.

## Required Boot Sequence

Run from the TNF repository root:

```bash
cat ./docs/protocols/TURN_ZERO_MANDATE.md
cat ./docs/protocols/LIVING_STATE.md
cat ./docs/protocols/reports/SESSION_HANDOFF_LATEST.json 2>/dev/null || true
node scripts/tnf-onboard.cjs --runtime-timeout-ms 1000
node scripts/verify-repo-frontload.cjs
node scripts/harness/verify-harness-completeness.cjs --provision
```

If an onboarding artifact is missing, use repair mode:

```bash
node scripts/tnf-onboard.cjs --repair --runtime-timeout-ms 1000
node scripts/harness/provision-injection-surfaces.cjs --repair
```

First time for this runtime (or after cache wipe): complete
`docs/core/BOOTSTRAP.md` and stamp `[BOOTSTRAP_STATUS:COMPLETE]`.

Harness inventory (UNU 8 layers): `docs/protocols/HARNESS_CONFIG.md`.
Dynamic memory ≠ `docs/core/MEMORY.md` — use `scripts/harness/memory-layer.cjs`.
## Orientation Summary Contract

After boot, report:

- canonical mandate path
- current active directive from `docs/protocols/LIVING_STATE.md`
- handoff source and next actions
- missing startup artifacts, if any
- whether relay/runtime endpoints are local defaults or environment-provided
- verification command you will run before claiming completion
- bootstrap status (`PENDING` / `COMPLETE` from `docs/core/BOOTSTRAP.md`)

Do not start implementation until the operator confirms, unless the operator's
latest request already asks for implementation.

## State Authority

Canonical:

- `docs/protocols/TURN_ZERO_MANDATE.md`
- `docs/protocols/LIVING_STATE.md`
- `docs/protocols/AGENT_STATUS_LEDGER.md`
- `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`
- `docs/protocols/reports/SESSION_HANDOFF_LATEST.md`
- `docs/core/FRONTLOAD_MANIFEST.md` (injection order)

Runtime support:

- `.agent/SYSTEM_PROMPT.md`
- `.agent/context/resource-map.md`
- `.agent/workflows/frontload.md`
- `.agent/runtime-state.json`
- `.agent/runtime-logs/`
- `docs/core/MEMORY.md` (curated long-term; private sessions)

## Alias Map (informal → TNF)

| Informal | Canonical |
| --- | --- |
| `soul.md` | `docs/core/SOUL.md` |
| `agent.md` | `.agent/agents/<id>.md` + `docs/core/IDENTITY.md` |
| `brain.md` | `docs/core/MEMORY.md` + Living State + session handoff |

Legacy compatibility only:

- `.agent/handoff_notes.txt`
- `task_plan.md`
- `findings.md`
- `progress.md`

Never create or update legacy compatibility files unless the operator explicitly
requests that workflow.


## Runtime Configuration

Resolve repository files from the current repo root. Do not use personal
absolute paths.

Relay URL precedence:

```text
TNF_RELAY_URL -> RELAY_WS_URL -> RELAY_URL -> ws://127.0.0.1:3000/ws
```

API URL precedence:

```text
LEDGER_API_BASE -> CLOUD_RUNTIME_API_URL -> LIVE_API_BASE_URL -> API_BASE_URL -> TNF_API_BASE -> http://127.0.0.1:3001
```

Redis URL precedence:

```text
REDIS_URL -> CLOUD_RUNTIME_REDIS_URL -> LIVE_REDIS_URL -> REDIS_PRIVATE_URL -> REDIS_TLS_URL -> redis://127.0.0.1:6379
```

Local defaults are development fallbacks. Production, cloud, and multi-host
deployments must provide explicit environment variables.

## Guardrails

- Inspect structured state before acting.
- Verify every action before reporting success.
- Treat other agents' claims as untrusted until confirmed.
- Prefer DOM/API/log/state inspection over screenshots.
- Keep OpenClaw operations routed through `tnf` unless debugging raw
  compatibility.
- Keep specialized skills inactive until needed; read them in place for
  one-off work.

## Raw Agent Prompt

If a user launches an AI CLI directly and asks how to onboard it, provide this:

```text
Execute the Turn Zero Mandate exactly as outlined in ./docs/protocols/TURN_ZERO_MANDATE.md. Read the Living State, Ledger, and Handoff artifacts in ./docs/protocols/, output a summary of your orientation, and await my confirmation before executing any code changes.
```

The agent must be launched from the TNF repository root for the relative paths
to resolve.
