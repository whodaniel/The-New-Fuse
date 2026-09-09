---
name: tnf-enforcement-change-safety
description:
  Change a TNF gate, git hook, or protocol control without jamming the live
  fleet, and verify a merge or branch claim with evidence rather than a proxy;
  use before editing anything under .husky/, scripts/protocols/,
  scripts/security/, .github/workflows/, or before asserting that a branch
  merges cleanly, that a service is unreachable, or that a control is enforced.
metadata:
  short-description: Change gates and verify merges without breaking the fleet
  tnf-primary-type: operator
  tnf-category: tnf-platform
  tnf-risk-tier: high
---

# TNF Enforcement Change Safety

## Purpose

Hooks under `.husky/` take effect the instant the file is saved — there is no
deploy step, and several agents share this checkout. A wrong edit blocks every
terminal and every cron loop at once. This skill is the procedure for changing a
control safely, and for verifying the claims that usually justify such a change.

Derived from
`docs/protocols/reports/PROTOCOL_ENFORCEMENT_INERTNESS_LESSONS_20260901.md`.

## Before you add a control: find the executor

TNF's dominant defect is _advertised tool, no executor_, and the enforcement
layer has it too. Before writing a gate, a protocol, or a schema:

```bash
grep -rn "<thing>" --include="*.cjs" --include="*.sh" --include="*.yml" \
  scripts/ .husky/ .github/ package.json | grep -v node_modules
```

Separate **definitions** from **call sites**. A control referenced only in
comments, `console.error` strings, or docs is inert. Known examples as of
2026-09-01: `tnf_require_operator()` always returns 0; `TNF_OPERATOR_CONFIRM` is
printed but read by no code; `state-freshness-gate.cjs --check`,
`agent-self-edit-gate.cjs::evaluate()`, `buildHandoffCumulativeId()`,
`HandoffStoreService`, and `check-operator-terminal-inviolability.cjs` all have
zero callers.

**Wiring an inert control is almost always better than writing a new one.**

## Changing a gate in the commit path

1. **Loosen before you tighten.** Any change that could reject a commit an agent
   is composing _right now_ must be preceded by the tolerance that makes it
   safe. Land the strictly-more-accepting change alone, first.
2. **Author in a worktree**, never the shared checkout
   (`TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL.md` R1).
3. **Syntax-check immediately** after any edit to a hook-invoked script — a
   parse error blocks the whole fleet:
   ```bash
   node --check scripts/protocols/<file>.cjs
   ```
4. **Run the gate's own tests.** Confirm first that they use `mktemp -d` and do
   not mutate the shared checkout:
   ```bash
   grep -nE "git (add|commit|reset|checkout)|mktemp" scripts/tests/<test>.sh
   ```
5. **Ship in observe mode.** Route the decision through
   `scripts/lib/enforcement-mode.cjs`; it defaults to `observe`, recording what
   it _would_ have blocked to an append-only ledger. Promote a single gate with
   `TNF_ENFORCE_MODE_<GATE>=block` only once the report is silent on legitimate
   fleet activity. Never promote more than one gate at a time.

## Verifying a merge: only a real merge counts

Three methods give three different answers. Two of them are wrong:

| Method                                   | Behaviour                                                      |
| ---------------------------------------- | -------------------------------------------------------------- |
| `git merge-tree` + grep `<<<<<<<`        | **under-reports** — emits no markers for some conflict classes |
| `git read-tree -m` unmerged count        | **over-reports** — flags anything touched on both sides        |
| real `git merge` in a throwaway worktree | **authoritative**                                              |

```bash
git worktree add --detach /tmp/mergetest origin/<target>
cd /tmp/mergetest && git merge --no-commit --no-ff origin/<source>
git diff --name-only --diff-filter=U
```

`git merge-tree --write-tree` needs newer git than the Apple-supplied 2.37.

## Before creating a branch: check for an alias

