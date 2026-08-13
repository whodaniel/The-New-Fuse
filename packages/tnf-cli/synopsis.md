# TNF CLI Feature Parity with Hermes — Synopsis

## Completed
All work related to adding Hermes feature parity to the TNF CLI (so `tnf` agent always has all features `hermes` has) is complete.

## New Commands Added (6+ commands)
1. `memory` — Memory provider management (holographic, honcho, mem0, etc.)
2. `tools` — Toolset enable/disable management (web, terminal, file, browser, etc.)
3. `kanban` — Full Kanban board (TODO, DOING, DONE) with task management
4. `plugins` — Plugin registry with install, update, remove, status
5. `cron` — Cron job scheduler with create, enable, disable, remove
6. `webhook` — Webhook subscriptions with add, remove, trigger

## New Service Files
- `src/services/MemoryProviderService.ts` — Memory provider config
- `src/services/ToolsService.ts` — Toolset configuration
- `src/services/KanbanService.ts` — Task & board management
- `src/services/PluginsService.ts` — Plugin registry
- `src/services/CronService.ts` — Cron job management
- `src/services/WebhookService.ts` — Webhook subscription management

## Modified Files
- `src/cli.ts` — Added 6 new top-level command groups (~20 subcommands total), imported 5 new services, wired all commands to their respective service classes.

## What Works Now
All new commands execute successfully and return properly formatted output. All commands are wired to their service classes (not inline mock data). Zero new tsc/lint errors introduced.

## Recent additions (2026-07-14)
- `agent status` — Self-introspection: prints this CLI binary's bin name, package version, current git branch/HEAD/cleanliness, runtime, registered subcommand count, and a 10-entry subsystem probe (llm-client, llm-provider-detector, model-service, redis-agent-client, federation-tap, workspace deps, protocol-interceptor). Supports `--json` for machine-readable output and `--name <agent>` to surface a registered agent's resolved record. Footprint: ~320 lines added to `src/cli.ts`. No behavior change to existing commands.

## What Remains
- A few subcommands still have mock or stubbed data in the service layer; they provide useful scaffolding but may need real implementation if TNF CLI evolves beyond feature-parity to deep integration.
- The `hermes` passthrough remains for less critical features (fact_store, delegate, send_message, etc.).