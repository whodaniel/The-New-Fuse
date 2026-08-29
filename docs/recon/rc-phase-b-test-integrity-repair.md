# RC Phase B — Test Integrity Repair (T0–T6 Evidence Artifact)

Branch: `fix/rc-phase-b-test-integrity-20260828` Base (frozen failed RC,
immutable): `f264e5e7d55059d248f72e66c9bdea317931fd69` Worktree:
`/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/TNF/worktrees/rc-phase-b-test-integrity`
Commits: T1 `bd465336a624b1ca56f596262e38d46ee1869080`, T2 `bc15e29c6` (+T3/T4
commit), no force-push, no amend of base.

Status legend: **VERIFIED** = reproduced/observed directly in this session with
commands and logs; **REPORTED** = observed but not root-caused here;
**INFERRED** = conclusion from mechanism, not direct observation; **UNKNOWN** =
not established.

---

## T0 — Isolation. VERIFIED

- Worktree created from the exact failed RC SHA `f264e5e7d`; branch
  `fix/rc-phase-b-test-integrity-20260828`.
- The failed-RC worktree (`tnf-rc-gate`) and its uncommitted `--forceExit`
  bandaid were never touched; nothing was amended.
- Parked branch hints used as leads only; all fixes re-derived from reproduction
  on the isolated base.

## T1 — Agent module resolution. VERIFIED

Failure classes on base (reproduced):

