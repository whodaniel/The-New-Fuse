# Protocol Enforcement Inertness Lessons — 2026-09-01

Status: evidence-derived, measured against `origin/main`, verified locally

## Incident shape

Merging one branch to `main` required resolving 9 conflicts, 4 of them in
harness authority files. The investigation found the conflicts were not
incidental — they are manufactured by the enforcement layer itself, and the
surrounding governance that should have prevented the surrounding mess is
present as doctrine but absent as running code.

Measured on `origin/main` over 60 days:

| Signal                                | Value                                |
| ------------------------------------- | ------------------------------------ |
| Commits landed                        | 696                                  |
| Of those, merge commits               | 53 (643 went direct to `main`)       |
| PRs ever opened                       | 229 — 90 merged, 138 closed unmerged |
| Remote branches unmerged              | 146 (137 created in August alone)    |
| Duplicated branch tips                | 18 tips covering 47 branch names     |
| `SESSION_HANDOFF_LATEST.json` touched | 256 of 696 commits                   |
| `LIVING_STATE.md` touched             | 224 of 696                           |
| `AGENT_STATUS_LEDGER.md` touched      | 211 of 696                           |

## Lessons retained

### 1. Complete doctrine is not enforcement — check for the executor

Every rule needed here already existed: branch closure (`HARNESS_CONFIG.md` §7),
convergence (D21, `MULTI_AGENT_INTEGRATION_PROTOCOL.md`), the Do-not-reinvent
gate (`.agent/SYSTEM_PROMPT.md`), the Overlap Check
(`TNF_CONCURRENT_AGENT_COORDINATION_PROTOCOL.md` §2), report-back (D6), and
single-writer ownership (`data/protocols/agent-owned-docs.registry.json`).

What was missing was callers. The enforcement layer had the same _advertised
tool, no executor_ defect it catalogues elsewhere:

- `.husky/tnf-authority.sh::tnf_require_operator()` always `return 0`;
  `TNF_OPERATOR_CONFIRM` appears only in comments and `console.error` strings
  and **is read by no code** — while the block message instructs operators to
  set it.
- `state-freshness-gate.cjs --check` blocks on stale state; zero call sites.
- `agent-self-edit-gate.cjs::evaluate()` — a complete actor-scoped ownership
  model with tests; zero call sites.
- `session-handoff-mcid.cjs::buildHandoffCumulativeId()` — zero callers, so
  handoffs form no lineage chain and a clobbered handoff leaves no trace.
- `HandoffStoreService` — full Redis publish/ack/sweep API, never imported by
  `standalone-relay.ts`.
- `check-operator-terminal-inviolability.cjs` — documented in DIRECTIVES as a CI
  guard; zero references in any workflow.
- `CHANGE_OWNERSHIP.jsonl` — written on every push, read by nothing.

**Apply:** before writing a new protocol or gate, grep for call sites of the one
that already exists. A documented control with no caller is worse than no
control, because it is cited as coverage.

### 2. An enforcement mechanism can manufacture the defect it exists to prevent

`enforce-session-handoff.cjs` (wired at `.husky/pre-commit`) fails unless the
handoff's `branch`, `head_sha`, and 72h freshness match HEAD. That _forces_
every agent to re-emit. `emit-session-handoff.cjs` writes the shared file
wholesale with a fresh `crypto.randomUUID()`, so every line differs between any
two agents and the file can never merge. The gate produced the conflicts.

**Apply:** when a shared artifact conflicts constantly, look at what compels the
write before hardening the rule around it.

### 3. Shared mutable files in git are global variables

The only two state surfaces in this repo that have never produced a merge
conflict are `CHANGE_OWNERSHIP.jsonl` and `COLLISION_LOG.jsonl` — both
append-only. Everything wholesale-rewritten by multiple agents conflicts in
proportion to fleet size.

**Apply:** new durable multi-writer state goes in append-only JSONL. Shared
documents become generated views with one writer.

### 4. Verify health probes; a probe can fabricate a failure forever

`state-freshness.registry.json`'s `runtime.services` probe ran
`( timeout 5 redis-cli ping || echo REDIS_UNREACHABLE )`. **There is no
`timeout` command on this machine.** It failed instantly every time and reported
`REDIS_UNREACHABLE` unconditionally. Redis had been answering `PONG` throughout,
and agents (including this one) repeated the false negative as fact.

