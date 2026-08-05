# tnf-cli Restructure — Scope

Target: `tnf --help` under 500 ms. Current: **2.96 s** (min of 6), down from
47.09 s. Status: scoped, not started.

## Where the remaining 3 s goes

Profiled with `--cpu-prof` after the 2026-08-05 passthrough fix. No single
culprit remains — it is the cost of resolving and parsing the module graph:

| Frame                                 | Self time |
| ------------------------------------- | --------- |
| `loader` (module resolution)          | 1.82 s    |
| `lexer` / `parseCJS`                  | 1.04 s    |
| native (`readFileUtf8`, `toRealPath`) | 1.28 s    |
| `console-logger.service.js`           | 0.38 s    |
| `package_json_reader`                 | 0.38 s    |

Nothing here is a bug. It is what 19,214 lines of eagerly-evaluated command
definitions plus 65 top-level imports cost to load. **Shaving imports cannot
reach 500 ms** — even a perfect lazy-import pass still parses `cli.ts` itself.

## The surface being restructured

| Metric                                   | Count                         |
| ---------------------------------------- | ----------------------------- |
| `cli.ts` lines                           | 19,214                        |
| `.command(` calls                        | 363 (328 at top-level indent) |
| `.action(` handlers                      | 296                           |
| Top-level commands in `--help`           | 141                           |
| Already-extracted command modules        | 18                            |
| Module-scope service constructions       | 6                             |
| Top-level imports                        | 65                            |
| **Tests exercising the command surface** | **0**                         |

That last row is the dominant risk. 13 test files exist, but none invoke a
command. A restructure touching 296 handlers with no behavioural coverage is the
definition of flying blind, and this codebase has already demonstrated how a
plausible-looking change can silently do nothing.

## Target architecture

`cli.ts` becomes a thin dispatcher (~200 lines):

1. Parse `argv` far enough to identify the top-level command.
2. Look it up in a **generated manifest** of
   `{ command → module path, summary }`.
3. `await import()` only that module; register only its subtree.
4. `--help` renders from the manifest — no command module loaded at all.

Everything else moves into `src/commands/<group>/index.ts`, extending the
pattern already used by the 18 extracted modules.

**The manifest is the risk.** A hand-maintained list of 141 commands will drift
from reality, and drift that reports success is the exact failure class the
2026-08-05 audit catalogued. It must be _generated_ from the modules and
_verified_ by a test that fails when they disagree — never hand-edited.

## Stages

Each stage is independently shippable and independently verifiable.

**Stage 0 — Safety net (do this first; nothing else is safe without it).** A
contract test that snapshots the full command surface: every command, alias,
option and description, from a real CLI invocation. This is the oracle every
later stage is checked against. Also fix `preflight-skip.test.ts`, whose 30 s
`spawnSync` budget against a formerly-47 s command meant its "suppressed"
assertions passed on a killed process — false passes. _Buys: no latency. Buys
the ability to proceed._

**Stage 1 — Manifest + generator.** Generate `command-manifest.json` from module
exports; add a test asserting the manifest matches the live CLI exactly. Wire
`--help` to render from it. _Buys: `--help` stops loading command modules.
Expect ~1.5–2 s._

**Stage 2 — Extract command groups.** Move the 328 top-level definitions into
`src/commands/<group>/`, largest first, one group per PR, Stage 0 snapshot green
after each. The 18 existing modules show the shape. _Buys: the bulk of the parse
cost. Expect ~0.6–1 s._

**Stage 3 — Defer module-scope state.** The 6 module-scope service constructions
(`AuthService`, `AgentManagerService`, `DebugService`, `SessionManagerService`,
`DatabaseService`, plus `program`) each do file I/O at load. Convert to lazy
getters. _Buys: the last few hundred ms. Target <500 ms._

## Effort and risk

- **Stage 0:** ~1 day. Low risk, high leverage.
- **Stage 1:** ~1–2 days. Medium risk, concentrated in manifest/reality drift.
- **Stage 2:** the bulk — days to weeks depending on batch size. Low risk _per
  batch_ with Stage 0 in place; unbounded risk without it.
- **Stage 3:** ~1 day. Medium risk — module-scope singletons often hide
  initialization-order assumptions.

**Do not attempt Stage 2 before Stage 0.** Moving 296 handlers with no oracle is
how a CLI silently loses commands, and `--help` would keep printing them from a
manifest that no longer matches.

## Verification

Every stage: Stage 0 snapshot green, `tsc --noEmit` at 0 errors, and a min-of-6
timing (this host's median runs 3× its minimum under cron load — a single sample
is not a measurement).

## Prior art in-repo

- `src/commands/{slack,whatsapp,channels,telegram,…}/index.ts` — 18 modules
  already following the `register*Commands(program, repoRoot)` shape.
- `scripts/protocols/verify-declarations.cjs` — the pattern for a generated
  artifact verified against reality rather than trusted.
