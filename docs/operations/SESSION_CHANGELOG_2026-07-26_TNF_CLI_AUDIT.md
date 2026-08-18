# Session Changelog — 2026-07-26 — TNF CLI Audit & Input Bug Fix

**Branch:** `fix/a2a-signature-verification` **Operator:** Daniel Goldberg
**Repo:** The New Fuse
(`<TNF_WORKSPACE_ROOT>`) **TTY:**
`/dev/ttys005` (`tnf-local-terminal`) **Heartbeat:**
`cron-heartbeat-ttys005-1785103683404` **Prior commit:** `2b9cad51cd` (handoff
39d02552 — "commit all 87 uncommitted files", operator-confirmed live).

---

## TL;DR

Three deliverables shipped this session, all on the existing
`fix/a2a-signature-verification` branch:

1. **Shell-injection fix** in `tnf marketplace list|stats` — `execSync(\`psql
   "${url}" -c "${sql}"\`)`swapped for`execFileSync('psql', [url, '-c',
   sql])`, plus a `--kind`allow-list and`--category`regex validator. Removes both shell-quote breakout through`DATABASE_URL`and SQL-injection through`--kind`/`--category`.
2. **Atomic writes** for every state file read on boot — voice session,
   `FULL_AUTO_STATE_PATH`, `LIVING_STATE.md` (3 writes), the handoff JSON+MD
   pair, and the operator-window config. Backed by a new
   `writeFileAtomic(path, body)` helper (tmp-rename).
3. **Input-bug fix** — `attachSlashCommandDropdown` was wired into readline
   without putting `process.stdin` in raw mode. TTY line discipline in cooked
   mode buffers a whole line until Enter, so the dropdown's `keypress` handler
   received a stale `onLine`-era snapshot and ate or reordered keystrokes
   mid-typing. Now `setRawMode(true)` on attach, `setRawMode(false)` on `close`.

Two adjacent WIP files were _unblocked_ (already operator-staged, not authored
this session):

- `TurnZeroService.execute({silent})` and
  `ProceduralDisclosureService.executeCheck({silent})` — first-class `silent`
  parameter threads the pre-flight chatter suppression through the
  ProtocolInterceptor so `--help`, `--version`, `tnf slash list`, `tnf --json`,
  `tnf --print`, `tnf --oneshot`, `TNF_SILENT_PREFLIGHT`, and non-TTY pipes all
  render clean while Turn Zero + Procedural Disclosure still execute (failure
  only routes to stderr).
- `cli.ts wantsSilentPreflight(argv)` consolidates six suppression conditions
  into one helper used by both the splash gate and the ProtocolInterceptor
  constructor.

These leverage each other: the silent-flag plumbing was the operator's correct
answer to "respect sigterm/help shortcut while preserving Turn Zero
enforcement"; the input-bug fix and atomic-write sweep are this session's
contributions on top.

---

## New files (this commit)

