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

1. **Header & Category Tagging** (`[CLASS] [STATUS] [DOC_TYPE] [DOMAIN_SCOPE]`)
2. **Federated Entity Hashing** (`mcid`, Base58 Merkle Entity Hash)
3. **The 5W1H Adaptive Context Matrix** (`WHO`, `WHAT`, `WHY`, `WHEN`, `WHERE`,
   `HOW`)

---

## Unified Entity Structure

Every entity registered in TNF (documents, goals, agent cards, skills, and
telemetry records) conforms to the following UFTE schema:

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
    "domainScope": "PERSONAL",
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