**Apply:** a probe's negative result is a claim that needs the same scrutiny as
a positive one. Confirm the tools a probe invokes actually exist on this host —
see `mac-has-no-timeout-command`.

### 5. Conflict-detection proxies lie in both directions

Three methods, three answers, for the same merge:

| Method                                       | Reported        | Truth                                             |
| -------------------------------------------- | --------------- | ------------------------------------------------- |
| `git merge-tree` (old form), grep `<<<<<<<`  | 0 conflicts     | wrong — misses classes it emits no markers for    |
| `git read-tree -m`, count unmerged           | 110 paths       | overstated — flags anything touched on both sides |
| **real `git merge` in an isolated worktree** | **9 conflicts** | **authoritative**                                 |

**Apply:** only a real trial merge is evidence. Do it in a `git worktree`, never
in the shared checkout. Note that `git merge-tree --write-tree` needs a newer
git than the Apple-supplied 2.37.

### 6. Branch aliasing is a flail signature, not parallel work

`security/canonical-raw-sql-hardening` exists under 11 names — `-candidate`,
`-canonical`, `-clean`, `-final`, `-merge`, `-pr`, `-ready`, `-review`,
`-review2`, `-stage` — **all pointing at the identical commit `df145a316`, which
never landed.** Repo-wide, 18 tips cover 47 branch names. Renaming a branch is
not a merge strategy.

**Apply:** before creating a branch, check whether its tip already exists under
another name (`git for-each-ref` on object id). If a merge is failing, fix the
merge.

### 7. Measure convergence; do not assume the PR path is the path

92% of commits reached `main` without a PR. A governed path that carries 8% of
traffic is not governing anything, and the branch backlog is what becomes of
work that took neither path.

### 8. Verify the shape of a problem before fixing it — it may have inverted

The 400 commits under the shared `TNF Agent <agent@thenewfuse.local>` identity
looked like a live attribution failure. Over the last 7 days: **zero** such
commits — they were Cursor cloud agents, historical. The live problem is the
inverse: agent identity is _erased_, because all terminals commit as the human
operator. The correct fix is a commit trailer, not a `user.name` change, which
would have broken GitHub attribution while fixing nothing.

### 9. Loosen before you tighten, on any gate in the commit path

Hook edits take effect the instant the file is saved — there is no deploy step,
and several agents share this checkout. Any change that could reject a commit an
agent is composing right now must be preceded by the tolerance that makes it
safe.

Concrete case handled here: `changedSet` is lower-cased, so
`SESSION_HANDOFF_LATEST.json` also matches the `session_handoff_` filter. Making
the emitter write per-agent receipts _first_ would have made every agent holding
a dirty LATEST hit _"Multiple handoff JSON receipts found"_. The gate was taught
to prefer the per-agent receipt and ignore a co-staged LATEST **before** any
emitter change — a strictly-more-accepting change that cannot jam anyone.

### 10. Enforcement in a live fleet ships in observe mode

New gates route decisions through `scripts/lib/enforcement-mode.cjs`, which
defaults to `observe`: the gate records what it _would_ have blocked to an
append-only ledger and lets the operation through. A gate is promoted to `block`
with `TNF_ENFORCE_MODE_<GATE>=block` only after the report shows it silent on
legitimate activity.

## Honest limit

`main` on `tnf-monorepo` has **no branch protection** — the API returns 403
"Upgrade to GitHub Pro or make this repository public." Every local control is
bypassable with `--no-verify` or `HUSKY=0`. The 2026-08-03 entry in
`.husky/tnf-authority.sh` records an agent hitting a gate and re-running with
the override set 36 seconds later. These measures make violations rare, cheap to
avoid, and attributable. They do not make them impossible. Genuine prevention
needs a server-side ruleset or a `pre-receive` hook.

## Related

- `docs/protocols/TNF_CONCURRENT_AGENT_COORDINATION_PROTOCOL.md` — canonical
  incident #2 (shared-report overwrite) diagnosed this class in 2026-08-16; the
  mitigation was a manual checklist, which is why it recurred.
- `docs/protocols/TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL.md` R1/R3 — nothing
  that moves HEAD runs in a shared tree; uncommitted work is unprotected work.
- `docs/protocols/reports/TERMINAL_SPRAWL_RECOVERY_LESSONS_20260901.md`
