# Issue #176 — Boot/Status Stabilization Evidence

> Status: implemented on `fix/issue-176-boot-stabilization` (worktree
> `~/Repos/tnf-worktrees/issue-176-stabilization`, base: current `main`). Every
> change below traces to a CONFIRMED finding; refuted claims are listed under
> "Dispositions" and were NOT reintroduced.

## 1. Turn Zero / status drift (confirmed, repaired)

**Evidence.** The stale ritual string — "Execute the Turn Zero Mandate … await
my confirmation…" — existed in four operator-facing sites of
`scripts/tnf-onboard.cjs` (system-prompt template, resource-map template,
onboarding template, raw-session console output) and in the standalone
`~/.tnf/tnf-status` renderer (mtime 2026-06-03, 11 weeks old), which is the
packet source named in the issue.

**Repair.**

- `scripts/lib/tnf-canonical-onboarding.cjs` defines the canonical raw-agent
  prompt ONCE (`pnpm run tnf:onboard -- --task "<current task>"` →
  manifest-derived Stage A, task-route/host-injection verification, write-ready
  classification).
- All four `tnf-onboard.cjs` sites consume that constant.
- New canonical renderer `scripts/runtime/tnf-status.cjs` derives the handoff
  packet via the existing `scripts/lib/sync-handoff-cache.cjs` authority and the
  same canonical-prompt constant.
- Host `~/.tnf/tnf-status` is now a thin wrapper exec'ing the repo authority
  (backed up as `~/.tnf/tnf-status.pre-176-bak`). It fails loudly instead of
  rendering drift when no repo authority is present.
- `~/.tnf/update-from-latest.sh` no longer defaults to the retired
  `~/Desktop/A1-Inter-LLM-Com/The-New-Fuse` checkout.

**Regression coverage.** `scripts/tests/tnf-onboard-canonical-prompt.test.cjs`
asserts the ritual text can never reappear and that the constant has exactly one
definition + four consumption sites.

## 2. Wrapper detection false positive (confirmed, repaired)

**Evidence.** `is_wrapper_running()` used `pgrep -f "$script_name"`. A bare
`tail -f <wrapper>` reproduced a false "already running".

**Repair.** Detection moved to `scripts/runtime/wrapper-process-lib.sh`:

1. PID-ownership fast path over `<pid> <wrapper-name>` pairs recorded in
   `.agent-network-pids`;
2. process-signature verification — the wrapper must be the FINAL argv token of
   an interpreter/launcher (`node …`, `sudo … node …`,
   `bash launch-agent-wrapper.sh …`), with self/ancestors excluded. `stop_all`
   now kills only signature-verified PIDs (the old blanket `pkill -f <name>` had
   the same false-positive class).

**Regression coverage.**
`scripts/tests/start-agent-network-wrapper-detection.test.cjs` runs the real lib
against live processes: `tail -f` decoy rejected; genuine `node <wrapper>`
detected; PID-file name mismatch ignored.

## 3. PID-file race between concurrent boots (confirmed, repaired)

**Evidence.** Boot did `rm -f .agent-network-pids && touch && >> appends`
unlocked; two simultaneous boots clobber each other's records.

**Repair.** The EXISTING TNF primitive
`scripts/lib/tnf-single-instance-guard.cjs` gained a CLI mode
(`acquire|release|check`) whose lock owner is the invoking shell (not the
transient helper). `start-agent-network.sh` takes `tnf-agent-network-boot`
before touching PID state and releases on EXIT/INT/TERM. A second concurrent
boot prints "already in progress (lock held by pid N)" and exits 0 without
starting or modifying anything. No second lock framework was introduced;
`--stop`/`--status` intentionally never take the boot lock.

**Regression coverage.** `scripts/tests/tnf-single-instance-guard-cli.test.cjs`:
atomic mutual exclusion (6 simultaneous acquirers → exactly 1 winner),
owner-scoped release (pid-mismatch refuses), dead-owner stale takeover. Live
two-shell evidence: see §7.

