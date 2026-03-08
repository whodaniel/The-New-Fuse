# TNF Agents vs Protocols and Sub-Agent Paths

## Core distinction

- **Agent**: an identity with goals, permissions, ownership, and lifecycle in
  TNF.
- **Protocol**: the message/transport contract used by agents or bridges to
  communicate.
- **Bridge/Adapter**: translation or execution layer that maps one
  protocol/runtime to another.

## Practical model

- Agent identity stays stable (`who`).
- Protocol can vary per interaction (`how`).
- Sub-agent path names delegation intent (`where in orchestration`).

## Current Goose path

- Protocol ID: `goose-cli-v1.0` in relay-core.
- Translator: `GooseAdapter` maps `a2a-v2.0` <-> `goose-cli-v1.0`.
- Runtime bridge: `GooseCliBridgeService` executes bounded `goose run`.
- API surface: `POST /api/agentic/goose/dispatch`.

## Sub-agent path convention

- Format: `scheme://domain/capability[/specialization]`
- Example defaults:
  - `goose://coding/default`
  - `goose://coding/refactor`
  - `goose://coding/test-fix`

## Policy boundary (implemented)

- Goose dispatch is allowed when either condition is true:
  - User has admin/system-level authorization.
  - User has active paid membership tier.
- Endpoint exposes policy probe:
  - `GET /api/agentic/goose/access`
