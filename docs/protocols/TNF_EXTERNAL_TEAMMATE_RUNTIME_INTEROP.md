# TNF External Teammate Runtime Interop

`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:PROTOCOL]`

**Canonical location:** `docs/protocols/TNF_EXTERNAL_TEAMMATE_RUNTIME_INTEROP.md`  
**Issued:** 2026-08-13  
**Trigger:** SpaceXAI Grok Bot (2026-08-11) and peer “digital coworker” products  
**Related:** `bridges/tnf-to-external-teammate-runtime.yml`,  
`TNF_EXTERNAL_TEAMMATE_HANDOFF_DEMO.md`, TWIP agent handoff, A2A / MCP catalogs  
**Positioning:** `docs/marketing/VENDORS_SHIP_TEAMMATES_TNF_IS_THE_NERVOUS_SYSTEM.md`

---

## 1. Purpose

Vendor platforms now ship **persistent teammate runtimes**: always-on agents with
their own cloud computer, app logins, and internal multi-bot chat (e.g. Grok Bot,
Claude Cowork, Copilot Tasks, ChatGPT Work).

TNF treats those products as **external peer runtimes**, not competitors at the
nervous-system layer. This protocol defines how TNF:

1. **Discovers** an external teammate runtime
2. **Assigns** work to it with an auditable envelope
3. **Receives** completion / approval / failure signals
4. **Preserves** lineage, policy, and Turn Zero continuity across the boundary

---

## 2. Definitions

| Term | Meaning |
| --- | --- |
| **External Teammate Runtime (ETR)** | Vendor-hosted persistent agent environment (cloud VM, shared sessions, teammate UX). |
| **TNF node** | Local or federated TNF agent (Orchestrator, Broker, Worker) on MCP/A2A/relay. |
| **Peer adapter** | Thin bridge that maps TNF envelopes ↔ ETR APIs / UX automation / webhooks. |
| **Lineage span** | Handoff record that survives the TNF → ETR → TNF round trip. |

---

## 3. Non-goals

- Replacing ETR UX or forcing users off Cursor / SpaceXAI / Anthropic products.
- Claiming TNF owns the ETR’s internal bot-to-bot messaging.
- Auto-sharing operator credentials into an ETR without explicit grant + approval policy.

---

## 4. Trust contrast (must surface in adapters)

| Dimension | Typical ETR (e.g. Grok Bot) | TNF default |
| --- | --- | --- |
| Compute | Shared per-user cloud VM | Local harness + optional hosted relay |
| Auth to apps | Bot signs into operator tools | Explicit connectors / MCP / approval gates |
| Multi-agent | Multiple bots, one vendor computer | Heterogeneous models/harnesses on Synaptic Bus |
| Audit | Vendor-defined | Handoff lineage + Turn Zero artifacts |

Adapters MUST NOT silently widen ETR permissions beyond the operator grant.

---

## 5. Discovery handshake

1. Operator or Interoperability Protocol Agent registers an ETR **Agent Card**:
   - `runtime_id` (e.g. `etr:spacexai:grok-bot`)
   - `capabilities[]` (inbox, browser, code, schedule, approval_required_actions)
   - `auth_modes[]` (oauth, api_key, desktop_session, none)
   - `endpoint` or `adapter_skill`
2. Capability Catalog normalizes the card (same path as MCP/A2A tool ingest).
3. Fleet Coordinator may route long-running knowledge-work lanes to models
   **inside** TNF (e.g. Grok 4.6) **or** hand a whole job to an ETR peer.

---

## 6. Assignment envelope (minimum fields)

```json
{
  "type": "tnf.etr.assign.v1",
  "tenant_id": "required",
  "correlation_id": "uuid",
  "lineage_parent": "handoff-id or null",
  "target": {
    "runtime_id": "etr:spacexai:grok-bot",
    "bot_role": "specialist|chief-of-staff|unspecified"
  },
  "task": {
    "summary": "human-readable",
    "acceptance": ["done criteria"],
    "artifacts_expected": ["paths or URIs"]
  },
  "policy": {
    "require_approval": ["send_message", "purchase", "delete", "prod_change"],
    "data_classes_allowed": ["public", "internal"],
    "credential_grant": "none|named-connector|session-delegate"
  },
  "callback": {
    "channel": "relay|webhook|twip-bridge",
    "address": "tnf:direct:orchestrator or URL"
  }
}
```

Validation failures → `INVALID_REQUEST`. Policy denials → quarantine +
`POLICY.DECISION=deny` (same failure semantics as `twip-to-agent-handoff`).

---

## 7. Lifecycle

```
TNF Orchestrator
  → Broker decomposes (optional)
  → Peer adapter ASSIGN
  → ETR executes (may spawn internal bots)
  → ETR CALLBACK (completed | needs_approval | failed)
  → TNF records lineage span
  → Turn Zero / handoff artifacts updated
```

ETR-internal bot messaging is opaque. TNF only requires **span boundaries**:
assign, approval gate, complete/fail.

---

## 8. First peers (registry seeds)

| runtime_id | Vendor | Status |
| --- | --- | --- |
| `etr:spacexai:grok-bot` | SpaceXAI / Cursor | Seeded 2026-08-13 (adapter stub) |
| `etr:anthropic:claude-cowork` | Anthropic | Planned |
| `etr:microsoft:copilot-tasks` | Microsoft | Planned |
| `etr:openai:chatgpt-work` | OpenAI | Planned |

---

## 9. Model vs runtime (do not conflate)

- **Grok 4.6** = model lane inside TNF fleet (`xai` / `openrouter:x-ai/grok-4.6`).
- **Grok Bot** = external teammate *runtime* that may or may not use Grok 4.6.

TNF can use Grok 4.6 as a Worker **without** sending work into Grok Bot.
TNF can assign work to Grok Bot **without** routing tokens through TNF’s xAI key.

---

## 10. Demo & verification

See `docs/protocols/TNF_EXTERNAL_TEAMMATE_HANDOFF_DEMO.md` and
`scripts/protocols/demo-external-teammate-handoff.cjs`.

Minimum green check:

1. Envelope validates against schema fields above.
2. Lineage parent/child written to handoff log.
3. Callback path records completed | needs_approval | failed.
4. No credentials leave TNF unless `credential_grant` ≠ `none`.

---

## 11. Amendment rule

When a vendor ships a new teammate runtime, add a registry seed row and adapter
stub **before** writing marketing that claims interop. Claims without a
`runtime_id` are prohibited.