| Path                                                            | Purpose                                                                                                                                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/tnf-cli/src/utils/safe-fs.ts`                         | `safeJsonParse`, `safeReadJson`, `writeFileAtomic` (tmp-rename). Zero deps. Synchronous (CLI exits via `main()`).                                                                    |
| `packages/tnf-cli/src/utils/safe-fs.test.ts`                    | 8 unit tests — covers invalid JSON fallback, missing-file fallback, torn-write fallback, atomic write + no-tmp-leftover guarantee, parent-dir auto-create.                           |
| `packages/tnf-cli/src/utils/prompt-input.test.ts`               | 8 unit tests — was already WIP on disk; this session fixed the `FakeStdin` stub (raw EventEmitter → real `Readable`), non-getter `readableEnded` override, and confirmed all 8 pass. |
| `docs/operations/SESSION_CHANGELOG_2026-07-26_TNF_CLI_AUDIT.md` | This file. Audit trail for the change bundle.                                                                                                                                        |

## Modified files (already-staged WIP, included for traceability)

The following WIP had been stage-add'd on this branch by an earlier
operator-author session _and_ co-existed with patches from this session's audit.
They are **NOT** in the index of this clean commit (staged separately by
previous operator work); they ship when the broader WIP commits land.

| Path                                                                  | Status                                                                                                                                                           |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/tnf-cli/src/cli.ts`                                         | `wantsSilentPreflight(argv)` already-staged; my session added nothing new on top — earlier "firstArgIsHelp⇒silent" patch was correctly undone by operator's WIP. |
| `packages/tnf-cli/src/orchestration/TurnZeroService.ts`               | already-staged silent-param wiring                                                                                                                               |
| `packages/tnf-cli/src/orchestration/ProceduralDisclosureService.ts`   | already-staged silent-param wiring                                                                                                                               |
| `packages/tnf-cli/src/orchestration/ProtocolInterceptor.ts`           | already-staged `turnZero.execute({silent})` plumbing                                                                                                             |
| `packages/tnf-cli/src/orchestration/LivingStateService.ts`            | **this session** — 4 writes migrated to `writeFileAtomic`                                                                                                        |
| `packages/tnf-cli/src/orchestration/SessionHandoffService.ts`         | **this session** — 2 writes migrated to `writeFileAtomic`                                                                                                        |
| `packages/tnf-cli/src/utils/operator-window.ts`                       | **this session** — 1 write migrated to `writeFileAtomic`                                                                                                         |
| `packages/tnf-cli/src/utils/prompt-input.ts`                          | already-staged idle-timeout solution; gives `STDOUT_PROMPT_IDLE_MS` semantics (no-hang on open non-TTY stdin)                                                    |
| `packages/tnf-cli/src/cli.ts` voice-session / full-auto-state writers | **this session** — migrated to `writeFileAtomic`, `readFullAutoState` now uses `safeReadJson`                                                                    |

The audit-mode strategy was: only ship changes that are unambiguous correctness
wins on **state files read on boot**. Defer change without per-site CI coverage
— see "Not shipped" below.

---

## Verified

- `pnpm exec tsc --noEmit -p packages/tnf-cli/tsconfig.json` — clean.
- New unit tests: `# tests 16  # pass 16  # fail 0  # duration_ms 620`.
- Real CLI invocations on a real `--version`, `--help`, `slash list`: exit codes
  0, output is the expected single-line / help text / command list with no Turn
  Zero / Procedural Disclosure chatter.
- Marketplace error path (`DATABASE_URL="" tnf marketplace list`) returns `rc=1`
  — confirms error-exit propagation is intact.
- Smoke test: `writeFileAtomic` writes the expected JSON and leaves no `.tmp-*`
  leftovers in the directory.

---

## Not shipped (deliberately)

These were identified by the audit but require a separate PR with per-site test
coverage. They are NOT in this commit; they remain visible in `git grep`-style
audits and follow-up tickets:

- **325 `process.exit(N)` calls in `cli.ts`** — sweeping replace with
  `process.exitCode = N` is mechanically safe but must not be applied to signal
  handlers or post-`await` callbacks without per-site confirmation. Gauntlet
  pass (`rc=1` from error path, `rc=0` from help/version) confirms the safety
  envelope; rewrite stays in a follow-up.
- **`execSync(\`pgrep -af ${pattern}\`)` x4** — all 4 sites pass hard-coded
  internal patterns, no user-derived strings; no current risk class.
- **14 other `JSON.parse(fs.readFileSync(...))` w/o try/catch** — many are
  read-only repo files (`package.json`) or already wrapped in
  `if (fs.existsSync(...))` guards; site-by-site migration to `safeReadJson` is
  mechanical but would bundle 14 unrelated patches into one PR. Defer.

---

## Follow-ups (recommended)

1. Open a sweep PR for the `process.exit` → `exitCode` swap with the gauntlet
   signal-handler test scaffold.
2. Open a wave for the 14-JSON-parse migration, scoped per file.
3. Run the `autonomous-turn-cap.test.ts` failure investigation — pre-existing
   (not introduced here), still failing in main.

---

## Cross-references

- `docs/core/AGENTS.md` — operator-confirmation requirement for high-impact
  actions (cited in every heartbeat).
- `docs/protocols/TURN_ZERO_MANDATE.md` — preserved end-to-end; only cosmetic
  output is silenced in help/version paths.
- `docs/protocols/reports/SESSION_HANDOFF_LATEST.json` — handoff session
  `39d02552-c489-4b73-bdc5-235b6295a5eb` references this bundle.
