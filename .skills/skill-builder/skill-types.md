# Skill Types (v1)

Treat skill types as a planning primitive.

## Types

- `operator`: changes state (edits, deploys, migrations).
- `validator`: checks correctness (tests, audits, lint, link checks).
- `generator`: produces artifacts (docs, diagrams, registries).
- `router`: triages and selects skills/agents.
- `bridge`: glues multiple skills/tools with explicit handoffs.
- `protocol`: contracts and best practices; minimal tooling.
- `integrator`: wires systems together (auth/provider swaps, service wiring).

## Pairing Rules

- Every `operator` should have at least one `validator`.
- Every `bridge` should end with a `validator`.

