# Relay + ArDrive Remaining Work Plan

Last updated: March 20, 2026 Owner: TNF Platform Engineering Status: Active

## Objective

Finish the remaining production hardening for relay audit continuity and
ArDrive/Degoo compliance while keeping `main` stable and releaseable.

## Scope

In scope:

- Relay -> unified-ledger internal ingest reliability and security.
- ArDrive connector path hardening (preflight, queue, worker, timeline/audit).
- Degoo ToS-safe guardrails enforcement and observability.
- CI reliability for workspace package boundary builds before type-check.

Out of scope:

- Full frontend global type-check cleanup unrelated to this slice.
- New provider integrations beyond pCloud, Degoo, and ArDrive.
- Large UX redesign of admin runtime screens.

## Current Baseline

Completed and already on `main`:

- Relay identity/audit continuity wiring and bridge decision tracing.
- Provider blueprint API + runtime guardrails for Degoo/ArDrive aliases.
- Internal unified-ledger ingest routes with shared-secret support.
- Focused tests for relay audit continuity and internal ingest auth.
- CI pre-step to force-build key package boundaries before type-check.

## Remaining Milestones

## M1 - Internal Ingest Hard Fail + Config Validation

Owner: API Platform Dependencies: None Priority: P0

Deliverables:

- Enforce startup/config validation in production:
  - `TNF_INTERNAL_INGEST_SECRET` or `UNIFIED_LEDGER_INTERNAL_SECRET` required.
  - Fail fast with clear startup error when missing.
- Add operator-facing health endpoint/status note for internal-ingest readiness.

Validation gate:

- API boot test confirms failure when secret missing in production mode.
- API boot test confirms success when secret provided.

## M2 - Relay -> Timeline End-to-End Contract Test

Owner: Relay Core Dependencies: M1 Priority: P0

Deliverables:

- End-to-end integration test covering:
  - relay event emission
  - internal ingest call with secret header
  - unified ledger/timeline record creation
- Negative-path test for bad/missing secret.

Validation gate:

- Test passes in CI with deterministic assertions on payload structure.

## M3 - ArDrive Worker Hardening

Owner: API Runtime Services Dependencies: M1 Priority: P1

Deliverables:

- Worker policy checks:
  - enforce quote freshness/validity at submit boundary
  - retry/backoff policy for transient failures
  - dead-letter transition path with operator notes
- Consistent timeline event shape for preflight, enqueue, submit, fail,
  complete.

Validation gate:

- Service-level tests for queue transitions, retries, and dead-letter behavior.
- No regression in existing `rclone-runtime.service.spec.ts`.

## M4 - Admin UX Operability Gaps

Owner: Frontend Admin Dependencies: M3 Priority: P2

Deliverables:

- Surface connector state clearly:
  - queue status breakdown
  - last worker tick outcome
  - actionable remediation hints
- Explicit display of policy mode (`native_allowed`, `bridge_only`,
  `custom_connector_only`) with links to protocol doc.

Validation gate:

- Focused component tests for warnings and disabled actions.
- Manual smoke: operator can diagnose failed queue item without log diving.

## M5 - CI + Release Guardrails

Owner: DevEx/CI Dependencies: M2, M3 Priority: P1

Deliverables:

- Keep targeted validation lane as release gate:
  - relay-core type-check + relay audit tests
  - api type-check + unified-ledger/rclone runtime tests
  - workflow-engine type-check
- Add reusable script (or workflow composite step) for package-boundary
  prebuild.

Validation gate:

- PR gate blocks on targeted lane failures.
- Nightly run emits summary with pass/fail trend.

## Promotion Criteria to `main`

A branch is eligible for promotion only when all are true:

- `relay-core`, `api-server`, `workflow-engine` type-check pass.
- Focused relay and API test suites pass.
- No new ToS-risking path allows direct Degoo/ArDrive remote execution.
- Internal ingest secrets are enforced in production configuration.
- Cherry-pick promotion performed from a clean isolated worktree.

## Risks and Mitigations

- Risk: Workspace dist artifacts disappear and cause false CI failures.
  - Mitigation: Keep forced prebuild step before type-check.
- Risk: Internal ingest endpoints accidentally exposed without secret
  protection.
  - Mitigation: Dedicated auth tests + production startup validation.
- Risk: ArDrive queue stalls with unclear operator recovery.
  - Mitigation: dead-letter transitions + explicit admin remediation UI.

## Execution Order

1. M1
2. M2
3. M3
4. M5
5. M4

## Tracking

Recommended issue labels:

- `relay-audit`
- `ardrive-connector`
- `internal-ingest-security`
- `ci-boundary-prebuild`

Recommended cadence:

- Daily status update in PR thread while P0/P1 milestones are active.
