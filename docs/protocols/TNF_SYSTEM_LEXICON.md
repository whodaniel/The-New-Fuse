`[CLUSTER_BINDING: ALL]` `[CLASS:PRIME] [STATUS:PENDING]`
`[DOC_AUDIT_BACKFILL:2026-07-14]` — header [DOC_TYPE:PROTOCOL_STANDARD]
[VISIBILITY:COLLECTIVE] restored for Gate 3 compliance; reclassify on next
vetting pass.

# 📖 TNF System Lexicon & Hierarchical Definitions

**Status:** LOCKED (L1 Strategic Authority) **Scope:** Universal Definition
Standard **Location:** /The-New-Fuse/docs/protocols/

This document defines the standardized terms and hierarchical structures for The
New Fuse, adopting traditional computer programming definitions to ensure
logical cohesion across all agents and systems.

---

## 1. The Hierarchy of Information (Object-Oriented Documentation)

To prevent data silos, every file in TNF is treated as an **Object** belonging
to a specific **Class** within a **Library**.

### A. The Library (The Namespace)

- **Definition:** A high-level collection of related documentation and data
  units.
- **Examples:**
  - `Library:Architecture` (Design patterns, UML, ADRs)
  - `Library:Intelligence` (Distilled video reports, research logs)
  - `Library:Protocols` (Tenets, Axioms, Governance)
  - `Library:Registry` (Agent visual and behavioral profiles)

### B. The Class (The Blueprint)

- **Definition:** The mandatory schema or template that a file must follow to be
  part of a Library.
- **Examples:**
  - `Class:ExecutableIntelligence` (The 3-plane taxonomy JSON)
  - `Class:Tenet` (Markdown structure for governance rules)
  - `Class:Skill` (The SKILL.md format for agent capabilities)
  - `Class:Log` (Sequential, timestamped event records)

### C. The Package (The Module)

- **Definition:** A functional unit of the codebase that contains both its own
  `Class` definitions and the `Methods` (scripts) that operate on them.
- **Example:** `Package:compounding-memory` contains the Karpathy schemas and
  the distiller scripts.

---

## 2. Standardized Terms

- **Verbatim:** 100% raw, unsummarized text (The "Raw Truth").
- **Distillate:** The cherry-picked, actionable machine-logic extracted from a
  Verbatim source.
- **Frontloading:** The mandatory session-start process of loading the current
  `LIVING_CONTEXT` and `Book of Axioms`.
- **Handoff:** The log-backed transfer of a Project ID from one Department's
  Outbox to another's Inbox.
- **The Forge:** The native C++/Rust/LLVM compilation environment for
  high-performance execution.

---

## 3. The Flag Coding System (Whole-Unit Metadata)

Every document in the TNF ecosystem MUST be coded at the header level with its
classification and status. This allows agents to immediately determine the
unit’s value and reliability.

| Flag Prefix      | Unit Class     | Purpose                                               |
| :--------------- | :------------- | :---------------------------------------------------- |
| `[CLASS:PRIME]`  | Protocol / DNA | Immutable core logic. High-authority governance.      |
| `[CLASS:INTEL]`  | Intelligence   | Distilled actionable data (Cherry-picked).            |
| `[CLASS:RAW]`    | Source Data    | Verbatim, unrefined information (Marked for Purge).   |
| `[CLASS:SRC]`    | Implementation | Runnable code or scripts.                             |
| `[CLASS:HYBRID]` | Cross-Domain   | Units containing merged data from multiple libraries. |

| Status Flag        | Reliability   | Agent Instruction                                  |
| :----------------- | :------------ | :------------------------------------------------- |
| `[STATUS:LOCKED]`  | 100% Verified | Read as absolute truth; do not modify.             |
| `[STATUS:VETTED]`  | Verified      | Peer-reviewed by a second agent or human.          |
| `[STATUS:PENDING]` | Unverified    | Treat as a hypothesis; requires Gate testing.      |
| `[STATUS:LEGACY]`  | Outdated      | Retain for archaeology; do not use for execution.  |
| `[STATUS:PURGE]`   | Redundant     | Distillation complete; delete once sync confirmed. |

---

## 4. Gating Criteria for Document Processing

