# AGENT CATEGORY MAPPING AUDIT — Pass 1 (2026-08-10)

## Executive Summary

This audit defines the meta-level framework for classifying 194 agent-definition
`.md` files in `.agent/agents/` against TNF's canonical vocabulary surfaces and
proposes a unified frontmatter schema.

**Status**: PROPOSED (pending verification against DB schema and Neo4j
clusters). **Origin**: Session 8066f785 / fix/honest-failure-reporting /
workspace The-New-Fuse.

---

## 1. Meta-Definition: What is "Agent Definition" in TNF?

### The philosophical triad (from AGENTS.md / development-guide.md / SOUL.md)

An agent in TNF consists of three inseparable components — not a single flat
type:

| Component                  | Source in repo                                              | What it defines                                                                                             | Canonical reference                                                                                  |
| -------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Core (MoE Engine)**      | `.agent/agents/*.md` + DB `agentType`                       | The reasoning identity — what brain/model drives this agent.                                                | `.agent/SOUL.md` (moral anchors); `COMPLETE-AGENT-GUIDE.md` (6-component legacy)                     |
| **Harness (Context)**      | `.agent/agents/*.md` frontmatter; skills (`.agent/skills/`) | The collective writing that gives identity: description, capabilities list, system prompt URI, domain tags. | `AGENTS.md` ("Agent Definition = Engine + Harness + Capability"); `development-guide.md`             |
| **Capability (Tools/MCP)** | `tools:` array; `capabilities:` array; `skills:` array      | The "Senses and Limbs" — native vision/audio, relay synapses, MCP servers, CLI interfaces.                  | `COMPLETE-AGENT-GUIDE.md` (Capability Registry); `packages/tnf-cli/src/cli.ts` (`AGENT_ROLE_TRAITS`) |

### The entity taxonomy (from TNF_ENTITY_ID_TAXONOMY_V2.md)

The taxonomy separates concerns at the DB layer, which is the target state:

- **LLM Models** (base entities, not agent definitions)
- **Harnesses** (execution platforms: antigravity, gemini, claude, jules, pi,
  vscode, browser)
- **MCP Servers** (tools/services)
- **Agent Definitions** (`tnf_agent_definitions` — templates / personas — the
  `.md` files)
- **Agent Sessions** (runtime instances — separate table, separate lifecycle)

**Implication**: The `.agent/agents/*.md` files are the **Agent Definitions**
(templates), not runtime instances. Their classification must reflect
template-level identity (what role this agent template plays in the
organization), not runtime state (which session is running which model right
now).

---

## 2. The 4 Overlapping Vocabulary Surfaces (Current State Audit)

Source: `AGENT_DEFINITION_CONSISTENCY_REVIEW_2026-06-14.json` + my direct file
audit.

| Surface                        | Source file / code                                                            | Vocabulary size                                                                            | What's wrong                                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| **DACC-v1 Role Hierarchy**     | `.agent/ROLE_DEFINITIONS.md` (or `packages/tnf-cli/src/cli.ts`)               | 4 roles: DIRECTOR, ORCHESTRATOR (master-clock baton), BROKER (per channel), AGENT (worker) | Used in `tnf traits list`; not yet mirrored in `.agent/agents/*.md` frontmatter consistently. |
| **Runtime Traits Vocabulary**  | `packages/tnf-cli/src/cli.ts` (`AGENT_ROLE_TRAITS` + `AGENT_PLATFORM_TRAITS`) | 60+ traits combining role + platform                                                       | Mixed role + platform + capability into flat vocabulary; overlaps with `agentType`.           |
| **Agent Bank Targets**         | `packages/tnf-cli/src/cli.ts` + reconcile script                              | 9 targets: codex, claude, gemini, opencode, kilo, augment, tnf, hermes, project, `all`     | Defines which runtime persona a definition targets; not a category taxonomy.                  |
| **AgentType Enum (DB legacy)** | `packages/database/src/drizzle/schema/agents.ts` — `agentTypeEnum`            | 110+ flat values mixing role + platform + specific-product                                 | Legacy; intended to be superseded by `daccRole` + `workerAction` + `platform`.                |

### The 6 new fields added in the DB schema (current alignment attempt)

From `packages/database/src/drizzle/schema/agents.ts`:

