# TNF Whole-Codebase Verification

**Run:** `whole-2026-07-20T05-56-17Z` **Score:** 18/29 **OK:** false
**Packages:** 126

## Failed (11)

- **A01-protocol-validate** exit=1 `logs/A01-protocol-validate.log`
- **A02-protocol-gate** exit=1 `logs/A02-protocol-gate.log`
- **A10-doc-tagging** exit=1 `logs/A10-doc-tagging.log`
- **B02-validate-build** exit=1 `logs/B02-validate-build.log`
- **B03-check-agent-registration** exit=1
  `logs/B03-check-agent-registration.log`
- **B07-validate-security** exit=1 `logs/B07-validate-security.log`
- **C01-turbo-type-check** exit=2 `logs/C01-turbo-type-check.log`
- **C02-turbo-lint** exit=1 `logs/C02-turbo-lint.log`
- **C03-turbo-test-all** exit=1 `logs/C03-turbo-test-all.log`
- **C04-turbo-build-packages** exit=1 `logs/C04-turbo-build-packages.log`
- **C05-turbo-build-apps** exit=1 `logs/C05-turbo-build-apps.log`

## Passed (18)

- A03-protocol-schemas
- A04-local-runtime
- A05-protocol-health
- A06-directive-verify-cycle
- A07-turn-zero-authority
- A08-handoff-source-drift
- A09-sgp-schemas
- A11-cleanroom-boundary
- A12-agent-defs
- A13-orchestration-health
- B01-architecture
- B04-check-structure
- B05-audit-circular
- B06-protocol-schemas-npm
- B08-check-ts
- D01-tnf-doctor-local
- D02-alive-status
- D03-agents-live-status
