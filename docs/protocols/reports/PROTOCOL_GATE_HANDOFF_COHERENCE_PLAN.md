# Protocol Gate & Handoff Coherence Plan

**Date:** 2026-08-10
**Status:** PLANNING
**Goal:** Resolve the recurring "BLOCKED" vs. "OK" discrepancies in `tnf protocol gate` and fix the `living-state-directive` tip drift between `LIVING_STATE.md` and `SESSION_HANDOFF_LATEST`.

## 1. Current State Vulnerabilities
Currently, the TNF protocol mandates strict alignment between three components before a session can be successfully handed off or before autonomy is granted:
1. `docs/protocols/reports/SESSION_HANDOFF_LATEST.json` (machine-readable state, contains `head_sha`).
2. `docs/protocols/reports/SESSION_HANDOFF_LATEST.md` (human-readable state, must contain `TNF_PROTOCOL_ACK`).
3. `docs/protocols/LIVING_STATE.md` (Master active directive list).

**The Discrepancy:**
Agents frequently update one file but not the others. For example, an agent might update `LIVING_STATE.md` to mark a task as complete, but fail to generate a new `SESSION_HANDOFF_LATEST.json` to reflect the new `head_sha`. Or they might regenerate the `.json` but fail to update the `.md` narrative.
This causes `tnf protocol gate` to throw a `BLOCKED` status, while the agent mistakenly believes the status is `OK`.

## 2. Proposed Architecture

### Step 2.1: Atomic Handoff Command
To eliminate human/agent error, we will consolidate handoff file generation into a single CLI tool: `tnf handoff generate`.
- This command will take a summary string.
- It will automatically read the current `HEAD` SHA.
- It will atomically generate **both** the `.json` and `.md` files in `docs/protocols/reports/`.
- It will parse `LIVING_STATE.md`, extract the current active directive, and automatically cross-link it.

### Step 2.2: Unify the Verifier (The Gate)
Refactor `scripts/protocols/enforce-session-handoff.cjs` (the engine behind `tnf protocol gate`) to provide deeper diagnostics instead of a generic `BLOCKED`.
If the `head_sha` drifts, the gate should provide the explicit command to fix it (`pnpm run tnf:handoff:generate "Fixing drift"`).

### Step 2.3: `living-state-directive` Hook
Add a validation hook to `.husky/pre-commit` (or the equivalent `tnf-authority.sh`) that specifically blocks commits if the top-most `[Status: ACTIVE]` item in `LIVING_STATE.md` does not match the directive being worked on in the handoff. 

## 3. Implementation Steps
1. Create `scripts/protocols/generate-handoff.cjs`.
2. Wire it to `pnpm run tnf:handoff:generate`.
3. Update `AGENTS.md` and `TURN_ZERO_MANDATE.md` to instruct agents to *exclusively* use this script rather than manually editing the handoff files.
4. Enhance `enforce-session-handoff.cjs` to emit actionable recovery paths.

## 4. Execution Readiness
This plan is ready for implementation by an autonomous agent.
