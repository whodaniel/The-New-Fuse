# TNF CLI Lazy Command Registration Handoff Receipt

TNF_PROTOCOL_ACK

## Outcome

**Lazy registration shipped.** Measured the per-module eager-import costs
(`node --input-type=module` isolation harness): `orchestration.js` ~2.1s (worst
— its static import defeated the already-lazy `RedisAgentClient`),
`MCPToolRuntimeService` ~770ms (MCP SDK + zod), `StoryService` ~230ms
(supabase), `commands/telegram` ~240ms (telegraf), `commands/whatsapp` ~180ms,
`PluginsService` ~125ms. All converted to cached dynamic loaders following the
existing `loadRedisAgentClient` pattern; 13 call sites rewritten to
`new (await loader())(...)`; no command surface changes.

**esbuild splitting enabled** in `bundle-cli.cjs` (`splitting: true`,
`chunks/[name]-[hash]`): dynamic imports now compile to lazily-loaded chunk
files instead of being inlined. Entry shrank 6123KB → 857KB.

**Results:** `tnf --version` 4.1s → **1.07–1.17s** (CPU 0.35s); `tnf doctor`
6.7s PASS; models/telegram/plugins lazy paths verified live; type-check clean;
suite 510/0; command-surface gate green (512 paths).

**Session hazard handled:** autonomous fleet commits broke the build twice
mid-session — `bf04b72a2` zeroed `cli.ts` (restored under its own receipt), and
the fleet's `LocalSubdirectorAuthorityService` rewrite dropped APIs
(`getConfig`/`isFirstRun`/`updateConfig`/`signLocalSubdirectorIdentity`/`configLocation`)
still used by `cli.ts`, `commands/subdirector.ts`, the service test, and
`agents-run.ts`. Restored service + `agents-run.ts` from `5e2caf328` (last
consistent set); fleet's uncommitted WIP preserved at
`/tmp/fleet-agents-run-wip-20260901.patch`. The fleet's delegated-grant methods
were self-referential only and remain unreferenced.

## Next Actions

- Investigate fleet writers before they re-truncate;
  `com.tnf.subdirector-autopilot` is currently not-loaded — treat as suspect,
  don't silently reload.
- If the delegated-grant authority model is wanted, re-land it coherently
  (service + cli.ts + agents-run + subdirector + tests in one change), starting
  from `/tmp/fleet-agents-run-wip-20260901.patch`.
- Do not push without a separate explicit publication instruction.
