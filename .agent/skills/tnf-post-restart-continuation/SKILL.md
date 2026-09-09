---
name: tnf-post-restart-continuation
description:
  Validate and reconstruct TNF work after a restart from a durable containment
  packet; use before relaunching agents so disk, repositories, worktrees,
  services, ownership, dependencies, and dispatch order are freshly proven.
metadata:
  short-description: Validate restart state before redispatch
  tnf-primary-type: validator
  tnf-category: tnf-platform
  tnf-risk-tier: medium
---

# TNF Post-Restart Continuation

## Purpose

Convert a pre-restart containment packet into a fresh `GO`, `PARTIAL GO`, or
`NO-GO` redispatch decision. This is the validator paired with
`.agent/skills/tnf-pre-restart-containment/SKILL.md`; it does not treat the
packet as proof of current state.

Harmful patterns to reject include redispatch from stale liveness, launching
implementation agents before gates pass, assigning multiple writers to one
checkout, and treating a handoff claim as runtime proof.

## Inputs

- the durable restart packet;
- `.agent/skills/tnf-pre-restart-containment/references/restart-handoff-contract.md`;
- `.agent/skills/tnf-fleet-delegation-governor/SKILL.md`;
- current TNF onboarding receipt and live machine/repository probes.

## Validation workflow

### 1. Start only the Local Subdirector

Run the packet's restart entry. Do not launch implementation agents yet. Confirm
the canonical repository identity and rerun onboarding for the exact
continuation task with the required write classification.

### 2. Validate packet integrity

Check that required sections exist, referenced artifacts are readable, session
identifiers are durable, removals have proof, and every unfinished task belongs
to exactly one continuation lane. Missing evidence produces `NO-GO` for the
affected lane, not an invented reconstruction.

### 3. Re-probe every volatile fact

Treat pre-restart PIDs, TTYs, service status, agent liveness, disk figures,
remotes, branch tips, locks, queue depth, and credentials as stale. Recheck:

- free disk against the recorded gate;
- canonical staged, unstaged, and untracked state;
- every retained worktree, branch, lock, HEAD, and owner;
- runtime services plus launchd/process-manager respawn behavior;
- remote refs and external systems needed by the next action;
- required tokens by presence/assurance only, never by exposing values.

### 4. Reconstruct the dependency graph

Classify lanes as `ready`, `blocked`, `superseded`, or `complete`. Preserve
packet order unless fresh evidence changes a dependency. Prefer:

1. command-center/collision governor;
2. read-only forensics;
3. policy or governance work that constrains implementation;
4. dependent implementation;
5. publication, deployment, or autonomous loops after their own gates.

Do not redispatch completed or duplicate sessions.

### 5. Prove isolation before authorization

For each ready implementation lane, specify a unique clean worktree,
branch/base, owner, allowed paths, mutation scope, tests, and handoff
destination. The command center remains read-only with respect to feature work.

### 6. Emit the decision

Produce a compact dispatch manifest containing:

- global decision: `GO`, `PARTIAL GO`, or `NO-GO`;
- gate evidence and blockers;
- ordered lane list and dependency edges;
- exact session resume or fresh-launch instruction;
- worktree/branch ownership;
- verification and stop conditions.

Only after the relevant gates pass may the fleet governor dispatch the lane.
Verify acknowledgement and fresh workspace state before launching the next
dependent lane.

## Failure rules

- A readable packet is not proof that the machine matches it.
- A configured service is not proof that it is running; a stopped child is not
  proof that its supervisor is contained.
- A branch name is not proof of unique work or correct ownership.
- Insufficient disk is a global launch blocker even when individual tasks look
  ready.
- If only some lanes pass, use `PARTIAL GO` and launch only independent passing
  lanes.

## Completion

The validator completes when current evidence supports the dispatch manifest,
each launched lane has acknowledged isolated ownership, and designed,
implemented, and verified state are reported separately. It does not declare the
underlying feature work complete.