1. `Cannot find module '../cline_bridge.js'` — ts-jest could not resolve
   NodeNext-style relative `.js` specifiers. Fix:
   `packages/agent/jest.config.js` relative mapper
   `'^(\\.{1,2}/.*)\\.js$': '$1'` (same class as mcp-core's config). Production
   emission untouched: `dist/bridges/index.js` still imports
   `./cline_bridge.js`; runtime load verified
   (`typeof ClineBridge === 'function'`).
2. Directory-mapped `@the-new-fuse/infrastructure` resolved to tracked ESM build
   artifacts (`src/index.js`) because ts-jest's default `moduleFileExtensions`
   is js-first. Fix: ts-first
   `moduleFileExtensions: ['ts','tsx','js','jsx','json','node']`.
3. Stale fixture `redis-agent-registry.test.ts` (mocked npm `redis` package API;
   source uses infrastructure factories + Upstash pipeline). Rewritten to the
   real current contract with strengthened real assertions (9 tests). No skips,
   no weakened assertions.

Verification: full agent suite 13/13 natural exit 0 (now 15/15 including the T3
guard), type-check 0, build 0.

## T2 — mcp-core test integrity. VERIFIED

### Named leak owners (all VERIFIED via `--detectOpenHandles --runInBand` and per-suite bisect)

| Owner                                 | Handle                                                                                                                                                    | Fix (production)                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `MCPServer.ts` request timeout        | uncleared `setTimeout` (8 handles)                                                                                                                        | capture handle, clear in `finally`                                                        |
| `CircuitBreaker.ts` monitoring        | un-stoppable 30s interval (15 handles) + `process.once('exit')` bandaid leaking exit listeners                                                            | idempotent `stop()`, manager `stopAll()`, `remove()` stops before delete, bandaid removed |
| `ConnectionPoolMonitor.ts`            | constructor 60s interval (6)                                                                                                                              | stored handle + idempotent `stop()`                                                       |
| `CacheMonitor.ts`                     | constructor 60s interval (6)                                                                                                                              | stored handle + idempotent `stop()`                                                       |
| `RBACManager.ts`                      | constructor 60s interval (3)                                                                                                                              | stored handle + idempotent `stop()`                                                       |
| `MonitoringSystem.ts`                 | lazy monitors never stopped on shutdown                                                                                                                   | `stopComponents()` stops both monitors; `shutdown()` runs even when not running           |
| `ConnectionManager.ts` (fixture-side) | per-instance 30s/100ms health-check interval + 2 signal handlers; production `shutdown()` already existed but fixture called only `closeAllConnections()` | fixture afterEach → `shutdown()`                                                          |
| `MCPBroker.test.ts` `errorBroker`     | started broker never stopped (registry cleanup interval)                                                                                                  | fixture stops it                                                                          |

### Determinism repairs (no assertion weakening)

- RBAC cache test: cache identity (`result2).toBe(result1)` + `cacheSize`)
  replaces wall-clock `duration2 <= duration1` flake (VERIFIED flake: "Expected
  <= 0, Received 1").
- ToolExecutionEngine timeout tests: `resourceLimits.memory` pinned to 1 GiB —
  ResourceMonitor samples whole-process heap and the default 64 MiB limit raced
  the timeout path ("Memory limit exceeded: 104562312 > 67108864").
- SecurityIntegration time-range test: `endDate` captured after `flush()`.

### Script integrity (VERIFIED, the hidden exit-code defect)

`package.json` `test`/`test:unit` passed
`--testPathIgnorePatterns=integration|performance` **unquoted**; `sh` splits at
the pipe → jest ran with `integration` only while
`performance: command not found` made the pipeline exit **127 on every run
regardless of jest results**. This masqueraded as "suite fails with all tests
passing". Fix: ignore semantics moved to `jest.config.ts`
`testPathIgnorePatterns` (`/node_modules/`, `/dist/`, `integration`,
`performance`); scripts are now `jest --passWithNoTests`. Sweep: no other
package has the broken pattern (`sync-core` uses a single token — safe).

### Final verification battery (3 consecutive runs, post-fix)

- `pnpm test`: **exit 0, 30/30 suites, 719/719 tests, zero force-exited workers,
  zero MaxListeners warnings** — 3/3 runs. (This battery predates the T3 guard
  tests; the canonical total became 722 after they were added.)
- `pnpm type-check`: exit 0.
- Agent suite: 13/13 at this point (15/15 after the T3 resolver guard), natural
  exit 0.
- No `--forceExit` anywhere; the RC `tnf-rc-gate` bandaid remains untouched.

### Residual observations (REPORTED)

- Running only `ToolExecutionEngine.test.ts` + `ToolHandler.test.ts` in parallel
  workers produced a force-exit warning **with exit 0** and all tests passing;
  sequential single-worker runs (both orders) are clean. Load-dependent worker
  exit contention, not a leaked handle; did not reproduce in the final full
  battery. UNKNOWN whether it can reappear under heavier parallelism; jest
  treats it as a warning with exit 0.
- A stale `jest --detectOpenHandles --runInBand` process from a prior session
  (2:41 AM, main repo) was found alive and killed; early flakes in this session
  were possibly contaminated by it (INFERRED).

## T3 — Regression guards. VERIFIED

- `packages/agent/src/resolver-guard.test.ts`: import-time guard exercising both
  resolver classes (relative `.js` specifier + directory-mapped infrastructure);
  fails exactly like Phase B if either regresses.
- `packages/mcp-core/src/lifecycle/teardown-ownership.test.ts`: pins
  CircuitBreaker/RBACManager `stop()` interval cleanup + idempotency
  (clearInterval spy) and ConnectionManager `shutdown()` signal-handler removal
  (listenerCount deltas).
- Both suites pass; agent full suite 15/15 (13 pre-guard + 2 resolver-guard
  tests); mcp-core type-check 0.
- Note on counts: the 3 teardown-ownership tests raise the canonical mcp-core
  total from 719 (T2 battery) to 722. See "Final verification closure" below.

## T4 — Config drift report (no bulk edits; recorded, not fixed)

| #   | Item                                                                                                                                                                                                                                                                                                            | State                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | `packages/infrastructure/src` contains 19 tracked generated artifacts (`.js` + `.d.ts` + `.map`) emitted in place — ESM files unparseable by the CJS jest runtime; caused T1 failure class 2                                                                                                                    | VERIFIED (`git ls-files`) — hygiene defect; production emission not changed in this repair |
| 2   | `packages/mcp-core/tsconfig.test.json` `include` covers only test files → `tsc -p tsconfig.test.json` fails TS6307 on imported src files (pre-existing at base)                                                                                                                                                 | VERIFIED — canonical `tsc --noEmit` type-check passes; not exercised by any script         |
| 3   | ts-jest deprecation: `isolatedModules` config option warns "will be removed in v30; use tsconfig isolatedModules" on every run (mcp-core)                                                                                                                                                                       | VERIFIED (warnings in all logs)                                                            |
| 4   | Jest config drift between packages: mcp-core uses `jest.config.ts` (ts-first extensions, relative `.js` mapper, `transformIgnorePatterns` for `@modelcontextprotocol`/`@tnf`, config-owned ignore patterns); agent used a bare `jest.config.js` (now aligned via T1); other packages not audited in this repair | VERIFIED for mcp-core/agent; UNKNOWN for remaining packages                                |
| 5   | Unquoted pipe in jest CLI flags breaks `sh` (mcp-core, fixed in T2); sweep shows no other affected package                                                                                                                                                                                                      | VERIFIED                                                                                   |
| 6   | `ConnectionManager` registers `SIGTERM`/`SIGINT` handlers per instance (11+ instances → MaxListenersExceededWarning observed at base); `shutdown()` removes them, fixtures now call it; per-instance process-handler registration remains a design debt for long-running hosts                                  | VERIFIED (warnings at base); guarded by T3 test                                            |
| 7   | Prior-session zombie jest probe (2:41 AM, main repo, `--detectOpenHandles --runInBand`) was alive during early runs — sessions must reap diagnostic jest processes or contaminate later runs                                                                                                                    | VERIFIED (`ps aux`), killed                                                                |

## Final verification closure (post T3/T4, HEAD `219557365`)

Two machine-recorded full runs of `pnpm test` exist at this HEAD:

1. **Post-commit run, 2026-08-28 20:41 local** (preserved output
   `/tmp/mcp-post.log`, ephemeral): 31/31 suites passed, **722 passed, 722
   total**, zero force-exit lines, zero MaxListeners lines, log reaches
   `Ran all test suites.` (quiet host). The prior session report's "722/722"
   refers to this run — 722 total, all passing.
2. **Closure run, 2026-08-29 02:35 UTC** (self-contained receipt, captured live,
   no `--forceExit`):

```
receipt_version: 1
command: pnpm test (packages/mcp-core)
head_sha: 219557365b803a622d835cfed486ae078e9ec32c
started_utc: 2026-08-29T02:35:26.000Z
finished_utc: 2026-08-29T02:36:04.000Z
elapsed_seconds: 38
exit_code: 0
force_exit_warnings: 0
maxlisteners_warnings: 0
shell_command_not_found_lines: 0
natural_exit: yes
--- jest summary ---
Test Suites: 31 passed, 31 total
Tests:       6 skipped, 716 passed, 722 total
Snapshots:   0 total
Time:        33.064 s
```

### 719 vs 722 reconciliation (REPORTED, fully explained)

- 719 (T2 battery) + 3 T3 teardown-ownership guard tests = **722 canonical
  total**. Both numbers are correct for their respective points in history;
  neither is a contradiction.
- The closure run shows **6 skipped, 716 passed** while the 20:41 run shows
  **722 passed, 0 skipped**, at the same HEAD. Cause:
  `src/error/ErrorMonitor.test.ts` gates its `describeTimingSensitive` block on
  host load (`1-min loadavg > 2x cores`) — a deliberate pre-existing guard
  **present at frozen base `f264e5e7d`** ("skip rather than flake"; this box
  runs a multi-agent swarm). At closure time loadavg was 55–65 against 8 → the
  block's own console line confirms:
  `timing-sensitive suites skipped: 1-min load 65 > 8 (2x cores)`. A focused
  diagnostic run of that suite reproduces exactly
  `6 skipped, 14 passed, 20 total`.
- The `src/performance/` suites are excluded from the canonical set by the
  ignore pattern (path contains `performance`); their identical load-gating does
  not affect the 722.
- No assertion was weakened and no test was removed: totals match exactly, and
  the skipped tests are wall-clock-timing tests by design.

### Closure verification summary (VERIFIED)

- Focused T3 guards: agent resolver-guard **2/2, exit 0**; mcp-core
  teardown-ownership **3/3, exit 0, zero force-exit**.
- Affected-package type-checks: `packages/agent` **exit 0**; `packages/mcp-core`
  **exit 0**.
- Full `pnpm test` at HEAD: exit 0, natural exit, 31/31 suites, 722 total (716
  passed + 6 load-gated skips), zero force-exit, zero MaxListeners warnings.
- `apps/frontend/src/data/codebase_map.json` remains intentionally unstaged
  generated noise (not deleted, not reset, not committed).

## T5/T6 — Next RC candidate. PENDING (operator handoff)

- This branch carries T1+T2+T3+T4 only, from the frozen failed RC base.
- T5 assembly inputs (from launch-train base, not this branch's base):
  Subdirector P0 federation fix, lockfile fix; federation P0 remains SEPARATE.
- T6: fresh clean worktree at ONE immutable candidate SHA; full Phase B matrix
  (build, type-check, unit, integration, federation, smoke) re-run there; the
  83/83 turbo build cache must be cold.
- Operator items outstanding: PR #253 merge decision; GitHub Actions billing;
  live `launchd` restart for `TNF_LIVE_CONFORMANCE_PROBE=1`.
