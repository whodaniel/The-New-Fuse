# Agentic Protocol Bridges and Adapter Viability Audit (2026-03-08)

## Scope

- Fresh inventory of active and legacy bridge/adapter layers in TNF.
- Viability assessment against current 2026 agentic patterns.
- Concrete Goose integration additions in this session.

## What changed in this session

1. Added Goose protocol support in relay-core:

- `packages/relay-core/src/protocols/GooseAdapter.ts`
- `packages/relay-core/src/types/index.ts` (`goose-cli-v1.0` added to
  `ProtocolType`)
- `packages/relay-core/src/server/RelayServer.ts` (Goose adapter registration)

2. Added Goose execution bridge:

- `packages/relay-core/src/services/GooseCliBridgeService.ts`
- `packages/relay-core/src/index.ts` (export)

## Viability matrix (route-to-production focus)

| Surface                                   | Evidence                                                             | Runtime Coupling | Viability | Notes                                                                                                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------- | ---------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Relay protocol translation core           | `packages/relay-core/src/server/RelayServer.ts`                      | High             | High      | Registers A2A/OpenAI/Anthropic/LangChain/CrewAI/Goose adapters at startup.                                                                                |
| Relay protocol translator                 | `packages/relay-core/src/protocols/ProtocolTranslator.ts`            | High             | Medium    | Works, but path-finding is simplistic and assumes A2A as universal pivot.                                                                                 |
| OpenAI adapter                            | `packages/relay-core/src/protocols/OpenAIAdapter.ts`                 | High             | High      | Bi-directional A2A mapping with function/tool message support.                                                                                            |
| Anthropic XML adapter                     | `packages/relay-core/src/protocols/AnthropicXmlAdapter.ts`           | High             | Medium    | Useful for legacy XML flows; should be evaluated against newer MCP/tool schemas.                                                                          |
| LangChain adapter                         | `packages/relay-core/src/protocols/LangchainAdapter.ts`              | High             | Medium    | Large mapping surface; needs regression tests for current LangChain message variants.                                                                     |
| CrewAI adapter                            | `packages/relay-core/src/protocols/CrewAIAdapter.ts`                 | High             | Medium    | Works for canonical crew/task payloads; lacks schema contract tests.                                                                                      |
| Goose adapter (new)                       | `packages/relay-core/src/protocols/GooseAdapter.ts`                  | High             | High      | Adds Goose <-> A2A protocol translation for tool-call/status/message envelopes.                                                                           |
| Goose CLI bridge (new)                    | `packages/relay-core/src/services/GooseCliBridgeService.ts`          | Medium           | High      | Deterministic subprocess bridge (`goose run`) for orchestration-level delegation.                                                                         |
| Redis relay bridge                        | `packages/relay-core/src/redis-relay-bridge.ts`                      | Medium           | High      | Solid ingress/egress envelope bridge; has legacy shim support.                                                                                            |
| MCP core integration stack                | `packages/mcp-core/src/...`                                          | Medium           | Medium    | Deep capability surface, but large and heterogeneous; needs consolidation boundaries.                                                                     |
| Resource registry MCP server              | `packages/resource-registry/src/mcp/resource-registry-mcp-server.ts` | Medium           | High      | Clear, concrete MCP server usage and tool exposure.                                                                                                       |
| Jules agent adapter                       | `packages/jules-integration/src/JulesAgentAdapter.ts`                | Medium           | High      | Active adapter with API gateway dependency and test coverage.                                                                                             |
| AG2 bridge                                | `packages/integrations/ag2/ag2-integration/src/ag2-bridge.tsx`       | Low              | Low       | Historical path from sunset `packages/integrations` package (removed 2026-05-17); migrate any revival to `resource-registry` or a dedicated adapter repo. |
| Core protocol translator service (legacy) | `packages/core/src/services/protocol/protocol-translator.service.ts` | Low              | Low       | Empty stub; should be archived or replaced by relay-core implementation.                                                                                  |

## Key findings

1. `relay-core` is the real protocol spine.

- Production path should converge here for cross-agent translation.

2. There is drift between active and legacy protocol layers.

- `packages/core` has a translator stub while `relay-core` has concrete
  adapters.
- Some integration files (example: AG2 bridge) look stale/unowned.

3. Goose can now be treated as a first-class delegated agent path.

- Protocol translation exists.
- CLI execution bridge exists for orchestration workers.

## Refactor priorities

### Now

1. Route all new protocol work through `packages/relay-core/src/protocols/*`.
2. Add automated adapter contract tests for OpenAI/LangChain/CrewAI/Goose
   round-trips.
3. Mark legacy/stub protocol surfaces as deprecated
   (`packages/core/src/services/protocol/*`).

### Next

1. Add a centralized capability registry entry format for adapters:

- adapter id, version, supported protocol pairs, test status, owner.

2. Implement graph-based translation pathing in `ProtocolTranslator` (not only
   A2A fallback).
3. Add replay-safe correlation IDs across relay + Goose CLI bridge executions.

### Later

1. Merge adapter lifecycle and observability into a unified control plane UI.
2. Add policy guardrails by principal tier (member/admin/super-admin/agent role)
   on bridge invocation.

## External trend alignment (2026)

Observed external direction is converging on:

- MCP-compatible tool interfaces,
- deterministic orchestration wrappers around coding agents,
- explicit state machine overlays for reliability.

TNF should keep `A2A` and `MCP` as internal primitives while exposing
provider-specific adapters (Goose included) via deterministic bridge contracts.
