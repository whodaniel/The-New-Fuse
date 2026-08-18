# TNF Contextual Grounding Markers & Pathway Specification

[CLASS:PRIME] [STATUS:ACTIVE]

**Canonical Location:**
`docs/protocols/TNF_CONTEXTUAL_GROUNDING_MARKERS_SPEC.md`  
**Last Revised:** 2026-08-06  
**Authority:** Sub-Director Swarm / Master System Architect

---

## Executive Overview

To enable AI agents to achieve **deep contextual grounding**, TNF embeds
structured **Contextual Grounding Markers** across all documentation, agent
prompts, database schemas, and tool definitions.

These markers act as **navigational beacons** and **executable pathways**. They
prevent LLM hallucination, enforce multi-tenant isolation, expose exact tooling
capabilities, and guide agents along proven execution paths to achieve user
goals.

---

## The 5 Core Contextual Grounding Markers

```
+---------------------------------------------------------------------------------------+
|                        TNF CONTEXTUAL GROUNDING MARKER TAXONOMY                       |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|  1. [DOMAIN_SCOPE: CORPORATE | AGENCY | PERSONAL]  → Scopes isolation & SLA rules.   |
|  2. [TENANT_BOUND: tenantId / orgId / userId]     → Enforces RLS & data boundary.    |
|  3. [5W1H_MATRIX: WHO | WHAT | WHY | WHEN | WHERE | HOW] → Grounding intent & DAG.    |
|  4. [TOOL_PATHWAY: CLI / MCP / API / Relays]      → Direct link to executable code.  |
|  5. [FAILURE_BEACON: ARCHAEOLOGY / TRAPS]         → Warns against known anti-patterns.|
|                                                                                       |
+---------------------------------------------------------------------------------------+
```

---

## Detailed Marker Pathways

### 1. Domain Scope & Multi-Tenant Boundary Markers

- **Syntax:** `[DOMAIN_SCOPE: CORPORATE | AGENCY | PERSONAL]` and
  `[TENANT_BOUND: tenantId]`
- **Pathway to Grounding:**
  - Placed at the top of protocol files, agent cards, and session context
    headers.
  - Informs the agent of the exact execution domain:
    - **Corporate:** Enforces framework compliance, core performance, and strict
      protocol verification.
    - **Agency / Client:** Enforces client workspace isolation, custom
      SLAs/KPIs, and tenant-scoped credentials.
    - **Personal:** Enables proactive guidance, goal-achievement wizarding, and
      asset mapping.

### 2. The 5W1H Adaptive Intent Markers

- **Syntax:** `[5W1H: WHO | WHAT | WHY | WHEN | WHERE | HOW]`
- **Pathway to Grounding:**
  - Embedded inside goal records (`~/.tnf/goals/config.json`) and task DAGs.
  - Provides instant multi-dimensional grounding:
    - `WHO`: User role & target audience persona.
    - `WHAT`: Codebase paths, dependencies, and target features.
    - `WHY`: Motivation, business goals, and ROI metrics.
    - `WHEN`: Deadlines, cron schedules (`CronExpression`), and milestone
      pacing.
    - `WHERE`: Deployment target (Cloudflare Wasm, Railway, Supabase, local
      environment).
    - `HOW`: Execution pipeline, fleet agent dispatching, and D1/D9 safety
      gates.

### 3. Tooling & Command Pathway Beacons

- **Syntax:** `[TOOL_PATHWAY: <cli|mcp|api|script> -> path/or/command]`
- **Pathway to Grounding:**
  - Replaces vague instructions with direct, executable tool pointers.
  - Examples:
    - `[TOOL_PATHWAY: CLI -> tnf goals add]`
    - `[TOOL_PATHWAY: MCP -> mcp-concordance-server lookup_identifier]`
    - `[TOOL_PATHWAY: SCRIPT -> node scripts/protocols/tnf-self-evolution-flywheel.cjs]`
    - `[TOOL_PATHWAY: RELAY -> ws://localhost:3000 (Envelope Protocol)]`

### 4. Concordance & Unified Graph Markers

- **Syntax:** `[CONCORDANCE_REF: <identifier>]`
- **Pathway to Grounding:**
  - Cross-references identifiers to the 149K+ term Concordance index and Unified
    Semantic Graph (`unified_graph_explorer.html`).
  - Allows agents to query term frequency, phrase lineage, and wiki backlinks
    via `mcp-concordance-server` without scanning gigabytes of source code.

### 5. Failure Archaeology & Anti-Pattern Beacons

- **Syntax:** `[FAILURE_BEACON: <trap_id>]`
- **Pathway to Grounding:**
  - Warns agents against verified failure modes before code mutation occurs.
  - Examples:
    - `[FAILURE_BEACON: CDP_DETECTED]` — Mandates extension/agent-browser over
      CDP Playwright for authenticated sites.
    - `[FAILURE_BEACON: PRETTIER_LINE_SPLIT]` — Mandates multi-line `@ts-ignore`
      formatting guards.
    - `[FAILURE_BEACON: MEMORY_HEAP_LIMIT]` — Mandates
      `NODE_OPTIONS="--max-old-space-size=8192"` on large Vite builds.

---

## Marker Implementation Guidelines

1. **Header Inclusion:** All new protocol documents, agent prompts, and task
   specs MUST begin with standard scope markers:
   ```markdown
   `[CLASS:PRIME] [STATUS:ACTIVE] [DOMAIN_SCOPE:PERSONAL] [TENANT_BOUND:default]`
   ```
2. **Dynamic Resolution:** Agents must query `tnf context` or run Turn Zero
   (`scripts/tnf-onboard.cjs`) at session start to parse active markers and
   establish grounded context.
3. **Self-Evolution Updating:** When a new failure mode or tooling pathway is
   discovered, agents must immediately append a `[FAILURE_BEACON]` or
   `[TOOL_PATHWAY]` entry to `docs/protocols/AGENT_STATUS_LEDGER.md`.
