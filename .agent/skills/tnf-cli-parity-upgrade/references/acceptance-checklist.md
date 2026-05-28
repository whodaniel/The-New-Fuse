# Acceptance Checklist

Mark each item pass/fail with concrete command evidence.

## Contract Integrity

- Goal is one sentence and testable.
- Scope explicitly lists in-scope and out-of-scope surfaces.
- Hard constraints include TNF protocol-neutrality.

## Parity Verification

- `tnf --help` shows required root options and command aliases.
- Required compatibility commands execute (`attach`, `web`, `plugin`, `pr`, etc. when in scope).
- `tnf run --help` matches agreed non-interactive contract.
- Subcommand parity checks run for all scoped commands.

## TNF-Native Guardrails

- Default no-arg TNF behavior matches directive contract.
- TNF-native commands still resolve correctly.
- No regression in existing TNF-specific surfaces.

## Quality Gates

- Type-check/lint/tests requested in contract pass.
- New behavior documented where applicable.
- Remaining gaps are listed as explicit backlog items.

## Reporting

- Final summary includes changed files.
- Final summary includes commands run and outcomes.
- Final summary includes unresolved decisions or tradeoffs.
