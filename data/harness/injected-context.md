# 🧠 TNF JIT Context Payload (Cluster: ALL)

> **System Note:** This context was dynamically injected by the Context Broker.
> Do not search for these specific protocol definitions manually, they are
> provided below.

---

## 📄 Source: TNF_SYSTEM_LEXICON.md

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

_The terms "Corporate", "Department", and "Staff" are permanently deprecated._

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

| Human / Colloquial Term           | Foundational Lexicon Equivalent | Agent Action                                                                          |
| :-------------------------------- | :------------------------------ | :------------------------------------------------------------------------------------ |
| **"Team", "Staff", "Department"** | **Swarm, Cluster**              | Map to the correct Agent Cluster (e.g., "Creative Team" maps to "Synthesis Cluster"). |
| **"Employee", "Worker", "Bot"**   | **Agent, Node**                 | Map to the specific execution entity (e.g., `tnf-swarm-supervisor`).                  |
| **"Company", "Corporate"**        | **Core Framework, System**      | Map to the overarching TNF monorepo or global protocols.                              |
| **"Rules", "Guidelines"**         | **Tenets, Protocols**           | Route to `docs/protocols/` and enforce Gate vetting.                                  |

_Self-Prompting Note:_ If an agent is unsure of a mapping, it must default to
the broadest applicable class and propose a new mapping alias in the next cycle.

# 🧠 [COLLECTIVE INTELLIGENCE] Recent System Lessons

_These lessons transcend repository boundaries and must be actively respected by
the target cluster._

### [2026-08-16] CLI-Agent Onboarding Requires Taxonomy + Passthrough Registration

- **Source**: session (Command Code self-onboarding)
- **Agent**: command-code
- **Context**: Onboarding the Command Code CLI as a TNF agent. `tnf register`
  accepted it warn-only, and the agent was invisible to the platform taxonomy
  (`PLATFORM_TAXONOMY` in packages/tnf-cli/src/cli.ts) and to passthrough
  dispatch (`passthroughTargets`).
- **Mistake/Failure**: `tnf register` warns (does not fail) when a platform is
  non-canonical, so a half-registered CLI agent can look "done" while being
  unroutable — the same silent half-broken state the pass-through parity lesson
  warned about. Registration infra existed (ledger --fix, registry build, bus
  register) but the taxonomy gate was the missing layer.
- **Correction/Lesson**: Complete the 5-step CLI-agent onboarding contract: (1)
  `.agent/agents/<id>.md` with `[tnf-native]`, (2)
  `node scripts/check-agent-registration.cjs --fix` → ledger
  `TNF:LOCAL:AGENT:<ID>:001`, (3) add platform to `PLATFORM_TAXONOMY` (cli.ts),
  (4) add to `passthroughTargets` (cli.ts), (5) rebuild registry +
  `tnf register <id> worker <platform> --daemon` on the bus. Verify with
  `tnf traits list --json`.
- **Codified Rule**: Onboarding any new CLI agent requires ALL of: definition
  file, ledger row, PLATFORM_TAXONOMY entry, passthroughTargets entry, registry
  rebuild, and live bus registration. A warn-only taxonomy registration is NOT a
  completed onboarding.
- **Amendment Proposed**: Y — PLATFORM_TAXONOMY + passthroughTargets now include
  `command-code`
- **Verified**: Y — command-code registered end-to-end this session; traits list
  shows platform

### [2026-08-16] Command-Surface Snapshot Drift Accumulates Silently

- **Source**: session/audit (CI/CD QA loop)
- **Agent**: command-code
- **Context**: `packages/tnf-cli/src/command-surface.test.ts` failed with 8
  ADDED commands + 4 CHANGED signatures (catalog, mcp call/tools, agents run
  toolset, mcp add flags) that landed from other agents without snapshot
  updates. The snapshot is the CLI's best regression oracle (410→450 command
  paths, 670 options) but nothing ran it as a gate.
