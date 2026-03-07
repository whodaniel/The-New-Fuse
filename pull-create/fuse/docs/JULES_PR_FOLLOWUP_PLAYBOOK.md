# Jules PR Follow-Up Playbook

## Timing Reference (for future runs)

- Batch size: 15 Jules sessions.
- Earliest create time: `2026-02-18T12:16:05.890Z`
- Latest initial completion update: `2026-02-18T12:32:19.389Z`
- Initial completion window: **~16m 14s**.

Use this as baseline expectation for similar 15-way fanout.

## Current Run State

- All 15 sessions reached `COMPLETED` initially.
- No `outputs.pullRequest` URLs were present after initial completion.
- Follow-up PR trigger messages were sent to all sessions.
- Sessions transitioned between `COMPLETED` and `IN_PROGRESS` during follow-up
  processing.

## Session Manifest

- File: `.agent/jules-logs/jules-15-session-ids.txt`

## Standard Operations

### 1) Status snapshot

```bash
set -a; source .env.local; set +a
node scripts/jules-pr-orchestrator.cjs status --sessions-file .agent/jules-logs/jules-15-session-ids.txt
```

### 2) Trigger PR follow-up for completed sessions missing PR URLs

```bash
set -a; source .env.local; set +a
node scripts/jules-pr-orchestrator.cjs trigger-pr --sessions-file .agent/jules-logs/jules-15-session-ids.txt
```

### 3) Approve pending plans (unblocks sessions stuck in Planning)

```bash
set -a; source .env.local; set +a
node scripts/jules-pr-orchestrator.cjs approve-plans --sessions-file .agent/jules-logs/jules-15-session-ids.txt
```

### 4) Combined advance pass (approve plans + trigger publish/PR follow-up)

```bash
set -a; source .env.local; set +a
node scripts/jules-pr-orchestrator.cjs advance \
  --sessions-file .agent/jules-logs/jules-15-session-ids.txt \
  --prompt "Required follow-up: use Publish Branch now, open PR to whodaniel/fuse main, and reply with exactly BRANCH: <name> and PR_URL: <url>."
```

### 5) Watch loop (auto re-trigger + handoff regeneration)

```bash
set -a; source .env.local; set +a
node scripts/jules-pr-orchestrator.cjs watch \
  --sessions-file .agent/jules-logs/jules-15-session-ids.txt \
  --interval-ms 15000 \
  --timeout-ms 1800000
```

### 6) Generate merge handoff board

```bash
set -a; source .env.local; set +a
node scripts/jules-pr-orchestrator.cjs handoff --sessions-file .agent/jules-logs/jules-15-session-ids.txt
```

## Merge Workflow (when PR URLs exist)

1. Triage by risk domain:

- docs/tooling
- frontend routing/navigation
- auth/permissions
- framework/core orchestration

2. Merge in waves and run gates between waves.

3. For each PR:

```bash
gh pr view <PR_URL>
gh pr checkout <PR_NUMBER>
# run tests/build/verification
gh pr merge <PR_NUMBER> --squash --delete-branch
```

## Practical Note

If Jules API/CLI still does not emit PR URLs for completed sessions, treat
session URLs as source of truth and continue follow-up there while preserving
this automated status+handoff loop.
