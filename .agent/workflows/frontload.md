---
description: Execute TNF Turn Zero and refresh canonical session context.
---

# /frontload - TNF Context Frontload

Use this workflow at the start of every AI session, after context clears, or
when switching between agent runtimes.

## Authority

Canonical Turn Zero authority:

- `docs/protocols/TURN_ZERO_MANDATE.md`

This workflow is a convenience wrapper. If it conflicts with the mandate, the
mandate wins.

## Steps

1. Read the system prompt:

   ```bash
   cat .agent/SYSTEM_PROMPT.md
   ```

2. Execute Turn Zero:

   ```bash
   cat ./docs/protocols/TURN_ZERO_MANDATE.md
   cat ./docs/protocols/LIVING_STATE.md
   cat ./docs/protocols/AGENT_STATUS_LEDGER.md 2>/dev/null || true
   cat ./docs/protocols/reports/SESSION_HANDOFF_LATEST.json 2>/dev/null || true
   ```

3. Inspect runtime inventory:

   ```bash
   node scripts/tnf-onboard.cjs --runtime-timeout-ms 1000
   ```

4. Load the resource map if the task requires skill or agent selection:

   ```bash
   cat .agent/context/resource-map.md
   ```

5. Confirm operator policy:

   - TNF is the primary control plane.
   - OpenClaw is an optional interoperability surface.
   - Prefer native `tnf <command>` routes first.
   - Use `tnf openclaw ...` or `tnf claw ...` only when no native TNF route
     exists.
   - Avoid raw `openclaw ...` unless debugging compatibility or explicitly
     requested.

6. Report orientation:

   - active directive
   - handoff source and next actions
   - missing artifacts, if any
   - endpoint sources: environment variable or local fallback
   - verification path for the requested task

## Legacy Files

`.agent/handoff_notes.txt`, `task_plan.md`, `findings.md`, and `progress.md`
are compatibility fallbacks only. Do not create or update them unless the
operator explicitly requests legacy file-based planning.

## Raw Agent Prompt

For an AI CLI launched without TNF auto-injection, paste:

```text
Execute the Turn Zero Mandate exactly as outlined in ./docs/protocols/TURN_ZERO_MANDATE.md. Read the Living State, Ledger, and Handoff artifacts in ./docs/protocols/, output a summary of your orientation, and await my confirmation before executing any code changes.
```
