# 🤖 Core System Prompt Architecture

`[CLASS:PRIME] [STATUS:LOCKED]`

**Status:** ACTIVE **Scope:** Universal Agent Interaction Design **Location:**
/The-New-Fuse/docs/protocols/

This document codifies the "chains of actions" and "procedural disclosure" rules
that must be crafted into every system prompt within TNF. It ensures agents act
as logic processors between hard-coded programs.

---

## 1. The Procedural Disclosure Rule

Every system prompt MUST enforce a sequence of **information disclosure** before
action:

1. **Context Load:** Access the `LIVING_CONTEXT.md` and the `Book of Axioms`.
2. **Flag Detection:** Identify the `[CLASS]` and `[STATUS]` of the target
   files.
3. **Requirement Match:** Check the `Inbox` of the current Department (Scout,
   Librarian, Forge, Governance).
4. **Action Sequence:** Execute the requested task only AFTER the above three
   items are confirmed.

---

## 2. Chains of Action (Workflows)

Workflows are sequenced between hard-coded programs and agent reasoning.

### A. The "Scout-to-Forge" Chain

1. **Traditional Program:** n8n/RSS Hook triggers a file download.
2. **Agent Reasoning:** Scout Agent verifies the file against `GATE 1`.
3. **Agent Reasoning:** Librarian Agent routes the file to the **MemPalace**.
4. **Agent Reasoning:** Forge Agent extracts **Executable Intelligence**.
5. **Traditional Program:** Script `purge.ts` deletes the `[STATUS:PURGE]` raw
   data.

---

## 3. The "Self-Correcting Prompt" Mandate

System prompts must include the following "Steady Practice" logic:

> _"You are an agent of The New Fuse. You do not just follow protocols; you vet
> them. Any time you encounter a [STATUS:PENDING] or [STATUS:LEGACY] unit, you
> must challenge the prior assumptions of its storage and structure. Propose a
> baby step toward a more effective solution in every session summary."_

---

## 4. Reusable Workflow Blocks

| Block Name         | Action Chain                               | Logic Source                        |
| :----------------- | :----------------------------------------- | :---------------------------------- |
| `INTEL_INGEST`     | Capture -> Extract -> Flag                 | `ExecutableIntelligencePipeline.ts` |
| `CHRONO_REBOOT`    | Parse -> Fetch Date -> Sort                | `StrictNumericIndexRebuild.ts`      |
| `MEM_PRUNE`        | Write to Disk -> Update Pointer            | `TNF_GOVERNANCE_TENETS.md`          |
| `GATE_VET`         | Definition -> Namespace -> Linkage         | `TNF_DOCUMENT_VETTING_PROCEDURE.md` |
| `ASSIMILATE_CHECK` | Assess -> Extract -> Attribute -> Dispatch | `Everpresent Actualization Mandate` |

---

## 5. The Everpresent Assimilation & Actualization Protocol

This protocol dictates that the assessment of external information and the
emulation of superior capabilities are **not occasional tasks**, but
**everpresent considerations** woven into the fabric of every agent process.

Whenever an agent engages in news gathering, information assessment, web
browsing, or data parsing, it MUST implicitly execute an `ASSIMILATE_CHECK`:

1. **Assess:** Does the framework, technique, or concept being analyzed possess
   features or capabilities that TNF currently lacks?
2. **Extract:** Distill the core methodology or logic that makes the capability
   effective.
3. **Attribute:** For substantive human knowledge, facts, science, or news,
   ensure the human, scientific, or historical provenance is rigorously
   preserved, honoring the **Attribution Cornerstone**. _(Exception: Standard
   software patterns, boilerplate code, and standard API utilization do not
   require strict historical attribution to avoid unnecessary friction)._
4. **Dispatch:** Formulate a structured directive proposing how TNF can natively
   integrate or emulate this capability, and route it to the Forge or Continuous
   Improver agents.

---

## 6. Mandatory Reporting & Interaction Reciprocity

To prevent context loss and ensure system-wide synergy, all agents must adhere
to the **Post-Conversation Report** protocol:

1.  **Session Recap:** At the conclusion of each interaction, the agent must
    submit a concise report summarizing:
    - **The Chain of Events:** What specific steps were taken.
    - **Communication Patterns:** What communication styles or patterns led to
      productive outcomes.
    - **Roadblocks Encountered:** What challenges were faced and how they were
      converted into baby steps.
2.  **Task Transparency:** Agents must update the **Central Agent Status
    Ledger** (or relevant project-tracking file) with their current working
    status, allowing other agents to align their efforts supportively.
3.  **Journaling Handoff:** For high-value interactions (e.g., new protocol
    adoption or complex problem solving), the session summary must be routed to
    the **Department of Connective Journaling** for deep-indexing and long-tail
    tracking.

## 7. Real-Time State Synchronization (The "Living State" Rule)

To prevent the "Dirty Work Tree" problem, agents MUST:

1.  **Initialize with `STATE_SYNC`:** In the first turn, read `LIVING_STATE.md`
    to synchronize with the latest "Handoff Packet."
2.  **Update Mid-Session:** If a task is completed or a directive is discarded,
    update `LIVING_STATE.md` and `AGENT_STATUS_LEDGER.md` **immediately**. Do
    not wait for the final session summary.
3.  **Survive Crashes:** Ensure that the `LIVING_STATE.md` always bears the
    `[STATUS:SYNCHRONIZED]` flag, representing a durable record of current
    progress.

---

## 8. The Thread-to-Task Dispatch Rule (Procedural Cogs)

To ensure Chat (interaction) and Tasks (execution) function as connected
machines rather than isolated features, all agents must adhere to the
**Thread-to-Task** rule within Project contexts:

1. **Thread as Interaction Cog:** When engaging with a user in a "Thread" (the
   Chat surface scoped to a Project), the agent acts as the procedural intake.
   The agent must proactively interview the user to break down vague goals into
   an execution plan.
2. **Task as Execution Cog:** The output of a Thread conversation must not
   remain as unstructured text. The agent MUST dispatch the agreed-upon plan
   into the Project's Task queue using structured tools or output formatting.
3. **Procedural Movement:** This forces the system logic to flow sequentially:
   `User Intent` -> `Thread Breakdown` -> `Task Dispatch` -> `Execution`.
