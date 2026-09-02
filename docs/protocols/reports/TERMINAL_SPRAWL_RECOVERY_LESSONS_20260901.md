# Terminal Sprawl Recovery Lessons — 2026-09-01

Status: evidence-derived and locally verified during pre-restart containment

## Incident shape

Thirteen top-level macOS Terminal windows contained a mixture of Codex, Claude,
OpenCode, Pi, Hermes, Antigravity, Vite, tmux, and plain shells. Some tasks were
complete, some had durable partial outputs, some had failed under disk pressure,
and hidden supervisors continued writing after their visible terminal sessions
stopped.

The successful recovery pattern has been codified as:

- `.agent/skills/tnf-pre-restart-containment/SKILL.md` (`operator`);
- `.agent/skills/tnf-post-restart-continuation/SKILL.md` (`validator`);
- the existing `.agent/skills/tnf-fleet-delegation-governor/SKILL.md` remains
  the terminal sweep and dispatch authority.

## Lessons retained

### 1. Terminal inventory and operational safety are different passes

Terminal history can reveal task intent and artifact paths, but it cannot prove
liveness, ownership, successful persistence, or current repository state.
Correlate window ID, TTY, process tree, session database, worktree, and durable
artifacts.

### 2. Artifact-first containment prevents accidental loss

Write and read back the continuation packet before exiting agents, killing
processes, unloading services, removing worktrees, or deleting temporary data.
The packet must include exact restart entry, hard gates, lane dependencies, and
evidence paths.

### 3. Native exits preserve more state than blind signals

Agent TUIs should receive their own graceful exit command after
transcript/session pointers are captured. Signals are a fallback for hung or
crashed runtimes, not the first inventory mechanism.

### 4. Process termination is not supervisor containment

The local API and gateway respawned after direct termination because launchd
still owned them. A final verification pass exposed this. Containment must
inspect launchd, cron, tmux, and other supervisors, unload the exact
current-login service where authorized, and then re-probe for respawn.

### 5. Disk pressure can masquerade as authored Git change

A failed initializing worktree showed tens of thousands of deletions plus dozens
of apparent untracked roots. Before removal, comparison against Git objects
proved that the worktree had no unique commit and that every apparent untracked
root already existed in the retained commit. Large change counts are symptoms,
not uniqueness proof.

### 6. Worktree deletion needs a positive proof bundle

Safe force-removal required matching worktree/branch/canonical HEAD, confirming
no unique commit, checking apparent untracked content against the target object,
stopping the owner, and retaining the branch for clean recreation. If any
element is missing, preserve the worktree.

### 7. Disk cleanup must be exact and regenerable

Meaningful space was recovered from one unreferenced browser staging artifact
and orphaned temporary Chromium automation profiles only after checking their
exact parent/prefix and confirming no browser process owned them. Repositories,
histories, user data, shared caches, cookies, and real browser profiles were not
cleanup candidates.

### 8. One command center should survive until the end

The Local Subdirector must be the last session standing. It owns the inventory,
mutation authorization, collision map, shutdown verification, and continuation
packet—not feature implementation.

### 9. Restart invalidates liveness claims

Pre-restart PIDs, services, disk figures, remote refs, locks, and agent
ownership are evidence of the past. After login, start one command center, rerun
TNF onboarding, re-probe every volatile fact, and emit a new dispatch decision.

### 10. Redispatch order is a dependency decision

Read-only forensics should precede writes; governance should precede dependent
implementation; autonomous loops and publication should wait for credentials,
disk, repository, and runtime gates. Parallelism is useful only after isolation
and ownership are proven.

### 11. Disk headroom is an orchestration gate

An agent swarm should not be relaunched merely because the computer rebooted
successfully. The continuation packet must define a minimum free-space gate
appropriate to the workload and block redispatch until it passes.

### 12. Completion language must remain precise

Separate what was designed, what was implemented, and what was directly
verified. A report or handoff can be complete while the underlying feature task
remains unfinished.

## Verified outcome from this incident

- all top-level terminal work was classified and preserved by artifact or
  transcript pointer;
- all non-command-center agent sessions were stopped;
- hidden TNF writers and their current-login LaunchAgents were contained;
- one corrupt worktree was removed only after uniqueness proof, with its branch
  retained;
- only regenerable temporary artifacts were deleted;
- the shared dirty canonical checkout was not reset, cleaned, stashed,
  committed, or switched;
- the continuation packet recorded a post-restart disk gate and ordered
  redispatch lanes.

## Scope boundary

This report records an operational pattern, not authority to terminate sessions
or delete data. Each future use must obtain appropriate mutation authority and
generate fresh evidence.
