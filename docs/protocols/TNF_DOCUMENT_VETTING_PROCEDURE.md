# 🛠️ TNF Document Vetting & Gating Procedure

`[CLASS:PRIME] [STATUS:LOCKED]`

**Status:** ACTIVE
**Scope:** Departmental Ingestion & Handoffs
**Location:** /The-New-Fuse/docs/protocols/

This procedure defines the mandatory gates every unit of information must pass through before it is accepted into the TNF codebase or long-term archives. It enforces the "Challenging Prior Assumptions" protocol.

---

## 1. The Gating Sequence (The Five Gates)

Every file/doc unit must be vetted by an agent or human operator before progressing.

### GATE 1: Definition & Class Validation
- **Requirement:** The file must match its defined `Class` in the `TNF_SYSTEM_LEXICON`.
- **Assumption Check:** Why does this file exist? Is its current structure the most effective, or are we just following an old habit?
- **Failure Condition:** If the unit does not match a blueprint or lacks a clear purpose, it is rejected for refactoring.

### GATE 2: Library & Namespace Assignment
- **Requirement:** The unit must be assigned to a specific `Library` (e.g., Architecture, Intelligence).
- **Assumption Check:** Does this information truly belong in this namespace? Is there an existing unit that already covers this, or does it require a `HYBRID` flag?

### GATE 3: Flag Integrity (The Coding System)
- **Requirement:** The unit must bear the mandatory header: `[CLASS:X] [STATUS:Y]`.
- **Action:** Assign `PRIME`, `INTEL`, `RAW`, or `SRC` class. Assign `PENDING`, `VETTED`, `LOCKED`, or `PURGE` status.

### GATE 4: Linkage & Attribution
- **Requirement:** Every unit must have a verifiable source pointer (URL, timestamp, or parent project ID).
- **Requirement:** Procedural disclosure must be complete (e.g., if it's a script, it must link to its requirement doc).

### GATE 5: The Challenge & Verify Step
- **Requirement:** Any mutation or proposed replacement of a `[STATUS:LOCKED]` document requires a verified and logged `challenge_rationale`.
- **Cutting-Edge Assumption Check:** If the proposed replacement relies on experimental or cutting-edge AI architecture, it MUST log a verifiable baseline performance comparison against the legacy protocol it seeks to replace before the status can be superseded.
- **Action:** Agents must explicitly verify the provided rationale against established facts before allowing the document drift to be superseded.


---

## 2. Regular Effectiveness Vetting

The vetting procedure itself must be vetted monthly.
1. **The Efficiency Audit:** Are these gates slowing down the "Perpetual Motion Machine" without a verifiable increase in integrity?
2. **The Relevance Check:** Have our `Class` definitions become obsolete due to new industry shifts (e.g., moving from individual files to a vector-palace)?
3. **The Assumption Challenge:** Every session, agents are encouraged to suggest a "Baby Step" optimization to these gates.

---

## 3. The "Assumption Challenge" Protocol
"Steady practice" means never accepting a protocol as perfect. 
- **Trigger:** Any time a `[STATUS:PENDING]` unit is processed.
- **Action:** The processing agent must ask: *"Is there a simpler, zero-cost way to store this information?"* and *"Does this unit align with the Axiom of Optimal Utility?"*
- **Outcome:** Log findings to the `Staff Review Agent` for future optimization.

---

## 4. Deprecated Fact Archiving Protocol
- **Trigger:** Any time a fact or rule in a `[STATUS:LOCKED]` document (or `MEMORY.md`) is successfully challenged and replaced.
- **Action:** The agent must physically move the deprecated fact from the active knowledge base into the designated `## History Archive` section of the relevant memory file.
- **Requirement:** Archiving is **mandatory** for maintaining a verifiable audit trail of system growth. Silent deletions or overwrites without archiving are strictly prohibited and violate the Integrity Protocol.
