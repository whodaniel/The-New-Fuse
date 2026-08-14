# TNF Capability Parity Tracking

> **Mission**: Track TNF's capability surface against leading agentic
> computer-use / AI-harness platforms (Alternative AI Computer-class systems)
> and close the highest-value gaps.
> **Status legend**: 🔴 Gap | 🟡 Partial | 🟢 Match | ⚪ Not applicable

This is a condensed, genericized successor to an earlier gap-analysis doc that
named a specific competitor platform inline throughout. Per this repo's own
convention (see `TNF_HOSTED_SPACES_ARCHITECTURE.md`, which already redacts
"Zo Computer" → "Alternative AI Computer"), this doc keeps the substance and
drops the explicit branding — it's a roadmap document, not proprietary
orchestration/billing logic, so it lives in the public docs tree per
`docs/REPO_SEPARATION.md`. A fuller, more granular (and unredacted) version of
this analysis exists in an older, now-deprecated local checkout; treat this
doc as the current source of truth going forward, not that one.

---

## Top Priority Gaps (P0)

### 1. 🟡 Managed hosting for React/API routes ("Hosted Spaces")

TNF lacked managed hosting for React page routes and Hono-style API routes —
every deployment needed manual cloud config. **Action**: `TNF Hosted Spaces` —
see `docs/TNF_HOSTED_SPACES_ARCHITECTURE.md`. **Progress** (2026-08-12): Phase
1 backend shipped — `SpacesModule` (schema + migration + service + controller)
persists spaces/routes/assets in Postgres via Drizzle. Still missing: the
runtime that actually serves route code over HTTP, subdomain routing,
SSL/custom domains, and binary asset storage — real infra work needing an
explicit scope decision (domain, TLS, object storage provider) before it's
built, not something to fake.

### 2. 🔴 Vector storage rollout gaps

RAG-dependent agent workflows need consistent vector search coverage.
**Action**: confirm `pgvector` + `AgentProfileVectorService` coverage extends
to all agent-facing retrieval paths, not just agent profile discovery.

### 3. 🟡 Streaming responses

Some model integrations (e.g. `ai.controller.ts`) are non-streaming only.
**Action**: add `stream: true` support and an SSE endpoint where missing.

### 4. 🟡 Agent persona/memory persistence

Agents have factory defaults but no durable runtime personality or
per-agent memory store. **Action**: `AgentPersonaService` +
`AgentMemoryService`.

### 5. 🟡 API rate limiting

No general-purpose API gateway rate limiting. **Action**: rate-limit
middleware at the gateway layer.

---

## Capability Summary (condensed)

| Area | Status | Notes |
| --- | --- | --- |
| Multi-provider LLM routing | 🟢 | A2A v0.3.0 spec supports routing |
| Streaming responses | 🟡 | Non-streaming only in some controllers |
| Agent orchestration (creation, heartbeat, recovery, hierarchy) | 🟢 | Master Clock + relay |
| Agent memory/persistence | 🟡 | Git + handoff notes; no agent-native runtime memory store |
| Managed web hosting (Hosted Spaces) | 🟡 | Backend CRUD shipped 2026-08-12; no execution runtime yet |
| Custom domains / zero-config deploy | 🔴 | Manual cloud config required |
| Communication channels (chat, SMS, email, Telegram, webhooks) | 🟢 | Multiple channels wired |
| Vector storage / RAG | 🟡 | pgvector exists; coverage inconsistent across paths |
| Rate limiting | 🔴 | Not implemented |
| Security (auth, signing, audit logging, encryption) | 🟢 | Broadly covered |
| Multi-agent intelligence (task decomposition, skill bank, self-improvement) | 🟢 | Mature |

---

*Successor to an earlier CTO-agent-authored gap analysis. Condensed and
genericized 2026-08-12 for the public docs tree.*
