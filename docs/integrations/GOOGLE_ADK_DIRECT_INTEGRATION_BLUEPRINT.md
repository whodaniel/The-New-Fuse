# Google ADK Direct Integration Blueprint (TNF Adapter-First)

Date: 2026-03-24
Owner: TNF platform
Status: In progress (Phase 1 complete, Phase 2 partial)

## 1) Objective

Adopt Google ADK directly to expand TNF capabilities without replacing TNF orchestration, protocol contracts, or relay architecture.

## Progress Snapshot (2026-03-24)

1. Completed: `apps/adk-gateway` scaffold with `/v1/health`, `/v1/capabilities`, `/v1/execute`, `/v1/execute/stream`.
2. Completed: `packages/core/src/llm/providers/GoogleADKProvider.ts` adapter with streaming fallback.
3. Completed: provider/config wiring for `google-adk` in shared config and provider enums.
4. Completed: API runtime routing for `google-adk` in:
   - `apps/api/src/controllers/ai.controller.ts`
   - `apps/api/src/controllers/orchestration.controller.ts`
   - `apps/api/src/services/agent-api-grants.service.ts`
5. Completed: focused unit tests covering ADK endpoint resolution, headers, payload mapping, and response parsing.
6. Completed (baseline): real (non-stub) ADK execution + streaming path in Python gateway with credential preflight and structured stream error events.
7. Pending: production telemetry/audit enhancements and richer ADK tool policy controls.

## 2) Strategic Decisions

1. Keep TNF as the control plane and protocol authority.
2. Integrate ADK as an execution/runtime capability behind a TNF adapter boundary.
3. Use Python first for direct ADK runtime integration.
4. Keep TypeScript as the TNF orchestration and product surface layer.

## 3) Why Python First, Here

1. ADK maturity is currently stronger on Python, so risk is lower for first production adoption.
2. TNF already documents a Python bridge pattern for ADK (`docs/integrations/adk-usage.md`), even if implementation artifacts are incomplete.
3. TNF is heavily TypeScript-driven, so Python sidecar plus TS adapter preserves current velocity and avoids framework churn.

## 4) Existing TNF Touchpoints To Reuse

1. Gemini provider abstraction: `packages/core/src/llm/providers/GeminiProvider.ts`
2. Provider config loading: `config/llm-provider.config.ts`
3. Provider enum typing: `packages/types/src/types/providers.ts`
4. Queue/router patterns: `packages/workflow-engine/src/orchestrator/tnf-router.ts`
5. Redis-based orchestration flows in `packages/workflow-engine`

## 5) Target Architecture

```text
TNF Apps/Orchestrator (TypeScript)
  -> TNF Provider/Adapter Layer (TypeScript)
    -> ADK Gateway (Python service)
      -> Google ADK runtime + tools/agents
    <- normalized TNF result envelope
```

### Components

1. New service: `apps/adk-gateway/` (Python).
2. New provider adapter: `packages/core/src/llm/providers/GoogleADKProvider.ts`.
3. Provider registration/config updates:
   - `config/llm-provider.config.ts`
   - `packages/types/src/types/providers.ts`
4. Optional shared contract package for payload typing:
   - `packages/contracts/src/adk/` or `packages/types/src/adk/`

## 6) Contract-First Bridge API (v0)

### Endpoint set

1. `GET /v1/health`
2. `POST /v1/execute`
3. `POST /v1/execute/stream`
4. `GET /v1/capabilities`

### `POST /v1/execute` request (normalized)

```json
{
  "requestId": "uuid",
  "traceId": "uuid",
  "workspaceId": "tnf-workspace-id",
  "agentId": "tnf-agent-id",
  "model": "gemini-2.5-pro",
  "input": {
    "messages": [
      { "role": "system", "content": "..." },
      { "role": "user", "content": "..." }
    ]
  },
  "tools": [],
  "metadata": {
    "source": "tnf-workflow-engine",
    "policyProfile": "default"
  },
  "timeoutMs": 120000
}
```

### `POST /v1/execute` response (normalized)

```json
{
  "requestId": "uuid",
  "traceId": "uuid",
  "status": "ok",
  "output": {
    "content": "final text",
    "parts": []
  },
  "usage": {
    "inputTokens": 0,
    "outputTokens": 0,
    "totalTokens": 0
  },
  "toolCalls": [],
  "latencyMs": 0,
  "provider": "google-adk",
  "model": "gemini-2.5-pro"
}
```

## 7) TNF -> ADK Mapping Rules

1. TNF request envelope remains canonical.
2. TS adapter maps TNF envelope into ADK invocation payload.
3. Python ADK gateway maps ADK output back to TNF-normalized response.
4. Provider-specific fields stay in `metadata.provider` to avoid polluting core contracts.
5. All failures return structured TNF-compatible error objects with stable `code` values.

## 8) Security and Runtime Controls

1. Run `apps/adk-gateway` as isolated service identity.
2. Store ADK/Gemini secrets in existing TNF secret flow; never in request payloads.
3. Enforce request timeout and max payload size at gateway boundary.
4. Add tool allowlist policy so ADK cannot execute unapproved tool classes.
5. Include idempotency key support for safe retry behavior.

## 9) Observability Requirements

1. Structured logs in both TS adapter and Python gateway with `traceId`, `requestId`, `workspaceId`, `agentId`.
2. Emit latency and error metrics by model and route.
3. Persist execution summary for audit parity with existing TNF execution logs.
4. Capture gateway version in each response for rollout diagnostics.

## 10) Rollout Plan

### Phase 0: Design freeze (1-2 days)

1. Finalize bridge schema and endpoint signatures.
2. Approve provider name: `google-adk`.
3. Define minimal tool policy profile.

### Phase 1: Skeleton integration (2-4 days)

1. Create `apps/adk-gateway` with health and execute stubs.
2. Add `GoogleADKProvider.ts` in `packages/core/src/llm/providers/`.
3. Add provider type/config wiring.
4. Add smoke test path from TNF provider to gateway.

### Phase 2: Functional MVP (3-5 days)

1. Wire real ADK execution path in Python.
2. Add streaming endpoint and TS consumer path.
3. Add normalized error mapping and retries.
4. Add telemetry and audit log hooks.

### Phase 3: Production hardening (3-5 days)

1. Load test with realistic concurrency.
2. Add circuit breaker fallback to existing Gemini provider path.
3. Gate rollout by workspace or feature flag.
4. Ship runbook and on-call diagnostics.

## 11) MVP Acceptance Criteria

1. TNF can route a task through `google-adk` and receive normalized output.
2. Streaming works end-to-end with clean cancellation.
3. Failure modes return deterministic error codes and messages.
4. Audit logs include request lineage from TNF adapter to ADK gateway.
5. Disabling feature flag reverts cleanly to current provider path.

## 12) Deferred (Post-MVP)

1. Multi-agent ADK workflows exposed as TNF workflow nodes.
2. ADK capability discovery auto-registration into TNF registry.
3. Bidirectional protocol translation for richer tool ecosystems.
4. Managed autoscaling for ADK gateway workers.

## 13) Recommended Immediate Execution

1. Implement Phase 1 in a dedicated branch.
2. Keep the first milestone to `execute` and `health` only.
3. Add streaming only after non-streaming path is stable in CI.