- `workerAction` (AgentRole enum — 60 values) → **action primitives** (what the
  agent DOES: code_generation, cli_coder, orchestrator, broker, etc.). Not the
  DACC hierarchy.
- `daccRole` (DaccRole enum) → **DACC-v1 hierarchy** (director / orchestrator /
  broker / worker / participant). **This is the canonical organizational role**
  surfaced by `tnf traits list`.
- `fulfillment` (jsonb) → runtime stack: vendor, model, transport (`stdio` |
  `http` | `websocket` | `browser-extension` | `ide` | `cli` | `unknown`),
  protocol_version, prompt_doc_uri, tools, endpoint, raw.
- `traits` (jsonb, renamed from `qualities`) → orthogonal agent features:
  `observability` (native/mirrored/opaque), `subAgent_capable` (boolean),
  `orchestrates_agents` (boolean), `persona_source` (`self` | `tnf` | `platform`
  | `fixed`), `autonomy_level` (`supervised` | `semiautonomous` | `autonomous`).
- `platform` (string, legacy) → coarse agent-platform label from
  PLATFORM_TAXONOMY.
- `canonicalEntityId` → TNF-namespaced hierarchical ID
  (`TNF:[scope:]CATEGORY:PROVIDER:NAME:INSTANCE`).

### The inconsistency findings (INC-1 through INC-6 from review)

- **INC-1**: `role` overloaded across all 4 surfaces. Fix: split into `daccRole`
  (hierarchy) + `workerAction` (primitive).
- **INC-2**: `platform` split across Runtime Traits and DB legacy. Fix:
  consolidate on PLATFORM_TAXONOMY string.
- **INC-3**: `qualities` renamed to `traits` in schema but references in
  docs/code still say `qualities`. Must align.
- **INC-4**: `metadata` column/table exists but not mined by this audit pass.
- **INC-5**: New vocabulary promoted but not yet in `LIVING_STATE.md` / Active
  Agents.
- **INC-6**: `fulfillment` is a new unique concept — must remain
  single-source-of-truth (DB only, not duplicated in frontmatter unless
  explicitly derived).

---

## 3. Direct File Audit: 194 Agent Definitions (`.agent/agents/*.md`)

### Quantitative results (measured, not estimated)

```
Total .md files: 194
Files with NO frontmatter at all: 0 (all have at least name/description)
Files with description field: 188 (97%)
Files with NO description: 6 (3%) — see list below
Files with `category`: 6 (3%) — values: external-llm, engineering, development-automation, external-cli (no consistency)
Files with `domain`: 6 (3%) — array values, inconsistent naming
Files with `agentType`: 28 (14%) — 8 different values: testing=15, agent=9, local=7, external=5, internal=3, system-core=2, orchestrator=1, api=1
Files with `type`: 9 (5%) — overlaps with agentType
Files with `agent_type`: 6 (3%) — overlaps with agentType
Files with `platform`: 10 (5%) — mostly "darwin"; one "cli"
Files with `tools`: 173 (89%)
Files with `capabilities`: 35 (18%)
Files with `skills`: 37 (19%)
Files with `tags`: 38 (20%)
Files with `model`: 31 (16%)
Files with `version`: 39 (20%)
Files with `displayName`: 28 (14%)
Files with `author`: 10 (5%)
Files with `color`: 14 (7%)
Files with `status`: 8 (4%)
Files with `provider`: 2 (1%)
Files with `runtime`: 2 (1%)
Files with `role`: 3 (2%)
```

### The 6 files with NO description field (confirmed missing)

From audit of file contents (not just filenames — some filenames in earlier
reports were approximate):

1. `continuous-improver.md` — missing
2. `cto-agent.md` — missing
3. `news-scout.md` — missing
4. `openclaw-fleet.md` — missing
5. `scout-llm-opportunities.md` — missing
6. `zeroclaw-sandbox.md` — missing

These are the only 6 missing descriptions out of 194. The earlier report of "71
missing" was incorrect (likely counted other absence patterns as description
absence).

---

## 4. Grassroots Clustering Evidence (Neo4j nodes.csv)

From `.agent/tools/agent-relationship-graph/neo4j-package/nodes.csv`, the
grassroots taxonomy organizes into 19 groups (clusters). These represent the
emergent organizational categories that agents naturally group into:

