# 🗺️ TNF Ontology & Categorization Master Map

**Status:** ACTIVE **Class:** [CLASS:PRIME] **Doc Type:** [DOC_TYPE:INDEX]
**Visibility:** [VISIBILITY:COLLECTIVE]

> **The Active Follow-Through Mandate:** This map is living intelligence. It is
> routinely scanned, verified, and updated by the Swarm to ensure full
> traceability and discoverability of all TNF classification schemas.

---

## 1. Document Metadata Classifiers (Headers)

Every canonical document in the TNF ecosystem must bear a header string
establishing its authority, state, and domain.

- **`[CLASS:*]`**: Defines the core weight of the document.
  - `[CLASS:PRIME]`: Foundational, system-wide authority. Unbreakable by
    lower-tier logic.
  - `[CLASS:PROTOCOL]`: Defines a standard operating procedure or system
    routine.
  - `[CLASS:INTEL]`: A distilled artifact or gathered intelligence.
- **`[STATUS:*]`**: Defines the lifecycle state of the document.
  - `[STATUS:ACTIVE]`: In use and enforced by the system.
  - `[STATUS:LOCKED]`: Immutable without explicit `challenge_rationale` and
    rigorous Gate 5 vetting.
  - `[STATUS:PENDING]`: Awaiting review, vetting, or full integration.
- **`[DOC_TYPE:*]`**: Defines the structural format.
  - `[DOC_TYPE:PROTOCOL]`, `[DOC_TYPE:PROTOCOL_STANDARD]`
  - `[DOC_TYPE:sop]` (Standard Operating Procedure)
  - `[DOC_TYPE:INDEX]` (A map or registry, like this file)
- **`[VISIBILITY:*]`**: Defines access constraints (e.g.,
  `[VISIBILITY:COLLECTIVE]`).
- **`[OWNER:*]`**: (e.g., `[OWNER:TNF]`).
- **`[DOMAIN:*]`**: Categorizes the subsystem (e.g., `[DOMAIN:memory]`).

---

## 2. The 6-Tier Protocol Hierarchy

As defined in `PROTOCOL_MAP.md`, all protocols are categorized into a
hierarchical taxonomy. Lower tiers inherit from higher tiers.

- **Tier 1: Core Governance & Authority** (The Foundation - Constitution,
  Tenets)
- **Tier 2: Operating & State Freshness** (The Harness - Turn Zero, Syncing)
- **Tier 3: Proactive Goal-Achievement & Wizarding** (The Drive - Planning,
  Self-Improvement)
- **Tier 4: Multi-Tenant, Security & Tagging** (The Boundaries - Isolation, IAM)
- **Tier 5: Swarm, Fleet & Interoperability** (The Fleet - Agent Routing,
  Cross-Comms)
- **Tier 6: Telemetry, Handoff & Failure Archaeology** (The Memory - Receipts,
  Audits)

---

## 3. Intelligence Processing Taxonomies

When processing raw information (like video transcripts or external docs),
intelligence is categorized for actionable use:

**Taxonomy of Actionability:**

- **Procedural:** Step-by-step logic, code changes, or executable tasks.
- **Strategic:** High-level goals, system architecture, or long-term vectors.
- **Governance:** Rules, constraints, and system alignment (Tenets).

**Utility Metrics:**

- **Freshness Decay:** How quickly the information becomes obsolete.
- **Implementation Density:** The ratio of effort required to value extracted.
- **Verification Difficulty:** The cost/complexity of proving the artifact is
  factually/technically correct.

---

## 4. The Vetting & Validation Gates

Processes and documents must pass through a strict sequence of sequential
validation gates to achieve `[STATUS:ACTIVE]` or `[STATUS:LOCKED]`.

- **Gate 3 (Compliance):** Formating and foundational completeness.
- **Gate 4 (Linkage & Attribution):** Enforcing the _Attribution Overrule_.
  Every claim must trace back to its origin.
- **Gate 5 (Doc Vetting):** Logical soundness, contradiction checking against
  `[CLASS:PRIME]` tenets, and mutation rationale.
