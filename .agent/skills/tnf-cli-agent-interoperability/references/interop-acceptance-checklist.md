# Interop Acceptance Checklist

## Contract Quality

- Goal is explicit and testable.
- In-scope and out-of-scope are both declared.
- Protocol-neutrality and TNF-native guardrails are stated.

## Coverage Verification

- Root command/option delta report generated.
- Required subcommand delta reports generated.
- Required aliases/wrappers resolve and execute.
- Missing items are tracked as explicit backlog entries.

## TNF Safety

- Default TNF UX is unchanged unless contract allows change.
- TNF-only commands still work.
- No accidental lock-in to reference CLI protocol semantics.

## Engineering Quality

- Requested type-check/tests pass.
- Docs/help updates reflect new behavior.
- Final report includes exact commands run and outcomes.
