# Self-Improvement Component Triage — Wire or Retire (2026-09-06)

`[DOC_TYPE:REPORT] [DATE:2026-09-06] [SCOPE:scripts/.agent-skills]`

**Task.** Four self-improvement components had zero call sites. For each: wire
it to a real call site, or retire it — no third state. Independent verification
first (`grep -rl` over
`scripts packages/*/src package.json .github ~/Library/LaunchAgents`, plus
crontab and full-repo sweeps), then per-component decisions under the
`.skills/tnf-honest-guard-review/SKILL.md` doctrine ("an emitter without a
proven reader is a no-op with extra steps"; "a gate that has never gone red is
either guarding nothing or has never run").

Precedent honored: `turn-end-reflection.cjs` sat unwired 2026-09-03 → 2026-09-06
while its schema field and doctrine existed — every handoff recorded
`reflection:null`. Unwired components are not dormant; they are silent.

---

## 1. `scripts/self-improvement-orchestrator.js` — RETIRED

**Evidence of being unwired.** Zero references in scripts, packages,
package.json, .github, LaunchAgents, crontab, or anywhere else in the repo
across its entire git life (introduced in the `9bcdea9a0` era, last touched
`7cc7922b4`). No `self_improvement/` state directory exists; it never ran as a
daemon.

**Why retire, not wire.**

- **Superseded three times over by wired replacements:**
  1. `tnf self-improvement run|status|loop` (`packages/tnf-cli/src/cli.ts`
     ~line 12060) — deterministic loop with artifact verification, run log,
     scorecard, parity audit.
  2. `tnf reflect` (handoff-diff + lessons loop,
     `packages/tnf-cli/src/commands/reflect.ts`).
  3. `npm run test:continuous` → `scripts/swarm/continuous-testing-loop.cjs` →
     `scripts/improver/scan.cjs` (diagnostic flywheel, real call site in
     package.json). Plus the cron-owned `tnf-self-improvement-scorecard` process
     (every 6h via `run-chronological-process.cjs`).
- **Dangerous by design:** injects prompts into the Claude desktop GUI via blind
  AppleScript `keystroke` after `delay 0.5`, then assumes success after
  `delay 10` (honest-guard Q1/Q7: no verification of what was typed or whether
  it submitted; the only mitigation was an idle-time check). Modern TNF moved
  injection behind `tnf-autonomy-safety-audit` checkpoints and
  `tnf-terminal-attention.cjs` buffer reads; this script predates and bypasses
  all of it.
- **Emits result files nobody reads** (`self_improvement/results/*.txt`;
  honest-guard Q4).
- **Wiring it would have made things worse**, not better: a boot-croned
  GUI-keystroke injector is a Tier-1-class risk for a capability that already
  ships headless.

**Residual pattern preserved.** `getSystemIdleSeconds()` (system-wide HID idle
check) was a good idea inside a bad script;
`.agent/skills/tnf-autonomy-safety-audit/SKILL.md` and
`.claude/skills/tnf-autonomy-safety-audit/SKILL.md` now cite the live
implementations instead (`scripts/orchestrator-system.sh` `check_human_idle()`,
`scripts/lib/tnf-terminal-attention.cjs`) and carry a tombstone pointing at this
report.

## 2. `scripts/tnf-self-sufficiency-gate.sh` — RETIRED

**Evidence of being unwired.** Zero call sites anywhere. Its only output,
`~/.tnf/runtime/self-sufficiency.json`, was last written **2026-06-19** — run
once, ~2.5 months before this triage, likely by hand.

**Why retire, not wire.**

- **Emitter with zero consumers** (honest-guard Q4): no code reads
  `self-sufficiency.json`; `tnf doctor` does not consume it; no boot path
  reports it. Wiring the writer without a reader would add a no-op with extra
  steps.
- **It is a dishonest guard** (honest-guard Q1/Q3): tier1 and tier2 are
  hardcoded `"ok"` "by construction", tier4 is hardcoded `"warn"` — it reports
  posture it never measured. The only real probe is a Redis ping. Booting this
  into the startup path would install false certainty at exactly the moment the
  four-tier model (TNF_SELF_SUFFICIENCY.md) needs truth.
- **The protocol's real enforcement targets remain open and are recorded as
  such** in `docs/protocols/TNF_SELF_SUFFICIENCY.md` (see the mutation note
  - `CHALLENGE_RATIONALE_LOG.md` row from today): `tnf` entrypoint printing
    `Self-sufficiency mode: ENABLED`, and `tnf doctor` gating CI on `external.*`
    hard deps. Whoever implements those should design the probe honestly
    (discriminated outcomes per tier), not resurrect this recorder.

## 3. `.agent/skills/tnf-self-evolution-protocol` — WIRED

**Evidence of being unwired.** Zero executable references: no script, gate, or
index consumed or validated it.

**Why the skill is worth wiring.** Its authority trail is real, not decorative:
`docs/protocols/DIRECTIVES.md` (D26 four-tier gate, D27 Self-Evolution Mandate),
`docs/protocols/CHALLENGE_RATIONALE_LOG.md`,
`docs/protocols/DIRECTIVE_CONVERSION_LEDGER.md`, `~/.tnf/authority/tier.json` +
`standing.md`, and both CI guards it cites
(`scripts/protocols/check-artifacts-lifecycle.cjs`,
`scripts/protocols/check-operator-terminal-inviolability.cjs`) all exist. This
triage itself executed the skill's loop (mutating an ACTIVE protocol doc →
challenge_rationale + doc_hash + ledger row), which is the skill working as
designed.

**How it is wired.**