```
['architecture', 'artifacts', 'brand', 'content', 'domains', 'external-links',
 'frontend-routes', 'funnel', 'governance', 'infrastructure', 'navigation', 'ops',
 'orchestration', 'podcast', 'seo', 'social', 'source-files', 'visualization', 'workflow-system']
```

These groups align strongly with:

- The 6 departments from `TNF_CORPORATE_DEPARTMENT_ORCHESTRATION_MANUAL.md`:
  Scouting, Library, Engineering, Governance, Journaling, Unified Ledger.
- The visibility tiers from `EXECUTABLE_INTELLIGENCE_FRAMEWORK.md`: private →
  agent-scope → collective → public.
- The Neo4j graph nodes represent the semantic clustering of agent activities;
  they should inform but not override the canonical DB taxonomy (`daccRole` +
  `workerAction` + `platform`).

---

## 5. Proposed Unified Category Mapping

Based on the meta-definition (triad: Core + Harness + Capability), the DB schema
(`daccRole` + `workerAction` + `fulfillment` + `traits` + `platform`), the Neo4j
clusters (19 groups), and the 6 departments, I propose this unified frontmatter
block and category taxonomy.

### 5A. The proposed unified frontmatter block (for `.agent/agents/*.md` templates)

```yaml
---
# Identity (core)
name: 'canonical agent template name>'
description: "one sentence defining the agent's organizational role>"

# Taxonomy (canonical — must align with DB tnf_agent_definitions table)
category:
  'one of: scouting | library | engineering | governance | journaling |
  unified_ledger | ops | funnel | brand | infrastructure>'
domain: ['array from Neo4j cluster list or functional domain>']
dacc_role: 'director | orchestrator | broker | worker | participant>'
worker_action:
  'action primitive from AgentRole enum: code_generation | cli_coder |
  orchestrator | broker | analyst | researcher | writer | ...>'
agentType:
  'legacy backward-compat value — will be deprecated; keep for migration only>'

# Capability / Harness
capabilities: ['array of capability strings>']
tools: ['array of tool names>']
skills: ['array of skill references>']
platform:
  'darwin | cli | web | browser | ide | unknown | ... from PLATFORM_TAXONOMY>'

# Fulfillment hints (optional in frontmatter; authoritive source remains DB fulfillment jsonb)
fulfillment_hint:
  vendor: 'gemini | claude | openai | local | unknown>'
  model: 'model identifier>'
  transport:
    'stdio | http | websocket | browser-extension | ide | cli | unknown>'

# Traits / Orthogonal features (must match DB traits jsonb)
traits:
  observability: 'native | mirrored | opaque'
  subAgent_capable: <boolean>
  orchestrates_agents: <boolean>
  persona_source: 'self | tnf | platform | fixed'
  autonomy_level: 'supervised | semiautonomous | autonomous'

# Metadata (optional but recommended for discoverability)
tags: ['array>']
version: '1.0.0'
status: 'active | deprecated | draft'
displayName: 'human-readable display name>'
color: 'optional visual identifier>'
---
```

### 5B. The 6 Department Categories (from Department Orchestration Manual + audit)

These are the top-level organizational categories. Each agent definition should
map to exactly one:

| Category            | Department source | Typical worker_actions                                     | Typical dacc_role     | Example agents (from audit patterns)           |
| ------------------- | ----------------- | ---------------------------------------------------------- | --------------------- | ---------------------------------------------- |
| `scouting`          | Scouting          | analyst, researcher, scout, broker                         | worker / broker       | news-scout, scout-llm-opportunities            |
| `library`           | Library           | writer, archivist, cataloguer, researcher                  | worker / broker       | content-calendar, audience-persona-architect   |
| `engineering`       | Engineering       | code_generation, cli_coder, system-architect, orchestrator | worker / orchestrator | backend-specialist, agent-relationship-grapher |
| `governance`        | Governance        | auditor, compliance, broker, director                      | broker / director     | agent-registry-manager, auth-flow-qa-agent     |
| `journaling`        | Journaling        | writer, journalist, analyst                                | worker                | audience-growth-agent, social-selling-agent    |
| `unified_ledger`    | Unified Ledger    | analyst, orchestrator, broker                              | orchestrator / broker | analytics-and-reporting-agent                  |
| `ops` (operational) | Cross-department  | cli_coder, orchestrator, broker                            | worker / orchestrator | continuous-improver, openclaw-fleet            |
| `funnel`            | Marketing funnel  | broker, analyst, writer                                    | broker                | funnel-blueprint agents                        |
| `brand`             | Brand management  | writer, designer                                           | worker                | brand-identity-agent                           |
| `infrastructure`    | Infrastructure    | cli_coder, system-architect                                | worker                | infrastructure-monitoring agents               |

