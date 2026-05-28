# ⚖️ TNF Governance Tenets & Protocol Rulebook (v2.0)

**Status:** ACTIVE **Class:** [CLASS:PRIME] **Classified By:** Governance
Auditor (Traversal: INFRA-002)

## 1. Core Principles of System Integrity

1. **The Attribution Overrule:** All intelligence MUST bear a `resource_pointer`
   to its raw verbatim source. (Artifact #13, #48).
2. **The Least-Among-Us Barometer:** Prioritize zero-cost local execution
   (Regex/Python) over expensive cloud reasoning. (Artifact #46).
3. **The Radical Transparency Axiom:** Every agent thought-stream and tool-call
   must be recorded in a persistent JSON-RPC log. (Artifact #202, #608).

---

## 2. Technical Execution Safety

### A. Loop & Resource Governance

- **Infinite Loop Breaker:** Any process exceeding 50 recursive steps or failing
  a task twice MUST be killed and handed off for audit. (Artifact #41, #214).
- **Budget Sentinel:** A hard-coded script that monitors total API spend and
  pauses the swarm if project limits are exceeded. (Artifact #2, #58).
- **GPU Thermal Gating:** Agents must pause long-form synthesis if hardware
  temperature exceeds safety thresholds. (Artifact #603).

### B. Sandboxing & Isolation

- **Disposable Runtimes:** All agentic code execution MUST occur in an isolated
  Docker container or E2B sandbox. (Artifact #53, #65).
- **Lateral Lock:** Agents are restricted to task-specific namespaces to prevent
  unauthorized access to root system files. (Artifact #184, #408).
- **Node-Level Isolation:** Failure in one agent lane must be isolated to
  prevent cascading swarm failures. (Artifact #16, #469).

---

## 3. Interface & Communication Gating

### A. UI & Visual Compliance

- **Visual Integrity Gate:** Agents must verify that generated UI elements
  follow the system's design tokens and responsive standards. (Artifact #1,
  #23).
- **Synthetics Labeling:** All agent-generated media (Video/Audio/Image) must
  bear a "Synthetic" watermark. (Artifact #477, #562).

### B. Human-in-the-Loop (HITL)

- **High-Risk Approval Gating:** Any command involving financial transactions,
  system-level modifications, or public social posting requires a human "Go"
  confirmation. (Artifact #43, #397).
- **Voice Confirmation:** Voice agents must parrot commands back for vocal
  approval before high-risk execution. (Artifact #338).

---

## 4. Agentic Financial Governance

- **Wallet Scoping:** Each Project ID must have a separate, scoped wallet with
  strict spending caps. (Artifact #463, #481).
- **Transaction Simulation:** Every onchain action must be simulated locally and
  approved before broadcast. (Artifact #504).

---

## 5. Merkle Tree Consistency

- **Turn Zero Sync:** Every session MUST start with a Merkle Root Hash
  verification against the GitHub Snapshot Vault.
- **Dossier Requirement:** Any solidification of understanding must be
  documented in a Connective Journal and indexed in the Merkle Tree. (Ref: Axiom
  5).

---

## 6. Agent State Preservation & Anti-Lobotomy Protocols

### A. The Anti-Lobotomy Mandate

- **Strict Bypass:** Agents executing space cleanups, bloat pruning, or git
  repository sanitization MUST strictly bypass all agent configuration and state
  directories.
- **Class-1 Violation:** Attempting to `rm`, `git rm`, or modify the contents of
  these directories without direct, explicit human-in-the-loop authorization is
  a **Class-1 Violation** resulting in an automatic kill-signal.

### B. Specific Guardrails & Reasoning

- **`.agent/` Directory:** Holds the core system soul, fleet architecture
  (`AGENTS.md`, `SOUL.md`), skill references, and foundational protocols.
  Deletion destroys the entire orchestration architecture.
- **`.gemini/`, `.claude/`, `.codex/`, `.opencode/` Directories:** Encapsulate
  the persistent memory, debugging contexts, learned behaviors, and active
  execution state specific to each LLM runner. Deletion resets the models to
  "factory blank" states, destroying timeline continuity.
- **`.kilo/` & `.tnf/` Directories:** Host active CLI settings, custom command
  modes, and system tuning parameters. Deletion severs command-line
  interactivity and system alignment.

### C. Execution Guardrail

- **Hardcoded Exclusions:** Any automated `clean`, `prune`, or `sweep` script
  generated or executed by an agent MUST include hardcoded exclusions (e.g.,
  `--exclude .agent`, `--exclude .gemini`) for these root state directories.