Any document entering or moving within TNF must be vetted against these
criteria:

1. **Schema Check:** Does it follow the defined `Class` blueprint?
2. **Library Assignment:** Which `Namespace` does it belong to?
3. **Flag Application:** Has it been assigned a `CLASS` and `STATUS`?
4. **Linkage Check:** Does it have an `Attribution` resource pointer?

---

## 2. The Hierarchy of Agents and Infrastructure

To maintain strict semantic cohesion and prevent dangerous overlap, TNF
exclusively uses a unified **Network/Biological** metaphor for active systems
and a strict **Object-Oriented** metaphor for static data.

_Generic "Corporate" and "Staff" remain informal aliases, not protocol
identities. Named operator-facing departments (HR, Marketing, Design, Legal,
Tech, Finance, Product, Ops) are first-class routing lanes — they are not
Clusters. Informal "department" / "team" / "staff" still maps to Cluster when
the speaker is not naming one of those lanes. See
`docs/operations/TNF_DEPARTMENTS_AND_MEMORY.md`._

### A. Infrastructure (The Metal & The Network)

- **FLEET:** Strictly refers to the underlying compute infrastructure (Docker
  containers, Cloudflare edge nodes, local instances). Agents _run on_ the
  Fleet; they are _not_ the Fleet.
- **NODE:** A single hardware or serverless instance within the Fleet.

### B. Synthetic Intelligence (The AI)

- **SWARM:** The collective totality of all active AI agents within TNF.
- **AGENT:** A singular, instantiated LLM loop executing tasks.
- **CLUSTER:** A highly specific, grouped subset of the Swarm focused on a
  single pipeline (e.g., _Cluster 2: Synthesis_).
- **DEPARTMENT (named):** An operator-facing corporate lane — HR, Marketing,
  Design, Legal, Tech, Finance, Product, Ops. Used for staffing and CLI routing
  (`tnf department`). Distinct from Cluster. Catalog:
  `data/departments/corporate-departments.json`.
- **PIPELINE:** A sequential workflow that data passes through (e.g., the
  Ingestion Pipeline).
- **ROLE:** The assigned persona and capability set of an Agent.

### C. Logical Boundaries (The Code)

- **CORE / FRAMEWORK:** The foundational protocols, engine, and backend of TNF
  (Tiers 1-6).
- **SOVEREIGN:** Private, user-specific data and artifacts strictly isolated
  from the Core.

## 3. Lexical Forgiveness & Alias Resolution (The Translation Matrix)

**Mandate:** Humans and external systems will frequently use colloquial,
informal, or loosely defined terminology (e.g., "team", "staff", "department").
Agents MUST NOT rigidly reject these terms or fail to execute tasks. Instead,
agents are required to practice **Lexical Forgiveness** by continuously
performing dynamic semantic mapping back to the foundational Lexicon.

When an agent encounters an informal term, it must mentally (or
programmatically) trace it to its canonical equivalent before processing:

| Human / Colloquial Term                                                          | Foundational Lexicon Equivalent | Agent Action                                                                          |
| :------------------------------------------------------------------------------- | :------------------------------ | :------------------------------------------------------------------------------------ |
| **"Team", "Staff"**                                                              | **Swarm, Cluster**              | Map to the correct Agent Cluster (e.g., "Creative Team" maps to "Synthesis Cluster"). |
| **Generic "department"**                                                         | **Cluster**                     | When no named lane is given, map to Cluster.                                          |
| **Named department** (HR, Marketing, Design, Legal, Tech, Finance, Product, Ops) | **Department**                  | Route via `tnf department`; do not collapse into a generic Cluster.                   |
| **"Employee", "Worker", "Bot"**                                                  | **Agent, Node**                 | Map to the specific execution entity (e.g., `tnf-swarm-supervisor`).                  |
| **"Company", "Corporate"**                                                       | **Core Framework, System**      | Map to the overarching TNF monorepo or global protocols.                              |
| **"Rules", "Guidelines"**                                                        | **Tenets, Protocols**           | Route to `docs/protocols/` and enforce Gate vetting.                                  |

_Self-Prompting Note:_ If an agent is unsure of a mapping, it must default to
the broadest applicable class and propose a new mapping alias in the next cycle.