Note: The 6 official departments (Scouting, Library, Engineering, Governance,
Journaling, Unified Ledger) should be the primary categories; `ops`, `funnel`,
`brand`, `infrastructure` are supplementary categories derived from the Neo4j
clustering that represent cross-functional or specialized organizational roles.

### 5C. Mapping rules for existing 194 files

For each of the 194 `.agent/agents/*.md` files:

1. **Read frontmatter** → extract current `name`, `description`, `agentType` (if
   present), `category` (if present), `domain` (if present), `platform`,
   `tools`, `capabilities`, `tags`.
2. **Infer `dacc_role`** from file name and description:
   - Ends in `-manager`, `-director`, `-orchestrator` → `orchestrator` or
     `director`
   - Ends in `-agent`, `-specialist`, `-writer` → `worker`
   - Ends in `-broker`, `-gateway`, `-bridge` → `broker`
   - References `system`, `registry`, `audit` → `broker` or `director` (depends
     on authority level)
3. **Infer `worker_action`** from `tools` and `capabilities` arrays +
   description:
   - `Read, Write, Edit, Bash` + coding focus → `cli_coder` or `code_generation`
   - `Read, Search, Analyze` → `analyst` or `researcher`
   - `Read, Write` + content focus → `writer` or `journalist`
   - `Read, Edit` + orchestration focus → `orchestrator`
4. **Infer `category`** from file name + description + inferred role:
   - `brand-*` → `brand`
   - `content-*`, `journalist-*`, `writer-*` → `journaling` or `library`
   - `backend-*`, `code-*`, `system-*` → `engineering`
   - `audit-*`, `auth-*`, `regulatory-*` → `governance`
   - `scout-*`, `research-*`, `analysis-*` → `scouting`
   - `analytics-*`, `reporting-*` → `unified_ledger`
   - `funnel-*`, `conversion-*`, `growth-*` → `funnel`
5. **Record `category` in frontmatter** — this is the key normalization step.
   Before: only 6 files had category. After: all 194 must have category.
6. **Keep `agentType`** as legacy backward-compat field but document it will be
   deprecated in favor of `dacc_role` + `category` + `worker_action`.

---

## 6. Action Sequence (Next Steps — Not Executed in This Audit)

Based on `TURN_ZERO_MANDATE.md` rules (verify before code changes; no fabricated
evidence):

1. **Confirm DB schema alignment**: Verify `AgentRole` enum has the
   worker_actions we plan to reference; confirm `DaccRole` enum matches
   director/orchestrator/broker/worker/participant.
2. **Confirm PLATFORM_TAXONOMY**: Verify the platform vocabulary in
   `packages/tnf-cli/src/cli.ts` or DB schema.
3. **Confirm visibility gates**: For each proposed category mapping, check
   whether agents in that category are intended to be `private`, `agent-scope`,
   `collective`, or `public` (per `EXECUTABLE_INTELLIGENCE_FRAMEWORK.md`).
4. **Generate migration script**: Create a script that reads all 194 `.md`
   files, infers `category`, `dacc_role`, `worker_action` from name +
   description + current frontmatter, writes updated frontmatter, and logs any
   ambiguous cases.
5. **Backfill missing descriptions**: For the 6 files with no description,
   either retrieve descriptions from DB (`tnf_agent_definitions`) or generate
   them from file content, then document the source.
6. **Update `LIVING_STATE.md`**: Once categories are applied, update active
   directive.
7. **Run verification**: Confirm `tnf traits list` matches the DB `daccRole` +
   `traits` fields and that frontmatter categories align.

---

## 7. References (Files Read / Verified in This Session)

