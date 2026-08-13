# TNF Codebase Reading Tracker (CCRT)
> Codebase Comprehensive Reading Tracker

## Purpose
A framework to systematically track, classify, and analyze every document in the TNF codebase as AI agents read through them. Turns `codebase_map.json` into a **living state machine** of reading progress.

## Core Concepts

### 1. Reading State Machine
Every node in the map can be in one of four states:

| State | Meaning |
|---|---|
| `UNREAD` | Never analyzed by an agent |
| `READING` | Currently being processed by an agent |
| `ANALYZED` | Read and categorization complete |
| `STALE` | Previously analyzed, but source changed since last read |

### 2. Categorical Lenses (The "7 Lenses")
When an AI reads a document, it classifies it along 7 dimensions:

#### Lens 1: Intent (Why does this exist?)
- `governance` — Rules, policies, enforcement
- `architecture` — System design, blueprints, decisions
- `specification` — Technical requirements, RFCs, protocols
- `implementation` — Working code, modules, integrations
- `operational` — Runbooks, monitoring, incident response
- `narrative` — Context, history, rationale
- `meta` — Documents about the system itself (AGENTS.md, this tracker)

#### Lens 2: Scope (What level of abstraction?)
- `meta_system` — Entire ecosystem (AGENTS.md)
- `system` — Cross-cutting system (MCP, webpilot)
- `module` — Bounded context (a2a-core, sspdf)
- `component` — Specific class/service
- `function` — Single function or method

#### Lens 3: Maturity (Where in lifecycle?)
- `draft` — RFC, proposal, unmerged
- `review` — Under review or in beta
- `stable` — Production-ready
- `deprecated` — Scheduled for removal
- `archived` — Kept for reference only

#### Lens 4: Actionability (What happens next?)
- `implement` — Needs code to be written
- `review` — Needs human or peer review
- `migrate` — Old version needs migration
- `monitor` — Active, observe for issues
- `archive` — Can be safely archived
- `none` — Informational only

#### Lens 5: Ownership (Who is responsible?)
- `agent:<name>` — AI agent ownership (e.g., `agent:webpilot`)
- `human:<role>` — Human ownership (e.g., `human:architect`)
- `system` — Auto-generated, no owner

#### Lens 6: Semantic Vibe (Embedding tag)
- Vector embedding tag for RAG retrieval
- Example tags: `security`, `performance`, `data-model`, `ui-component`, `api-contract`

#### Lens 7: Criticality (How important is this?)
- `critical` — System breaks without this
- `important` — Significant impact if wrong
- `ancillary` — Nice to have, low risk
- `exploratory` — Experimental or research

## Data Schema

### Tracker State (Per Node)
```typescript
interface NodeReadState {
  // Core State
  read_status: 'UNREAD' | 'READING' | 'ANALYZED' | 'STALE';
  read_by: string | null;        // Agent/human ID
  read_at: string | null;        // ISO timestamp
  version_read: string;          // Hash of content when read
  
  // 7-Lens Classification
  lenses: {
    intent: string;
    scope: string;
    maturity: string;
    actionability: string;
    ownership: string;
    semantic_vibe: string;
    criticality: string;
  };
  
  // Derived
  confidence: number;           // 0.0-1.0, classification confidence
  dependencies_crossed: string[]; // IDs of referenced nodes
  key_findings: string[];        // 3-5 bullet summary from agent
  
  // Audit
  review_count: number;          // How many times reviewed
  last_reviewer: string | null;
}
```

### Tracker JSON Output
```json
{
  "tracker_version": "1.0.0",
  "last_updated": "2026-05-05T23:41:00Z",
  "total_nodes": 15707,
  "progress": {
    "UNREAD": 15690,
    "READING": 0,
    "ANALYZED": 17,
    "STALE": 0
  },
  "lens_distribution": {
    "intent": { "governance": 2, "architecture": 3, ... },
    "maturity": { "stable": 15, "draft": 2, ... }
  },
  "nodes": {
    "PROTO_14": { ...NodeReadState... },
    "N1955": { ...NodeReadState... }
  }
}
```

## Workflow

### Phase 1: Onboarding (Discovery)
1. Generate `codebase_map.json` (already done)
2. Initialize `codebase_tracker.json` with all nodes in `UNREAD` state
3. Agent queries: "What is the governance hierarchy?" → Reads `GOVERNANCE` protocol

### Phase 2: Reading (In Progress)
1. Agent marks node as `READING` + records `read_by` + `read_at`
2. Agent classifies node using the 7 lenses
3. Agent records `confidence`, `key_findings`, `dependencies_crossed`
4. Agent marks node as `ANALYZED`

### Phase 3: Review (Periodic)
1. CLI tool: `npm run tracker:review` flags `STALE` nodes (source changed)
2. Re-analyze stale nodes
3. Update stats dashboard

### Phase 4: Audit (Reporting)
1. HTML dashboard shows completion % per category
2. Export "critical gaps" (ANALYZED < 10%, no owner, high criticality)
3. CI blocks deployment if critical docs are UNREAD or STALE

## Implementation

### Files
- `scripts/trackers/init_tracker.mjs` — Initialize tracker state from codebase_map.json
- `scripts/trackers/report_tracker.mjs` — Generate progress report
- `scripts/trackers/audit_tracker.mjs` — Find gaps, stale nodes, high-risk UNREAD docs
- `codebase_index.html` — Updated with progress bars

### Example: Reading a Node via Script
```bash
# Mark a node as being read by agent "claude-v1"
node scripts/trackers/update_node.mjs --id "PROTO_14" --agent "claude-v1" --status READING

# After analysis, classify it
node scripts/trackers/update_node.mjs --id "PROTO_14" --status ANALYZED \
  --intent governance --maturity stable --actionability monitor \
  --criticality critical --confidence 0.98
```

## Future: Agent Autonomy
- Agents self-register interest in nodes matching their `semantic_vibe`
- Auto-assign ownership based on agent capability tags
- Trigger alerts when a `critical` doc sits `UNREAD` for >7 days
