# TNF Turn End Mandate

Status: ACTIVE Protocol ID: TNF_TURN_END_CANONICAL

## Authority

- Canonical source of truth: `docs/protocols/TURN_END_MANDATE.md` in the TNF
  repository.
- This mandate is the complementary counterpart to `TURN_ZERO_MANDATE.md`. Turn
  Zero ingests session state; Turn End propagates session learning.
- If any external mirror conflicts with this file, this file wins.

## Purpose

Turn End captures the end-of-session state and writes it into the TNF global
protocol files so that the next session (or a different agent) can resume with
full context. Without Turn End, the next session begins blind — it must
reconstruct what happened from git history, scattered notes, or guesswork.

## What Turn End Propagates

1. **LIVING_STATE.md** — Completed steps are marked with `[✅]` and timestamped.
   Active work items are promoted from "in progress" to "done."
2. **SESSION_HANDOFF_LATEST.json** — Machine-readable handoff artifact
   conforming to `docs/protocols/schemas/tnf-session-handoff.schema.json`.
3. **SESSION_HANDOFF_LATEST.md** — Human-readable markdown mirror of the JSON
   handoff.
4. **AGENT_STATUS_LEDGER.md** — If new agents were created or existing agents
   archived, the ledger is updated to reflect the current agent roster.

## Non-Temporal Proliferation

Every session that produces learning — a fixed bug, a discovered inefficiency, a
completed agent, an archived system — must propagate that knowledge into the
global state before closing. A session without Turn End is a **failed handoff**.
Knowledge that remains local to a session and does not proliferate universally
into TNF is knowledge that the next session must rediscover.

This is the Non-Temporal Proliferation Mandate: evolution must not be temporary
or disjointed.

## When Turn End Must Run

Turn End must be executed:

1. **Before closing a session** — No matter how brief the work session was.
2. **Before a long gap** — If more than 4 hours will pass before the next
   session, run Turn End to capture current state.
3. **After any significant work** — Creating or deleting agents, modifying
   protocols, discovering systemic issues, completing milestones.
4. **Before switching contexts** — When moving from one task to an entirely
   different one within the same session.

If you are uncertain whether Turn End is warranted, err on the side of running
it. The idempotent design means duplicate runs update timestamps without harm.

## Automated Execution

Run the Turn End script from the TNF repository root:

```bash
node scripts/turn-end.cjs
```

### Optional Flags

- `--summary <text>` — Override the auto-generated work summary with a
  comma-separated list of descriptions.
- `--no-stage` — Skip `git add` staging of protocol files.

### Idempotent Behavior

The script is idempotent. Running it multiple times is safe — it overwrites the
SESSION_HANDOFF files with fresh timestamps rather than appending. This allows
repeated executions for checkpointing without corruption.

## Manual Steps

If running the script is not possible, manually update the protocol files:

### LIVING_STATE.md

Add completed steps at the top of the **⚡ Active Steps** section:

```markdown
## ⚡ Active Steps

- [✅] 2026-06-23T18:00:00.000Z {description of completed step}

1. [🔄] {existing in-progress item}
```

### SESSION_HANDOFF_LATEST.json

Create or update at `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`:

```json
{
  "spec": "tnf/session-handoff/0.1",
  "handoff_id": "<generate new UUID>",
  "created_at": "<ISO timestamp>",
  "repository": "The-New-Fuse",
  "branch": "<git branch>",
  "head_sha": "<git SHA>",
  "protocol_ack": "TNF_PROTOCOL_ACK",
  "sensitive_scope": "internal",
  "work_summary": ["<human-readable description of work done>"],
  "changed_paths": ["<list of changed files>"],
  "verification": {
    "privacy_guard": "na",
    "secret_sweep": "na",
    "docs_pii_guard": "na",
    "supabase_rls_audit": "na"
  },
  "continuation": {
    "owner": "<operator or system name>",
    "targets": ["<next agent identities>"],
    "priority": "<low|medium|high|critical>",
    "resume_checklist": ["<items for resuming work>"]
  },
  "next_actions": ["<action 1>", "<action 2>"],
  "artifacts": {
    "commits": [],
    "deployment_urls": [],
    "database_migrations": []
  }
}
```

### SESSION_HANDOFF_LATEST.md

Create a markdown mirror at `docs/protocols/reports/SESSION_HANDOFF_LATEST.md`:

```markdown
# SESSION_HANDOFF_LATEST

Protocol ACK: `TNF_PROTOCOL_ACK` Created At: `<ISO timestamp>` Handoff ID:
`<UUID>`

## Scope

- Repository: `The-New-Fuse`
- Branch: `<branch>`
- Head SHA: `<sha>`

## Work Summary

- <summary item 1>
- <summary item 2>

## Changed Paths

- <file 1>
- <file 2>

## Next Actions

- <action 1>
- <action 2>
```

## Agent Registration Check

After Turn End, verify that the agent roster is consistent with the files:

```bash
node scripts/check-agent-registration.cjs
```

This checks that all agents in `.agent/agents/` have corresponding entries in
`docs/protocols/AGENT_STATUS_LEDGER.md`. Use `--fix` to auto-register missing
agents:

```bash
node scripts/check-agent-registration.cjs --fix
```

## Protocol File Staging

After running Turn End, the script stages the protocol files for commit. Review
staged files with:

```bash
git status
```

Commit them separately from feature work to keep the protocol history clean:

```bash
git add docs/protocols/LIVING_STATE.md docs/protocols/reports/SESSION_HANDOFF_LATEST.json docs/protocols/reports/SESSION_HANDOFF_LATEST.md
git commit -m "chore: turn-end handoff <handoff_id>"
```

## Enforcement Targets

The following must reference this canonical file:

- `docs/core/AGENTS.md`
- `scripts/turn-end.cjs`
- `scripts/check-agent-registration.cjs`