- **Stage A/B/C/D Continuous Self-Improvement Gates:** Validating schemas,
  routing logic, execution health, and remote token fallbacks.

---

## 5. Artifact & Retention Categories

As defined by the Non-Destructive Pruning Protocol and Artifacts Lifecycle:

- **Sovereign Artifacts:** User-owned, private second-brain data. (Housed
  externally in `../User-Data/`).
- **Executable Artifacts:** Synthesized logic ready for machine processing
  (e.g., `.dylib`, JSON mapping).
- **Ephemeral Logs:** Agent thought-streams and temporary execution traces
  subject to pruning algorithms.
- **Locked Docs:** Core protocols. Immutable without explicit human HitL or
  high-clearance audit.

---

## ⚙️ Automated Evolution & Maintenance Process

Per the **Active Follow-Through Mandate**, this master map is tied to a
scheduled self-improvement loop.

- **Process:** The `tnf-ontology-auditor` routine will regularly scan
  `docs/protocols/`, `.agent/skills`, and `data/harness/` for newly defined
  tags, flags, or tier systems.
- **Frequency:** Nightly/Weekly via Cron or Swarm Lifecycle event.
- **Resolution:** Any unmapped classifier discovered will trigger an
  `[INTEL:PENDING]` update to this document, awaiting Gate 5 clearance to
  formalize the new vocabulary across the fleet.

### Extended Class Modifiers

- `[CLASS:ALPHA]`, `[CLASS:BETA]`: Pre-release or experimental systems.
- `[CLASS:HYBRID]`: Combined human-agent synthesis artifacts.
- `[CLASS:OPS]`: Operational instructions or runtime manifests.
- `[CLASS:RAW]`: Untouched, unvetted raw intake data.
- `[CLASS:SRC]`: Source code blueprints or context windows.
- `[CLASS:REPORT]`: Summaries or telemetry readouts.

### Extended Status Modifiers

- `[STATUS:VETTED]`: Approved for integration but not yet active.
- `[STATUS:ARCHIVED]`, `[STATUS:LEGACY]`: Outdated or superseded (but kept for
  Merkle history).
- `[STATUS:PURGE]`: Flagged for destruction by the Non-Destructive Pruning
  Protocol.
- `[STATUS:CANDIDATE]`, `[STATUS:PROPOSED]`: Draft stage logic.
- `[STATUS:IMPLEMENTED]`, `[STATUS:RESOLVED]`: Finished task/issue states.
- `[STATUS:SYNCHRONIZED]`: Successfully pushed to remote and logged in Handoff.
- `[STATUS:VERIFIED-INTERACTIVE]`: Validated via HITL (Human-in-the-loop).
- `[STATUS:FINDINGS]`: An output state for investigation tasks.
- `[STATUS:APPLIED_OUT_OF_BAND]`: Manually applied by the operator outside
  normal swarm flows.

### Extended Doc Types

- `[DOC_TYPE:ARCHITECTURE_DOCTRINE]`, `[DOC_TYPE:ARCHITECTURE_RECONCILIATION]`
- `[DOC_TYPE:AUDIT_REPORT]`, `[DOC_TYPE:audit]`, `[DOC_TYPE:INVESTIGATION]`
- `[DOC_TYPE:CHALLENGE_EVENT]`, `[DOC_TYPE:CHALLENGE_RATIONALE]`
- `[DOC_TYPE:COHESION_GAP]`
- `[DOC_TYPE:EVOLUTION_LOG]`, `[DOC_TYPE:HANDOFF_REPORT]`,
  `[DOC_TYPE:SESSION_SUMMARY]`
- `[DOC_TYPE:OPS_NOTE]`, `[DOC_TYPE:PROTOCOL_RUNBOOK]`
- `[DOC_TYPE:ORIENTATION]`, `[DOC_TYPE:TECHNICAL_DOSSIER]`
- `[DOC_TYPE:CURATOR_QUESTION]`