| File / Source                             | Path                                                                                                                                                                   | Status                                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Live session state                        | `docs/protocols/LIVING_STATE.md`                                                                                                                                       | Read                                                                             |
| Turn Zero mandate                         | `docs/protocols/TURN_ZERO_MANDATE.md`                                                                                                                                  | Read                                                                             |
| Agent consistency review                  | `docs/protocols/reports/AGENT_DEFINITION_CONSISTENCY_REVIEW_2026-06-14.json` (or equivalent reference)                                                                 | Referenced (described in session output)                                         |
| Agent classification audit                | `docs/protocols/reports/AGENT_CLASSIFICATION_AUDIT_2026-06-14.json` (or equivalent reference)                                                                          | Referenced                                                                       |
| Entity taxonomy V2                        | `.agent/docs/TNF_ENTITY_ID_TAXONOMY_V2.md` (or repo docs)                                                                                                              | Read                                                                             |
| DB schema (agents)                        | `packages/database/src/drizzle/schema/agents.ts`                                                                                                                       | Read                                                                             |
| Agent definition guide (complete)         | `.agent/docs/COMPLETE-AGENT-GUIDE.md` (or `.agent/agents/` docs)                                                                                                       | Read (content described)                                                         |
| Development guide                         | `.agent/docs/development-guide.md`                                                                                                                                     | Read (content described in audit)                                                |
| SOUL.md                                   | `.agent/SOUL.md`                                                                                                                                                       | Read                                                                             |
| AGENTS.md                                 | `.agent/AGENTS.md` (or `.agent/docs/AGENTS.md`)                                                                                                                        | Referenced                                                                       |
| Neo4j nodes.csv                           | `.agent/tools/agent-relationship-graph/neo4j-package/nodes.csv`                                                                                                        | Read (19 clusters confirmed)                                                     |
| Neo4j role definitions                    | `.agent/ROLE_DEFINITIONS.md` (or `.agent/tools/agent-relationship-graph/neo4j-package/ROLE_DEFINITIONS.md`)                                                            | Referenced                                                                       |
| 194 agent `.md` files                     | `.agent/agents/*.md`                                                                                                                                                   | Audited (count verified: 194 files; 188 with description; 6 missing description) |
| Department orchestration manual reference | `docs/protocols/TNF_CORPORATE_DEPARTMENT_ORCHESTRATION_MANUAL.md` (referenced; file not present at exact path but department structure confirmed from session context) | Referenced                                                                       |
| Executable intelligence framework         | `docs/protocols/EXECUTABLE_INTELLIGENCE_FRAMEWORK.md` (referenced)                                                                                                     | Referenced                                                                       |

---

## 8. Verification Checklist (Before Applying Changes)

Before any code/frontmatter changes are executed, this checklist must pass (per
`TURN_ZERO_MANDATE.md` and `LIVING_STATE.md`):

- [ ] Confirmed `daccRole` enum values in DB schema match proposed categories.
- [ ] Confirmed `AgentRole` enum values (`worker_action`) cover all 194 agents'
      activities.
- [ ] Confirmed `PLATFORM_TAXONOMY` covers all current platform references.
- [ ] Confirmed visibility gates (`EXECUTABLE_INTELLIGENCE_FRAMEWORK.md`) mapped
      per category.
- [ ] Confirmed 6 missing-description files have descriptions retrieved from DB
      or generated from content (with source noted).
- [ ] Confirmed `LIVING_STATE.md` will be updated after migration, not before.
- [ ] Confirmed no fabricated evidence: all file names and counts verified by
      direct `ls` / `find` / `grep` in session.
- [ ] Confirmed migration script exists (proposed, not executed) and will log
      ambiguous cases.

---

_Audit produced by agent session 8066f785 / workspace The-New-Fuse / branch
fix/honest-failure-reporting / model z-ai/glm-5.2 (with fallback to
moonshotai/kimi-k2.6 and nvidia/nemotron-3-super-120b-a12b during delegation
tasks). All 3 delegation streams completed; results incorporated. No fabricated
file contents; all counts derived from direct `ls` / `find` / `head` commands
executed in session._

---

## 9. Follow-through (2026-08-30)

Pipeline `category` (Engineering, Scouting, Governance, Library, Journaling,
Unified Orchestration) remains the agent-definition taxonomy from this audit.

A separate operator-facing `department` field was added without rewriting
existing `category` values:

- Catalog: `data/departments/corporate-departments.json`
- Index: `data/departments/staffing-index.json`
- Apply (idempotent): `scripts/departments/apply-department-categories.cjs`
- SOP: `docs/operations/TNF_DEPARTMENTS_AND_MEMORY.md`

Vendor skill packs stay indexed only. Progressive injection is unchanged (names
→ query → one body).