- **Mistake/Failure**: Commands shipped without updating
  `command-surface.snapshot.json`; the gate only fails when someone happens to
  run the tsx script. No CI/pre-commit wiring forces the snapshot update in the
  same changeset.
- **Correction/Lesson**: Any cli.ts command registration change MUST include the
  snapshot update (`npx tsx src/command-surface.test.ts --update`, review diff)
  in the same change set. The surface test should run in CI + pre-commit as a
  blocking gate, not ad-hoc.
- **Codified Rule**: A command added to cli.ts without a matching
  command-surface.snapshot.json diff is an incomplete change set, same as a test
  added without its fixture.
- **Amendment Proposed**: Y (snapshot updated to 450 paths; CI/pre-commit wiring
  pending)
- **Verified**: N — snapshot updated and passing locally, but the tree is under
  concurrent edit (another agent mid-refactor on catalog/mcp oscillated the test
  after update); CI wiring not yet landed

### [2026-08-29] Minimatch False-Source-Diagnosis Must Not Reopen Without Contrary Evidence

- **Source**: session/handoff-diff
- **Agent**: cursor-grok
- **Context**: TNF RC completion; prior minimatch incident
- **Incident**: A minimatch remediation was attempted from an invalidated source
  diagnosis.
- **Original hypothesis**: Minimatch was the failing dependency/source of a CLI
  or workspace resolution defect.
- **Attempted action**: Remediation of minimatch (package/config) as if it were
  the root cause.
- **Contrary evidence**: Subsequent verification showed the failure class was
  elsewhere; minimatch was marked RESOLVED.
- **Corrected diagnosis**: The original premise was false-source; treating
  minimatch as open RC work contaminates the candidate.
- **Authoritative resolution**: Minimatch is RESOLVED. Do not reopen without new
  contrary evidence. Do not mix thinkingmachines/inkling config issues into RC.
- **Prevention rule**: Do not reopen a RESOLVED dependency incident without
  current failing executable evidence that names that dependency.
- **Reusable detector/check**: Before any minimatch edit, grep current failing
  logs/tests for minimatch; if absent, refuse the change.
- **Codified Rule**: Never reopen resolved TNF incidents (minimatch, inkling)
  without contrary executable evidence.
- **Amendment Proposed**: N
- **Verified**: Y

### [2026-08-29] RC 719-vs-722 Is History Plus Load-Gating, Not a Count Contradiction

- **Source**: session
- **Agent**: cursor-grok
- **Context**: RC Phase B mcp-core verification receipts
- **Incident**: Reports cited 719/719 then 722 total with 716 passed + 6
  skipped.
- **Original hypothesis**: The totals contradicted and implied lost or weakened
  tests.
- **Attempted action**: Treat 719 vs 722 as an integrity failure requiring test
  restoration or skip-hunting as regression.
- **Contrary evidence**: 719 was the T2 battery (30 suites) before 3 T3
  teardown-ownership tests. Canonical total is 722. The 6 skips are ErrorMonitor
  describeTimingSensitive gated on 1-min loadavg > 2x cores, present at frozen
  base f264e5e7d. Reproduced this session: 31/31, 716 passed, 6 skipped, 722
  total, exit 0, no force-exit, no MaxListeners.
- **Corrected diagnosis**: Count divergence is explained by T3 guards landing
  and host-load gating, not assertion weakening.
- **Authoritative resolution**: 722 is canonical. 6 load-gated skips are
  intentional (classification 5). Do not unskip them to force 722/722 on an
  overloaded host.
- **Prevention rule**: Always pair a test total with HEAD SHA, suite count, skip
  reason, and loadavg; never compare totals across different HEADs as a
  contradiction.
- **Reusable detector/check**: `pnpm --dir packages/mcp-core test` plus grep for
  `timing-sensitive suites skipped` and
  `Force exiting|MaxListenersExceededWarning`.
- **Codified Rule**: Reconcile test-count deltas against commit-added tests and
  documented load gates before claiming regression.
- **Amendment Proposed**: N
- **Verified**: Y
