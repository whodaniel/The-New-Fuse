`[CLASS:INTEL] [STATUS:PENDING]`
`[DOC_AUDIT_BACKFILL:2026-07-14]` — header restored for Gate 3 compliance; reclassify on next vetting pass.

# Bridge Report: tnf-whatsapp-bridge-verifier

Date: 2026-04-27  
Status: PROPOSED / SCAFFOLDED

## Objective

Add a safe verifier surface for the Hermes WhatsApp bridge so TNF can inspect
runtime state, session persistence, and dependency drift without mutating the
existing production workflow.

## What Was Added

1. Bridge contract:
   - `docs/protocols/bridges/tnf-whatsapp-bridge-verifier.yml`
2. Read-only health-check scaffold:
   - `scripts/protocols/whatsapp-bridge-health-check.cjs`
3. Side-by-side remediation matrix:
   - `docs/protocols/bridges/reports/whatsapp-bridge-dependency-candidate-matrix-2026-04-27.md`
4. Additive TNF CLI wrapper:
   - `tnf whatsapp health`
   - implementation in `packages/tnf-cli/src/cli.ts`
5. TNF doctor surface integration:
   - `scripts/tnf-doctor.cjs` now includes a read-only WhatsApp bridge health section
   - `tnf doctor` now forwards `--live-api-url` and `--skip-live-checks`

## CLI Command Plan

Preferred additive TNF route:
- `tnf whatsapp health`

Implementation notes:
1. Keep `tnf whatsapp health` as a thin wrapper around the standalone script.
2. Preserve explicit fallback for direct execution:
   - `node scripts/protocols/whatsapp-bridge-health-check.cjs --json`
3. Do not change, remove, or alias away any existing TNF or Hermes WhatsApp
   commands during verifier rollout.
4. If a future TNF-native implementation is added, it must preserve the same
   JSON fields and read-only behavior.

## Validation Notes

1. Default smoke path:
   - `node scripts/protocols/whatsapp-bridge-health-check.cjs`
2. Machine-readable output:
   - `node scripts/protocols/whatsapp-bridge-health-check.cjs --json`
3. Strict connected-state expectation:
   - `node scripts/protocols/whatsapp-bridge-health-check.cjs --expect-connected --json`

Expected verifier properties:
- No message sends
- No login / re-pair attempts
- No session file writes
- Exit code `0` on healthy reachable state, `1` on warning/failure state

Initial live scaffold verification on 2026-04-27:
- `/health` responded with HTTP `200`
- bridge status reported `disconnected`
- session path and bridge log were both present
- running processes included both `gateway run --replace` and `whatsapp-bridge/bridge.js`
- current live bridge package pin is `@whiskeysockets/baileys = WhiskeySockets/Baileys#01047debd81beb20da7b7779b08edcb06aa03770`
- additive CLI wrapper verified live:
  - `tnf whatsapp health --help`
  - `tnf whatsapp health --json`
- repo-local type-check remains blocked by a pre-existing workspace issue:
  - `TS2307: Cannot find module '@the-new-fuse/infrastructure'` from `packages/tnf-cli/src/RedisAgentClient.ts`

## Rollout Plan

Phase 1: standalone verifier only
- Keep execution at script level for auditing and schema stabilization.

Phase 2: TNF CLI wrapper
- Add `tnf whatsapp health` as a non-invasive wrapper.
- Keep script path supported for cron, tests, and external tools.

Phase 3: parity hardening
- Mirror verifier output into TNF status surfaces.
- Add dependency matrix checks to preflight audits before any Baileys/libsignal
  patch experiment.

## Safety Boundaries

1. Read-only by default.
2. No restarts, package mutations, or session rotations.
3. No production dependency replacement until a side-by-side candidate is
   validated independently.
