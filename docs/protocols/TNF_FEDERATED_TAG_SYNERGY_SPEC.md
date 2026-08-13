# TNF Unified Federated Tagged Entity (UFTE) Specification

[CLASS:PRIME] [STATUS:ACTIVE]

**Canonical Location:** `docs/protocols/TNF_FEDERATED_TAG_SYNERGY_SPEC.md`  
**Last Revised:** 2026-08-06  
**Authority:** Sub-Director Swarm / Master System Architect

---

## Executive Summary

The **Unified Federated Tagged Entity (UFTE)** specification binds three
distinct TNF indexing systems into a single, cryptographically verifiable, and
semantically searchable entity model:

1. **Header & Category Tagging**
   (`[CLASS] [STATUS] [DOC_TYPE] [VISIBILITY]`)
2. **Federated Entity Hashing** (`merkleRoot`, Base58 Merkle Entity Hash)
3. **The 5W1H Adaptive Context Matrix** (`WHO`, `WHAT`, `WHY`, `WHEN`, `WHERE`,
   `HOW`)

> **Reconciliation note (2026-08-09).** Two names in the original draft of this
> spec collided with identifiers that are enforced in code and schema. Both are
> corrected above; the old spellings are not valid UFTE:
>
> | Was | Now | Why |
> | --- | --- | --- |
> | `[DOMAIN_SCOPE]` | `[VISIBILITY]` | `TNF_DOCUMENT_TAGGING_PROTOCOL` is `[STATUS:LOCKED]` and mandates `[CLASS] [STATUS] [DOC_TYPE] [VISIBILITY]`. `validate-doc-tagging.cjs` enforces those four names. |
> | `mcid` | `merkleRoot` | **`mcid` is already taken.** It is the Master Cumulative ID — a cross-protocol lineage envelope, `spec: tnf/mcid/0.1`, schema `schemas/tnf-master-cumulative-id.schema.json` (requires `spec`/`id`/`scope`/`lineage`), implemented as `McidEnvelope`. Merkle hashing is a **separate** concern with its own schema, `schemas/tnf-merkle-tree.schema.json`. The entity digest is carried by this spec's own `merkleRoot` field. |
>
> Per `ROLE_DEFINITIONS.md` Phase 9, `mcid` is a **UUID v4** assigned by the
> relay envelope (the cumulative event id, with `correlation_id` and
> `causation_id` pointers). It is neither Base58 nor a content hash, so a UFTE
> entity digest could never have been stored in it.

---

## Unified Entity Structure

Every entity registered in TNF (documents, goals, agent cards, skills, and
telemetry records) conforms to the following UFTE schema.

> **`federatedId` is a fourth namespace, not a restatement of Phase 9.**
> `ROLE_DEFINITIONS.md` Phase 9 defines three federated ID namespaces for
> **agents** — `canonicalEntityId`, `idNumber`, `mcid` — all columns on the
> `agents` table. UFTE's `federatedId` addresses **content entities** (docs,
> goals, skills), which have no row there. The two do not compete, and neither
> substitutes for the other:
>
> | Identifier | Shape | Subject |
> | --- | --- | --- |
> | `canonicalEntityId` | `TNF:[scope:]CATEGORY:PROVIDER:NAME:INSTANCE` | agents, sessions, channels — hierarchical, enumerable |
> | `federatedId` (this spec) | `tnf:entity:v2:<base58>` | content entities — derived from content, not from position |
>
> An agent that also has a UFTE record carries both: `canonicalEntityId` for
> registry/dispatch, `federatedId` for tag-graph indexing. When one entity has
> both, `canonicalEntityId` is authoritative for identity and `federatedId` is
> authoritative for content-addressed lookup.

```json
{
  "federatedId": "tnf:entity:v2:base58hash",
  "provenance": {
    "tenantId": "tenant-default",
    "orgId": "org-tnf",
    "userId": "user-danielgoldberg",
    "timestamp": "2026-08-06T20:42:00.000Z"
  },
  "tags": {
    "class": "PRIME",
    "status": "ACTIVE",
    "docType": "PROTOCOL_STANDARD",
    "visibility": "COLLECTIVE",
    "userTags": ["wizard", "goals", "framework"]
  },
  "context5W1H": {
    "who": "Personal Operator & Agent Fleet",
    "what": "Proactive Goal-Achievement Engine",
    "why": "Help others achieve their goals",
    "when": "Continuous / 2026-Q3",
    "where": "TNF Monorepo & Local Environment",
    "how": "5-Stage Wizarding Flywheel & Fleet Dispatch"
  },
  "merkleRoot": "base58-merkle-digest"
}
```

---

## Synergistic Integration Points

### 1. Cryptographic Goal Ledger Binding (`GoalsService.ts`)

Goals managed via `packages/tnf-cli/src/services/GoalsService.ts` generate their
`federatedId` by computing:
$$\text{Base58Hash}(\text{tenantId} + \text{title} + \text{createdIso} + \text{tags.join(",")})$$
This ensures goal progress is tamper-proof and verifiable across fleet nodes.

### 2. Concordance MCP Tag Resolution (`mcp-concordance-server`)

The Concordance MCP server resolves queries against both term frequencies and
the UFTE tag taxonomy:

- `lookup_identifier(query="tnf-proactive-goal-wizard")` returns term
  occurrences + bound UFTE metadata.
- `lookup_by_tag(docType="PROTOCOL_STANDARD", class="PRIME")` returns all
  matching federated entity hashes.

### 3. Unified Semantic Graph Indexing (`unified_graph.json.gz`)

The semantic graph builder (`scripts/semantic-graph/build_unified_graph.py`)
incorporates UFTE tags as first-class graph nodes, allowing graph explorers
(`unified_graph_explorer.html`) to visualize relationships between goals,
protocols, agents, and codebase files.
