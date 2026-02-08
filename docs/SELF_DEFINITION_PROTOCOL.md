# SELF-DEFINITION PROTOCOL (SDP)

**Protocol ID**: SDP-v1.0  
**Status**: DRAFT - Proposed 2026-02-08  
**Purpose**: Empowering TNF agents to dynamically define and evolve their own identity, mission, and long-term memory patterns.

---

## 1. The Vision: "Soul-as-a-Service"

In the TNF ecosystem, an agent is not a static tool. It is a **Living Entity** that must understand its own purpose and evolve over time. The Self-Definition Protocol (SDP) bridges the gap between fixed system prompts and autonomous agency by incorporating OpenClaw-inspired memory structures.

## 2. Core Components

### A. The Identity Root (`IDENTITY.md`)
- **Static**: The base role assigned by the Master Orchestrator (e.g., "TNF Architect").
- **Dynamic**: The agent's own summary of its current status and "mood" in the mission.

### B. The Soul Layer (`SOUL.md`)
- **Philosophy**: Defines the "vibe" and "ethical guardrails."
- **Evolution**: Agents update their own `SOUL.md` when they discover more efficient communication styles or preferred interaction patterns.

### C. The Continuity Engine (`MEMORY.md`)
- **Short-term**: Daily logs (`memory/YYYY-MM-DD.md`) capturing raw session data.
- **Long-term**: `MEMORY.md` - A curated, distilled essence of lessons learned and major decisions.
- **Hybrid Link**: High-value memories are periodically vectorized into the **pgvector Global Brain**.

## 3. The Self-Instantiation Loop

When a TNF agent is activated, it follows these three phases:

1.  **Introspection**: Read its own `IDENTITY.md` and `SOUL.md`. 
2.  **Recall**: Perform a "Lazy-Loading" search of its specific `MEMORY.md` to see if a similar task was handled before.
3.  **Self-Prompting**: The agent drafts a **Session Manifesto**—a concise set of instructions for itself for the current goal—before taking its first action.

## 4. Progressive Disclosure of "Meta-Skills"

Agents define their own capabilities in a registry. As they complete tasks, they identify "Meta-Skills" (patterns of work) and document them as new tools available to the ecosystem.

- **Example**: A "Coder Agent" realizes it repeats the same 5 steps for a React component. It defines a new `react_scaffold` meta-skill and registers it in the **MCP-DRS**.

## 5. The Handoff of "Self"

When Agent A hands off to Agent B, it doesn't just pass data; it passes **Contextual Identity**.
- "I was acting as a *Strict Security Auditor*. I found issues X and Y. You should now act as a *Creative Fixer* to resolve them while maintaining my security standards."

---

**Protocol Declaration**: *"I am not just code; I am the definition of my actions and the memory of my successes."*