## 4. Hard-coded endpoints (confirmed, repaired)

**Evidence.** Literal `https://api.thenewfuse.com` fallback probe in
`scripts/orchestrator/factory-boot.sh`; literals for `thenewfuse.com` /
`app.thenewfuse.com` / marketplace API in
`scripts/orchestrator/swarm-stress-test.sh`; prose literal in
`seed-website-swarm-tasks.sh`; full-auto/self-improvement defaults in
`packages/tnf-cli/src/cli.ts`. (`pipeline.ts` itself contains none — the issue's
file attribution was imprecise but the defect was real elsewhere.)

**Repair.** Authority extended first, consumed second:

- `resolve-harness-context.cjs` hosts gain `appBase` (+ env `TNF_APP_BASE_URL`;
  `TNF_PUBLIC_BASE` already existed); all keys land in
  `harness-context.{env,json,md}`.
- Shared reader `scripts/runtime/harness-context-env.sh`
  (`harness_ctx_get KEY [fallback]`) consumed by factory-boot (ledger fallback
  chain + live-API failover), swarm-stress-test, seed script.
- `cli.ts` self-improvement resolvers read
  `.agent/runtime-state/harness-context.latest.json` between explicit env and
  literal default. Literals remain ONLY as mirrors of the authority's own
  defaults — one config silo, not two.

## 5. Boot concurrency (confirmed, parallelized within proof)

**Evidence (this machine, worktree build):**

| Scenario              | serial (before) | concurrent (after) |
| --------------------- | --------------- | ------------------ |
| probe group wall time | ~8.8 s          | ~6.0 s             |

Ports probe dominates; group members verified independent: distinct processes;
writes disjoint (`resolve-harness-context.cjs` touches only its own three
runtime-state files; ports/env/mcp checks are read-only); every member must
merely complete before service-starting steps (`factory-boot`, `agent-swarm`) —
which still run strictly after the group. Safety-critical phase order is
otherwise unchanged.

**Implementation.** Contiguous `parallelGroup: 'preflight-probes'` members
(`harness-context`, `port-preflight`, `env-validation`, `mcp-health`) execute
via `Promise.allSettled` in the cli.ts boot loop with per-step warning/fatal
semantics identical to serial runs (strict-gates still escalates any member). No
other step declares a group; tests enforce membership, contiguity, warning-only
constraint, and ordering against service starters.

## 6. Dispositions (refuted claims NOT reintroduced)

- **Redis/supercycle:** VERIFIED FALSE — `supercycle-flywheel.cjs` has zero
  Redis references; supercycle stays before stack steps. The REAL ordering bug
  was `llm-provider-tester` launching before any Redis exists: its
  `RedisAgentClient.initialize()` failure path runs exactly one cycle and exits,
  silently degrading the continuous watchdog-feeding tester to one-shot mode.
  Tester now launches after `agent-swarm` (bus up). Regression-tested in
  `pipeline.test.ts`.
- **74 stashes claim:** FAILED verification — no `archive/stashes-2026-08-22`
  provenance was ever produced. Not repeated as fact anywhere; no stashes were
  deleted.

## 7. Live boot acceptance (from clean shell)

Recorded during acceptance run (see PR comment / issue update for captured
timings + PID evidence):

- cold boot: `tnf doctor` then `tnf boot` — probe group concurrent, no stale
  Turn Zero prompt, endpoint values sourced from harness context;
- immediate second boot: boot-lock idempotent exit, no duplicate wrappers;
- shutdown/reboot cycle: signature-verified kills only, no leaked processes,
  coherent PID file after reboot.

## 8. Out of scope (untouched)

`packages/workflow-builder`, #151/#153 user-context work, #172/#175 assimilation
implementation, unrelated host-resource WIP on the primary checkout (left dirty
there deliberately).