- New executable reference + enforcement:
  `scripts/harness/check-skill-cited-paths.cjs` validates that every
  repo-relative path a `.agent/skills/*/SKILL.md` cites exists, wired as
  `npm run test:skills:cited-paths` in package.json. The skill's citations pass
  on their own merits (not baselined).
- Stale citation fixed: it referenced
  `.agent/skills/tnf-self-improvement-loop/`, which lives in the home root
  (`~/.agents/skills/tnf-self-improvement-loop/`), not the repo.

## 4. `.agent/skills/continuous-improvement` — WIRED (after truthing up)

**Evidence of being unwired.** Zero executable references; and the skill as
written pointed at files that do not exist (`scripts/improver/scan.js` — actual
file is `scan.cjs`; `scripts/improver/fix-env.js` — never existed in git
history; `tnf run improver:scan` — no `tnf run` subcommand exists).

**Why wire, not retire.** The capability is real and already invoked:
`scripts/improver/scan.cjs` runs (verified live during this triage: doctor, lint
baseline, TODO scan, task-envelope dispatch), wired via `package.json` →
`improver:scan`, `test:continuous` (`continuous-testing-loop.cjs`), `joy`. The
skill is the discoverable entry point; retiring it would orphan a live
capability, and leaving it lying would send agents at nonexistent files
(honest-guard Q3).

**How it is wired.** SKILL.md rewritten to cite only real paths and real
commands (`npm run improver:scan`, `npm run test:continuous`), with an explicit
note that `fix-env.js` and `tnf run` never existed; enforced going forward by
`check-skill-cited-paths.cjs` (mutation-tested: reintroducing a nonexistent
citation flips the gate red, exit 1).

---

## The gate that came out of this triage

`scripts/harness/check-skill-cited-paths.cjs` +
`data/harness/skill-cited-paths-baseline.json` (ratchet).

- Pre-wiring run found **105 stale citations** corpus-wide — the two target
  skills' violations were fixed; the remaining 100 (mostly imported third-party
  skills) are baselined as known-stale with triage queued. Regenerating the
  baseline is only legitimate after fixing citations, never to silence a new
  break (same discipline as the command-surface gate's `--update`).
- Honest-guard proofs performed (real exit codes read un-piped):
  - **Clean case:** exit 0 — "PASS: 194 skills checked".
  - **Mutation (pre-wiring):** against the unmodified skills the gate failed
    with exit 1, listing `scan.js`, `fix-env.js`, and the stale sibling citation
    among its findings.
  - **Mutation (regression):** reintroducing `fix-env.js` into the fixed skill →
    exit 1, actionable message; clean revert → exit 0.
  - **Blocked case:** `.agent/skills` absent → exit 2 "CANNOT RUN" with fix hint
    — distinct from "nothing wrong".
  - **Home-relative paths** (`~/…`) are NOTE, never FAIL (honest-guard Q5:
    legitimately-absent conditions must not cry wolf).
- Known limitation, stated: the gate checks citations, not semantics — a skill
  can still describe a file inaccurately while citing a path that exists. It is
  a floor, not a review.

## Verification trail (worktree)

Work performed in `.claude/worktrees/wire-or-retire-selfimprovement-20260906`
(branch `chore/wire-or-retire-selfimprovement-20260906`) per
`docs/protocols/TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL.md` — the shared checkout
held another session's staged work and a live TWIP watcher. Path lease
registered via `check-workspace-lease.cjs --claim`.

### Addendum (2026-09-06, same day): pre-commit hooks silently skipped on the first commit

The initial commit on this branch (`4e6fffb78`) landed with **zero pre-commit
gates executed**: the worktree's pnpm install was interrupted by a slow network
before husky's install step, so `.husky/_` (the configured `core.hooksPath`) did
not exist and git silently skipped the hook chain — including the authority gate
that should have audited the `CHALLENGE_RATIONALE_LOG.md` append.

Closure, in the open: (1) this addendum records the gap; (2) `npx husky` was run
to materialize `.husky/_` in the worktree; (3) the gate-equivalent checks were
executed manually against the committed diff (cited-paths gate green via
`npm run test:skills:cited-paths`; doc_hash of `TNF_SELF_SUFFICIENCY.md`
re-verified; prettier findings on the committed files fixed and committed
through a **real gated** follow-up commit); (4) the `authority-surface-edit`
audit record should now exist in `~/.tnf/audit/commit-attempts.jsonl` from the
follow-up commit. Gap worth propagating: an interrupted install produces a
worktree where hooks fail open silently — a `git commit` that reports success
without having run its hook chain is a false green that only post-hoc audit
detects.

**Systemic fix (same day, `fix/tracked-hooks-fail-closed`):** the generation
step was removed from the critical path entirely. `core.hooksPath` now points at
the tracked `.husky/` directory itself — every hook is a tracked, executable,
self-contained file present in every checkout (the `_/husky.sh` shim was only
ever a deprecation echo). A new `prepare` script,
`scripts/harness/use-tracked-hooks.cjs`, enforces the wiring on every install:
sets `core.hooksPath=.husky`, verifies all six hooks exist, are executable and
syntax-clean, and fails loudly otherwise. `pre-commit` and `pre-push` now carry
a fail-closed self-check that refuses execution whenever `core.hooksPath` points
anywhere but `.husky` — converting the previously silent skip into a loud,
actionable failure. Residual hole, stated honestly: if `core.hooksPath` is
pointed at a nonexistent directory, git still skips hooks without invoking
anything (git has no pre-hook hook); the prepare enforcement plus the self-check
cover every state reachable through normal tooling, and the post-commit manifest
prover now fires in every worktree instead of only husky-installed ones.
