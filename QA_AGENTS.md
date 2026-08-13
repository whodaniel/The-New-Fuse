# TNF QA Agents — Specialty Testing Suite

Specialty QA/testing agents for The New Fuse (TNF). Each agent is a
`.claude/agents/*-qa-agent.md` definition. They follow `AGENTS.md` and
`docs/protocols/TURN_ZERO_MANDATE.md` (**Inspect → Act → Verify**) and emit
structured verdicts to `qa-agents/reports/<agent>.json`.

The `qa-orchestrator-agent` fans out across all four domains and aggregates a
unified health report (`qa-agents/reports/SUMMARY.json` +
`qa-agents/QA_REPORT.md`).

**Legend:** ✅ = real test signal · ⚠️ = static/runtime probe only · ❌ =
no-op/disabled

## Run Matrix

### Swarm / Orchestration

| Agent                          | Under test                                        | Primary command                                                                              | Signal |
| ------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------ |
| `swarm-orchestration-qa-agent` | director loop, master clock, swarm-context bridge | `pnpm swarm:llm-test`, `pnpm swarm:provider:test`                                            | ✅     |
| `agent-registry-qa-agent`      | agent registry, capability catalog, drift         | `pnpm --filter @the-new-fuse/agent-coordination test:unit` (20 real Jest tests) + Grep drift | ✅     |
| `nexus-orchestrator-qa-agent`  | Nexus UI + Go agent bus                           | `pnpm --filter @the-new-fuse/nexus-orchestrator lint`, Go HTTP smoke                         | ⚠️     |
| `workflow-engine-qa-agent`     | workflow engine DAG + workflow UI                 | `pnpm workflow:test`, `pnpm test:e2e e2e/workflows/workflow-creation.spec.ts`                | ✅     |

### Relay / Comms

| Agent                       | Under test                                | Primary command                                                      | Signal |
| --------------------------- | ----------------------------------------- | -------------------------------------------------------------------- | ------ |
| `relay-server-qa-agent`     | relay-server + relay-core messaging       | `pnpm --filter tnf-relay-complete start` + pub/sub probe             | ⚠️     |
| `mcp-bridge-qa-agent`       | MCP servers + cloud-redis/tar bridges     | `pnpm mcp:test-wrapper`, `@the-new-fuse/mcp-cloud-redis-bridge test` | ✅     |
| `interop-protocol-qa-agent` | interop handshake, Agent Card translation | Static cross-harness Grep (no harness yet)                           | ⚠️     |
| `websocket-comms-qa-agent`  | websocket infra, heartbeat, backpressure  | `pnpm --filter @the-new-fuse/websocket-infrastructure test`          | ✅     |
| `telegram-relay-qa-agent`   | telegram-mcp + bot service                | `pnpm --filter @the-new-fuse/telegram-bot-service test`              | ✅     |

### Auth / State

| Agent                     | Under test                                      | Primary command                                                                                  | Signal |
| ------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------ |
| `auth-flow-qa-agent`      | auth + api-gateway JWT middleware               | `pnpm --filter @the-new-fuse/api-gateway test`                                                   | ✅     |
| `state-governor-qa-agent` | multi-agent state governor skill                | `python3 .skills/tnf-multi-agent-state-governor/scripts/tnf_multi_agent_state_governor.py audit` | ✅     |
| `shared-state-qa-agent`   | Redis runtime state, cloudflare sync, Turn Zero | `redis-cli ping` + read `~/.tnf/runtime-state.json`                                              | ⚠️     |

### Frontend / Voice

| Agent                            | Under test                           | Primary command                                         | Signal |
| -------------------------------- | ------------------------------------ | ------------------------------------------------------- | ------ |
| `frontend-verification-qa-agent` | frontend pages/journeys (Playwright) | `pnpm test:e2e`, `pnpm test:uiux`, `pnpm test:website`  | ✅     |
| `voice-bridge-qa-agent`          | voice bridge, watchdog recovery      | Runtime probe via `scripts/system/voicebridge-paths.sh` | ⚠️     |
| `e2e-workflow-qa-agent`          | cross-app e2e workflows              | `pnpm test:e2e`, `pnpm test:integration:agent`          | ✅     |

## Swarm QA Scripts (also used by orchestrator)

| Script            | Command                       |
| ----------------- | ----------------------------- |
| LLM flywheel      | `pnpm swarm:llm-test`         |
| Provider test     | `pnpm swarm:provider:test`    |
| Integration agent | `pnpm test:integration:agent` |
| UI/UX agent       | `pnpm test:uiux`              |
| Website agent     | `pnpm test:website`           |
| Continuous loop   | `pnpm test:continuous`        |
| QA swarm loop     | `pnpm qa:swarm:loop`          |

## Runtime Paths (under `$HOME`, not repo)

| Path                              | Purpose                          |
| --------------------------------- | -------------------------------- |
| `~/.tnf/swarm-context.md`         | Swarm terminal state (Turn Zero) |
| `~/.tnf/runtime-state.json`       | Runtime state snapshot           |
| `~/.tnf-master-clock/`            | Master clock pulse artifacts     |
| `~/.tnf-relay/relay.log`          | Relay server log                 |
| `~/.tnf_sharedstate/`             | Shared state mount               |
| `~/agent-relationship-snapshots/` | Agent graph snapshots            |

## Repo Paths (corrected from v1.0)

| Wrong (v1.0)                            | Correct                                                                            |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| `.tnf/bin/tnf-director-loop.cjs`        | `scripts/runtime/tnf-director-loop.cjs`                                            |
| `.tnf/bin/tnf-swarm-context-bridge.cjs` | `scripts/runtime/tnf-swarm-context-bridge.cjs`                                     |
| `.tnf/bin/tnf-state-governor-cron.sh`   | `.skills/tnf-multi-agent-state-governor/scripts/tnf_multi_agent_state_governor.py` |
| `@the-new-fuse/relay-server`            | `tnf-relay-complete`                                                               |
| `packages/websocket`                    | `@the-new-fuse/websocket-infrastructure`                                           |
| `telegram-mcp` filter                   | `@tnf/telegram-mcp`                                                                |
| `packages/core-auth` (implemented)      | README-only stub — use `api-gateway` + e2e auth                                    |

## No-op Commands (do not treat as pass)

- `pnpm --filter @the-new-fuse/auth test`
- `pnpm --filter @the-new-fuse/shared test`
- `pnpm --filter @the-new-fuse/relay-core test`
- `pnpm --filter @the-new-fuse/agent-coordination test` now runs 20 real Jest
  tests (removed from no-op list)

## Usage

- Run one specialist: open its agent in the harness (e.g.
  `/agents swarm-orchestration-qa-agent`).
- Run everything: dispatch `qa-orchestrator-agent`, which fans out to all 16
  specialists and writes `qa-agents/reports/SUMMARY.json`.

## Notes

- Reports directory `qa-agents/reports/` is created on first run.
- Specialist agents never log secrets (see `telegram-relay-qa-agent`,
  `auth-flow-qa-agent`).
- Prefer structured DOM/state assertions over screenshots (DOM-over-Screenshots
  principle).
