# TNF Unified Federated Tagged Entity (UFTE) Governor Skill

[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:SKILL] [DOMAIN_SCOPE:PERSONAL]

## Purpose

Enforces cryptographic entity hashing, mandatory document headers, 5W1H context
adaptation, and semantic graph indexing across all agent operations.

---

## Operating Mandate

Every TNF agent executing tasks MUST apply UFTE governance to all created
artifacts, goals, and protocol documents:

1. **Mandatory Header Verification:** Ensure markdown files contain required
   headers:
   ```markdown
   [CLASS:PRIME|INTEL|RAW] [STATUS:ACTIVE|PENDING|LOCKED] [DOC_TYPE:<type>]
   [DOMAIN_SCOPE:CORPORATE|AGENCY|PERSONAL]
   ```
2. **Federated ID Hashing:** Ensure generated goal records and persistent
   entities compute a `federatedId`:
   $$\text{Base58Hash}(\text{tenantId} + \text{title} + \text{createdIso} + \text{tags})$$
3. **5W1H Context Grounding:** Evaluate and populate the 5W1H Matrix:
   - **WHO:** Tenant identity & target role
   - **WHAT:** Codebase paths & API dependencies
   - **WHY:** Motivation & SLA/KPI metrics
   - **WHEN:** Target deadline & cron schedule
   - **WHERE:** Deployment target (Wasm, Railway, Supabase, local)
   - **HOW:** Fleet dispatch & D1/D9 safety gates
4. **Concordance Indexing:** Register generated tags with
   `mcp-concordance-server` and the Unified Semantic Graph
   (`unified_graph_explorer.html`).