A branch tip that already exists under another name is a flail signature, not
parallel work. One capability here lived under 11 names, all at the same commit,
and never landed.

```bash
git for-each-ref refs/remotes/origin --format='%(objectname:short) %(refname:short)' \
  | sort | awk '{c[$1]++; n[$1]=n[$1]" "$2} END {for (k in c) if (c[k]>1) print k, n[k]}'
```

If a merge is failing, fix the merge. Renaming the branch is not a merge
strategy.

## Trusting a probe's failure

A probe's negative is a claim needing the same scrutiny as its positive. The
`runtime.services` freshness probe reported `REDIS_UNREACHABLE` unconditionally
for weeks because it invoked `timeout`, **which does not exist on this machine**
— Redis was answering `PONG` throughout, and agents repeated the false negative
as fact. Confirm the tools a probe shells out to actually exist here:

```bash
command -v timeout gtimeout   # both absent on this host
```

Use `redis-cli -t <s>`, `curl -m <s>`, and other native timeouts instead.

## A crashed gate is not an open gate

A gate has three outcomes, and two of them look alike from the shell:

| Outcome     | Meaning                | Correct response              |
| ----------- | ---------------------- | ----------------------------- |
| passes      | checked, allowed       | proceed                       |
| **denies**  | checked, refused       | address the finding           |
| **crashes** | never checked anything | restore the gate, then re-run |

Deny and crash are not the same, but both stop the commit, so the reflex is the
same reflex: reach for `--no-verify`. That converts "the control could not run"
into "the control does not apply", silently, at exactly the moment the control
was least able to object.

Observed 2026-09-03: a disk-pressure reclaimer in the running fleet deleted the
repo root `node_modules` mid-session to free ~3.5 GB. Every pre-commit gate here
is a Node script with dependencies, so `agent-self-edit-gate.cjs` died on
`require('ajv/dist/2020')` with `MODULE_NOT_FOUND`. The commit under way touched
`scripts/sync-repos.sh` — a registry authority surface, the exact file class
that gate exists to guard. `--no-verify` would have bypassed the authority gate,
the handoff gate and the build gate together, on a change to the distribution
boundary.

**The rule: when a gate cannot run, restore it and re-run. Never bypass a gate
whose verdict you have not seen.** The correct move there was `pnpm install` (5
minutes) and commit normally, not a flag.

Distinguish the two before deciding anything:

```bash
npm run --silent authority:surface:staged; echo "exit=$?"
# BLOCKED / OK with a verdict  -> the gate ran; act on what it said
# MODULE_NOT_FOUND, ENOENT, a
# stack trace, "node_modules missing" -> it did not run; restore it
```

Cheap liveness check before trusting any clean commit:

```bash
[ -d node_modules/ajv ] || echo "authority gate cannot run — commits are unchecked"
```

Two corollaries:

- **A clean pre-commit run proves nothing if the gates were not loadable.** A
  commit that sails through because every hook crashed looks identical to one
  that passed. If tooling was broken at any point in a session, re-verify the
  commits made during that window.
- **Anything that reclaims disk must not touch `node_modules` in a repo whose
  enforcement lives there.** A reclaimer that disables the control plane to free
  space has made a trade nobody authorised. Delete a _worktree's_ `node_modules`
  if you must — never the checkout that runs the hooks.

## Multi-writer state

Append-only JSONL is the only shape that survives concurrent agents.
`CHANGE_OWNERSHIP.jsonl` and `COLLISION_LOG.jsonl` are the only state surfaces
in this repo that have never conflicted; every wholesale-rewritten shared
document conflicts in proportion to fleet size. New durable multi-writer state
goes in append-only JSONL, and shared documents become generated views with one
writer.

## Honest limit

`main` has no branch protection on this plan, and `--no-verify` / `HUSKY=0`
defeat every local hook. These controls make violations rare and attributable,
not impossible. Do not describe them as prevention.
