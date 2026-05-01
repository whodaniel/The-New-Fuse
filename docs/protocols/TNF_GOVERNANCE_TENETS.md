# ⚖️ The New Fuse (TNF) Governance Tenets & Protocol Rulebook

**Status:** ACTIVE
**Scope:** System-Wide Master Operating Procedures
**Location:** /The-New-Fuse/docs/protocols/

This document codifies the mandatory gates for new protocols and consolidates the foundational solutions that prevent system bloat, context loss, and architectural drift within the TNF codebase.

---

## 1. The Consolidated Memory Architecture (Integrity & Bloat Prevention)

The foundation of TNF's intelligence rests on ensuring data is actionable and accessible without ever bloating the active context or runtime memory.

### A. The JSON Backlog Protocol (Handoff Pruning)
JSON blobs and session histories are never loaded directly into active RAM. TNF enforces **File-Based Handoff Matrices**. The system retains only pointers (file paths) and the *N* most recent events in active context. Historical data is "lazy-loaded" or targeted via `grep` and specific line-range reads.

### B. The MemPalace Protocol (Spatial Verbatim Storage)
System-level data streams (Agent Dialogues, System Memory, and Protocol Manifests) are ingested via **Zero-Cost Heuristics (Regex)** and routed into a spatial hierarchy (Wings/Halls/Rooms). This preserves 100% of the raw truth without expensive LLM compression on the write-path.

### C. The Distill-and-Purge Protocol (Bloat Elimination)
To prevent infinite storage growth of unstructured data (e.g., massive YouTube transcripts), TNF enforces a lifecycle of **Capture -> Cherry-Pick -> Purge**.
1. **Capture:** Raw verbatim data is vaulted in the MemPalace.
2. **Cherry-Pick:** High-value intelligence (Procedural/Strategic/Governance) is extracted into the machine-actionable **Executable Intelligence Artifact**.
3. **Purge:** Once the distilled artifact is verified and linked, the original raw transcript/log MUST be deleted from active storage to eliminate bloat, leaving only the condensed, usable "Intelligence Artifact."

---

## 2. The Tenets of System Integrity

Every protocol and component in TNF is strictly bound by these Tenets:

1. **The Attribution Overrule:** No AI-distilled claim shall obscure its origin. All intelligence artifacts MUST bear a `resource_pointer` to their raw verbatim source.
2. **The Least-Among-Us Barometer:** Solutions must prioritize zero-cost execution (e.g., regex routing) to protect system-wide token quotas and compute limits.
3. **Execution Over Summarization:** Intelligence is fuel. All unstructured data must be extracted into machine-actionable artifacts (Procedural Code, Strategic Trends, Governance Guardrails).
4. **Verbatim Sanctity:** Never summarize raw source data on ingestion. Vault the raw truth first; compress for context only when required for a specific task.
5. **Context Efficiency:** Never load a full file into an LLM context without first querying its metadata or reading targeted ranges.

---

## 3. The Multi-Gate Adoption Protocol for New Methods

Any time a new method or protocol is considered for adoption into TNF, it **MUST** pass through these mandatory gates, weighed against all prior procedures:

*   **GATE 1: The Sovereignty Check (Privacy & Independence)**
    *   Does this protocol force data into a proprietary cloud? Must have a local-first or zero-data-retention pathway.
*   **GATE 2: The Redundancy Weigh-In (Prior Art Comparison)**
    *   The method must demonstrate a mathematically verifiable improvement in Cost, Speed, or Accuracy over existing TNF baselines.
*   **GATE 3: The JIT Forge Constraint (Hardware Intimacy)**
    *   Can this be compiled or executed natively by the Self-Synthesizing Kernel (C++/Rust/Wasm)? Python/Node.js are treated as scaffolding.
*   **GATE 4: The Intelligence Pipeline Integration**
    *   Does it produce an output that can be caught by the MemPalace Router and turned into an Executable Artifact?

---

## 4. Reconciliation and Departmental Sync

*   **The Master Chronological Reboot:** All sequential indices must be periodically reconciled against objective reality to prevent alphabetical or processing-order drift.
*   **The Unified Ledger:** All system streams (Admin routing, agent logging, protocol pushes) converge on the `unifiedLedgerApi` to ensure common context across all departments.
*   **State Checking:** The system performs routine sweeps of the `scripts/` and `packages/` directories to identify and purge "dead end" or unindexed components lacking a documentation entry in `/docs/`.
