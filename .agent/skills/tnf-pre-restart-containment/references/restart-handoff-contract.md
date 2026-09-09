# Restart Handoff Contract

Use this schema for a durable pre-restart continuation packet. Markdown is
acceptable when every required field is explicit and machine-searchable.

## Header

- packet ID and creation time;
- status: `PRE_RESTART_CONTAINMENT`, `RESTART_READY`, or `BLOCKED`;
- authority/evidence basis;
- canonical repository path, branch, and observed HEAD;
- command-center session/thread and transcript pointer.

## Restart entry

Provide one exact command that starts only the Local Subdirector, runs TNF
onboarding for the continuation task, and does not launch implementation agents.

## Hard gates

Record observable pass criteria for:

- minimum free disk;
- canonical staged/unstaged/untracked reconciliation;
- worktree ownership and corruption checks;
- remote/ref freshness where relevant;
- service and supervisor state;
- credentials required by any autonomous runtime.

## Session inventory

For each top-level terminal or hidden worker record:

- stable window/TTY identifier;
- runtime and durable session identifier;
- repository/worktree/branch/HEAD;
- task and last verified outcome;
- artifact/transcript paths;
- current classification and blocker;
- exact continuation or explicit `do not redispatch` reason.

## Continuation lanes

Each lane declares:

- owner role and isolation boundary;
- inputs and durable evidence;
- dependencies and launch order;
- allowed mutations;
- verification and completion criteria;
- exact handoff target.

Use one command-center lane. Put read-only diagnosis and governance before
dependent implementation. Give each implementation lane a clean, task-scoped
worktree.

## Shutdown and deletion record

Record native exits, signals, supervisor containment, interactive choices,
removed paths/classes, uniqueness proof, retained branches/refs, approximate
reclaimed bytes, and recoverability. Never record secrets.

## Final verification

The packet is complete only when it states what was designed, what was actually
performed, what was directly verified, what remains volatile, and what must be
re-probed after login.
