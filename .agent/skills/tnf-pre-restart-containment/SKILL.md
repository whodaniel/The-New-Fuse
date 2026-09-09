---
name: tnf-pre-restart-containment
description:
  Preserve and contain sprawling local agent work before a computer restart,
  shutdown, or severe disk-pressure event; use when multiple terminal runtimes,
  worktrees, and supervisors must be inventoried, stopped safely, and converted
  into a durable continuation plan.
metadata:
  short-description: Preserve terminal work and make restart safe
  tnf-primary-type: operator
  tnf-category: tnf-platform
  tnf-risk-tier: high
---

# TNF Pre-Restart Containment

## Purpose

Turn multi-terminal task sprawl into a restart-safe, evidence-backed
continuation graph. Preserve work before stopping anything, contain both child
processes and their supervisors, and leave one durable packet that a fresh Local
Subdirector can validate after restart.

This skill is an `operator`. Its paired validator is
`.agent/skills/tnf-post-restart-continuation/SKILL.md`.

High-risk signals include destructive cleanup before unique-work proof, killing
child processes without checking supervisors, trusting terminal text as proof of
liveness, and mutating a shared dirty checkout during containment.

## Authority and boundaries

1. Run TNF onboarding for the exact containment task and require write readiness
   before creating TNF artifacts.
2. Read `.agent/skills/tnf-fleet-delegation-governor/SKILL.md` for the
   authoritative terminal-window inventory and targeting procedure. Do not
   create a second window-sweep mechanism.
3. Use the relevant runtime command skill for native graceful exits when one
   exists.
4. Inspection and evidence capture do not authorize shutdown, worktree removal,
   service unloading, or deletion. Require explicit user authority for those
   actions.
5. Never put secrets, tokens, environment values, or browser-profile data in the
   handoff.

## Workflow

### 1. Establish a single command center

- Identify the controlling terminal and keep it alive until final verification.
- Treat every other terminal, daemon, and supervisor as an observed target, not
  as an automatic task owner.
- Do not implement features from the command center during containment.

### 2. Inventory intent and runtime state separately

Use the fleet governor's three-pass sweep, then correlate each top-level window
with its TTY and process tree. For every session capture:

- stable window identifier and TTY;
- runtime, session/thread identifier, transcript path, and working directory;
- repository, branch, worktree, HEAD, staged/unstaged/untracked state;
- apparent task, durable outputs, unfinished action, blocker, and current
  liveness;
- classification: `active`, `waiting`, `completed`, `failed`, `duplicate`, or
  `unknown`.

Terminal history establishes prior intent. Process state, durable artifacts, and
repository state establish current reality.

### 3. Write the continuation packet before mutation

Read `references/restart-handoff-contract.md`. Write the packet to durable
storage outside any contested checkout. Include exact restart entry, hard gates,
dependency-ordered lanes, evidence paths, and the planned shutdown/deletion
scope.

If the packet cannot be written and read back, stop. Do not begin containment.

### 4. Preserve then gracefully stop agents

- Confirm each session's durable transcript or artifact before exit.
- Prefer the runtime's native exit command.
- Record interactive choices such as keeping or removing a worktree.
- If a runtime is hung or crashed, capture its session database/transcript
  pointer before sending signals.
- Stop worker sessions before infrastructure, and stop the command center last.

### 5. Contain background writers and supervisors

Inspect the full process tree, tmux sessions, cron, launchd, and other process
managers. A killed child is not contained if its supervisor can respawn it.

- Signal only exact, inspected targets: graceful stop or `TERM` first, then
  `KILL` only when necessary.
- For user LaunchAgents, `launchctl bootout gui/<uid>/<label>` may be used for
  current-login containment when authorized. Do not `disable`, delete, or edit
  service definitions unless separately requested.
- Re-probe after containment. A clean first snapshot is insufficient; verify
  that services do not respawn.

### 6. Triage broken worktrees causally

Do not interpret a huge deletion set or partial untracked tree as real authored
work until checkout integrity is established.

Before force-removing a worktree, prove all of the following:

- its registered branch, HEAD, lock reason, and owner process are known;
- it has no unique commit relative to the retained branch/base;
- every apparent untracked root is either preserved elsewhere or exists in the
  retained Git object;
- no live process owns the directory;
- the branch/ref needed for clean recreation is retained.

If any proof fails, preserve the worktree and record the blocker.

### 7. Recover disk conservatively

Under critical disk pressure, prioritize exact, regenerable, non-open temporary
artifacts. Verify the target prefix, parent directory, size, and open-process
state before deletion.

Never use broad recursive cleanup against a home directory, repository root,
shared package cache, agent history, browser profile, or user-data store. Record
what was deleted, why it was regenerable, approximate bytes reclaimed, and
whether recovery is possible.

### 8. Verify restart readiness

Recheck:

- free disk and the packet's post-restart redispatch threshold;
- top-level terminals and remaining process trees;
- service/supervisor unload state and respawn behavior;
- canonical checkout status and registered worktrees;
- packet readability and every referenced durable artifact;
- exact removals and preserved refs.

Append the observed shutdown record to the packet. Report designed, implemented,
and verified state separately.

## Stop conditions

Stop and request direction when unique work cannot be distinguished from
corruption, a destructive target is ambiguous, credentials would need to be
copied, the durable packet is unreadable, or containment would require
disabling/deleting persistent services beyond the user's authority.

## Handoff

After restart, invoke `.agent/skills/tnf-post-restart-continuation/SKILL.md`. Do
not redispatch directly from pre-restart PIDs, remembered ownership, cached
remote refs, or old service status.
