# TNF Agent Session Protocol (Mandatory)

## Purpose

Standardize every agent session so work is resumable, auditable, and
privacy-safe without repeated human reminders.

## Required Steps (Do Not Skip)

1. Inspect current state before acting.
2. Work only in scoped files and avoid unrelated reversions.
3. Verify outcomes with tests/type-check for changed surfaces.
4. Write a session handoff log before stopping.

## Required Handoff Artifact

For every substantial change, the agent must create one markdown handoff file
in:

- `docs/operations/`

Filename format:

- `TNF_<SCOPE>_<YYYY-MM-DD>.md`

The handoff must include:

1. Objective
2. Files changed
3. Validation run and results
4. Known failures (clearly marked as pre-existing vs introduced)
5. Next actions

## Privacy and Data Safety Rules

1. Never commit secrets, tokens, raw personal archives, or local absolute
   home-directory data extracts.
2. Keep personal narrative data in permissioned stores only.
3. Ensure public repo updates contain only sanitized artifacts.
4. If scope includes user data, verify access controls and ownership checks
   before finalizing.

## Tenant and Ownership Controls (Implementation Rule)

When code touches tasks, timeline, suggestions, goals, plans, or delegations:

1. Enforce authenticated owner scope.
2. Propagate tenant scope when available.
3. Apply workspace scope checks when available.
4. Add or update tests for cross-scope denial cases.

## Completion Gate

A session is not complete until all are true:

1. Changes implemented
2. Validation executed
3. Handoff file written
4. Residual risk explicitly documented
