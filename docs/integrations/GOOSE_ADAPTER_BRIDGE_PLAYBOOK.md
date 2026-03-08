# Goose Adapter and Bridge Playbook

## Goal

Use Goose as a TNF-compatible delegated coding agent through:

- protocol translation (`goose-cli-v1.0` <-> `a2a-v2.0`)
- deterministic CLI bridge execution (`goose run`)

## Implemented components

1. Protocol adapter:

- `packages/relay-core/src/protocols/GooseAdapter.ts`

2. Protocol enum support:

- `packages/relay-core/src/types/index.ts`

3. Relay registration:

- `packages/relay-core/src/server/RelayServer.ts`

4. CLI bridge:

- `packages/relay-core/src/services/GooseCliBridgeService.ts`

## Current execution model

1. Orchestrator emits an A2A-style relay message.
2. `GooseAdapter` translates to Goose envelope.
3. `GooseCliBridgeService` executes `goose run "<prompt>"`.
4. stdout/stderr/exit are returned as structured bridge result.
5. Result can be rehydrated into A2A event stream.

## Recommended wiring pattern

1. Use Goose only for well-bounded coding tasks:

- implementation slices
- file edits
- test-driven bug fix loops

2. Keep orchestration outside Goose:

- TNF orchestrator decides decomposition and approvals
- Goose executes bounded node tasks

3. Persist execution metadata for audits:

- relay message id
- goose command args
- exit code
- elapsed time

## Environment

- Binary: `GOOSE_BINARY` (default `goose`)
- Bridge timeout: request-level `timeoutMs` (default 10 minutes)

## Guardrails

1. Do not grant broad shell autonomy by default.
2. Require membership/admin policy checks before bridge invocation for
   privileged routes.
3. Enforce idempotent rerun semantics at orchestration layer.
