# TNF Legacy & Current State Synthesis v1.0

**Generated**: 2026-05-06
**Sources**: TNF codebase + whodaniel/docs + whodaniel/the-new-fuse-docs-private
**Purpose**: Map past progress, challenges, and current state across all TNF systems

---

## 1. Legacy Progress (from private repos)

### 1.1 Early Architecture (Q1-Q2 2025)

| Milestone | Date | Status |
|---|---|---|
| MCP core architecture defined | May 2025 | Complete |
| Agent self-registration via MCP tools | May 2025 | Complete |
| API Key + JWT dual auth system | May 2025 | Complete |
| MCP parameter validation (ajv) | May 2025 | Complete |
| Project roadmap: 3 phases, 6 weeks | May 2025 | Complete |

### 1.2 Multi-Agent Breakthrough (Jan 2026)

| Milestone | Date | Status |
|---|---|---|
| Two Gemini instances communicating via WebSocket relay | Jan 15, 2026 | Breakthrough |
| External AI orchestrating tasks across tabs | Jan 16, 2026 | Verified |
| Stall detection + auto-recovery for idle conversations | Jan 2026 | Implemented |
| Extension self-prompting from Chrome side | Jan 2026 | Implemented |
| Conversation state machine (lifecycle tracking) | Jan 2026 | Implemented |
| Task dispatch to specific agents | Jan 2026 | Implemented |
| Protocol alignment framework (1,218 docs, 115+ agents) | Jan 17, 2026 | Complete |

### 1.3 Implementation Status (as of legacy snapshot)

| Phase | Progress |
|---|---|
| Phase 1 (Foundation) | 100% |
| Phase 2 (Core Infrastructure) | 95% |
| Codebase Intelligence (indexer + synergy) | 100% |
| Phase 3 (MCP Enhancement) | 0% |
| Phase 4 (Cron Jobs) | 80% |
| Phase 5 (Activation/Deployment) | 0% |
| **Overall** | **60%** |

### 1.4 Key Challenges Documented

| Challenge | How It Was Solved |
|---|---|
| "Dirty Work Tree" - agents resuming stale tasks after 38MB session crash | "Turn Zero" Mandate: mandatory `LIVING_STATE.md` read at session start |
| Broken handoff failure | Merkle Root Hash verification every session start |
| Auth complexity (JWT + API Key dual auth) | `ServiceOrUserAuthGuard` handling both paths |
| Cross-browser relay stall detection | `StallDetector` class with auto-recovery messages |
| Protocol fragmentation (1,218 docs) | Protocol Alignment Framework: 4-level hierarchy + priority matrix |
| Federation gate enforcement | Gate chain with required cumulative lineage (MCID) |
| Resource isolation | Lateral Lock: task-specific namespaces, no cross-lane reads |
| Cost overrun risk | Budget Sentinel: hard API spend cap, auto-freeze all lanes |

---

## 2. Library Features (Current State)

### 2.1 Virtual Library Blueprints (3D WebGL Application)

**Location**: `apps/virtual-library-blueprints/`
**Status**: Implemented, deployed

| Component | File | Description |
|---|---|---|
| LibraryScene | `components/3d/LibraryScene.tsx` | 3D room with chandelier, bookshelves (Dewey Decimal), reading table |
| StoryArchitectPanel | `components/ui/StoryArchitectPanel.tsx` | 5-ring question-based story building (Surface → Meta) |
| TimelineWall | `components/ui/TimelineWall.tsx` | 8-era TNF history visualization with event cards |
| EmpireMap | `components/ui/EmpireMap.tsx` | Spatial map of connected projects/resources |
| AIGuidePanel | `components/ui/AIGuidePanel.tsx` | AI conversation interface with fact filter + voice |
| BookDetailPanel | `components/ui/BookDetailPanel.tsx` | Book reading with annotations and note-taking |
| Persistence | `lib/persistence.ts` | Supabase + Upstash cache, 2s debounce save/load |
| Privacy | `lib/privacy.ts` | Owner-scoped privacy wall with agent allowlist |
| State | `store/index.ts` | Zustand store: player, books, stories, timeline, AI, VR (547 lines) |

### 2.2 Virtual Library Database

**Schema**: `supabase/migrations/001_virtual_library_schema.sql`

| Table | Description | RLS |
|---|---|---|
| `story_sessions` | Guided story-building sessions | Per-user |
| `story_answers` | Answers to story ring questions | Per-user |
| `note_cards` | Annotations and notes | Per-user |
| `timeline_events` | Era 1-8 events with git_commit_hash, book_chapter | Per-user |
| `empire_assets` | Connected project resources | Per-user |
| `library_navigation` | Player position (x,y,z), rotation, shelf, panel state | Per-user |
| `story_session_agent_access` | Agent access control for sessions | Per-user |

### 2.3 MemPalace (Spatial Memory Architecture)

**Location**: `scripts/mempalace_router.ts`
**Status**: Implemented (zero-cost, no LLM)

| Feature | Description |
|---|---|
| Ingestion | Regex/heuristics-based document routing (no LLM cost) |
| Structure | Wings (engineering/intelligence/governance) → Halls → Rooms → Drawers |
| Drawers | Verbatim code block extraction + storage |
| Integration | Linked to Karpathy Wiki via `resource_pointer` attribution |

### 2.4 Mirror & Sync Infrastructure

| Component | File | Status |
|---|---|---|
| Surface audit | `scripts/autonomy/virtual_library_surface_audit.py` | Implemented |
| Mirror sync | `scripts/autonomy/sync_virtual_library_mirror.sh` | Implemented (rsync) |
| Route state verify | `scripts/library/verify-library-route-state.mjs` | Implemented |
| RLS blueprint validate | `scripts/library/validate-librarian-rls-blueprint.sh` | Implemented |

### 2.5 Gemini Browser Library Importer

**Location**: `packages/gemini-browser-skill/src/LibraryImporter.ts`
**Status**: Implemented

| Feature | Description |
|---|---|
| Source | Google AI Studio library (`aistudio.google.com/app/library`) |
| Method | Playwright with anti-automation flags |
| Output | JSON files to `data/library_import/` |

---

## 3. Timeline Features (Current State)

### 3.1 Timeline Service Layer

| Component | File | Status |
|---|---|---|
| Timeline types | `packages/feature-suggestions/src/types/timeline.ts` | Implemented |
| Timeline service (interface) | `packages/feature-suggestions/src/services/timeline.service.ts` | Implemented |
| Unified ledger timeline | `packages/feature-suggestions/src/services/unifiedLedgerTimeline.service.ts` | Implemented |
| Frontend timeline service | `apps/frontend/src/features/timeline/services/timeline.service.tsx` | Implemented |

### 3.2 Timeline Visualization (D3.js)

| Component | File | Description |
|---|---|---|
| EnhancedTimelineView | `apps/frontend/src/features/timeline/components/EnhancedTimelineView.tsx` | Time-scaled x-axis, branch lanes, zoom/pan |
| TimelineView | `packages/feature-suggestions/src/components/TimelineView.tsx` | Hierarchical node layout |
| TimelineSlider | `packages/feature-suggestions/src/components/TimelineSlider.tsx` | Chronological slider with throttle |
| TimelineModule | `apps/frontend/src/features/timeline/TimelineModule.tsx` | Composes EnhancedTimelineView + Slider |

### 3.3 Timeline Pages

| Page | File | Description |
|---|---|---|
| Personal Timeline | `apps/frontend/src/pages/Timeline/index.tsx` | 874 lines, 17 category types, full CRUD |
| Macro Timeline | `apps/frontend/src/pages/Timeline/MacroTimelinePage.tsx` | Workspace with timeline/kanban toggle |
| Timeline Lab | `apps/frontend/src/pages/Timeline/TimelineModulePage.tsx` | Experimental component testing page |
| Timeline Demo | `apps/frontend/src/pages/TimelineDemo.tsx` | Standalone demo with mock data |

### 3.4 Timeline Import/Sync Scripts

| Script | Description | Status |
|---|---|---|
| `import-github-history-to-timeline.mjs` | Posts GitHub narrative to `/api/timeline/github/import` | Implemented |
| `synthesize-email-timeline-plotlines.mjs` | 488 lines, keyword-based classification, 9 categories | Implemented |
| `build-supabase-email-timeline-sync-payload.mjs` | Builds Supabase sync payload from task ledger | Implemented |
| `validate-email-supabase-timeline.mjs` | 825 lines, validates events against Supabase schema | Implemented |
| `import-timeline-draft-to-ledger.mjs` | Imports drafts to unified ledger + PostgreSQL | Implemented |
| `curate-email-life-chronology.mjs` | 390 lines, noise-filtering, confidence-scored chronology | Implemented |

### 3.5 GitHub Timeline Sync

**Location**: `.github/workflows/github-history-timeline-sync.yml`
**Status**: Deployed (daily at 5:25 AM)

| Feature | Description |
|---|---|
| Schedule | `25 5 * * *` (daily) |
| Endpoint | `POST /api/timeline/github/import` |
| Auth | `TNF_AUTH_TOKEN` secret |
| Modes | Append (default) or `--replace-existing` |

### 3.6 UTP (Universal Timeline Protocol)

**Location**: `docs/protocols/UTP_SPEC_v1.0.md`
**Status**: Initial Draft

| Feature | Description |
|---|---|
| Purpose | Translate any event-driven stream into normalized "Timeline Objects" |
| Schema | JSON with id, timestamp, actor, source, content, metadata |
| Translators | Discord, Discourse (Forum), extensible adapter interface |
| Outputs | Navigable HTML maps, Mermaid charts, Agent context (Markdown) |

### 3.7 Chronological Process Services

| Component | Description | Status |
|---|---|---|
| `apps/api/src/modules/admin/chronological-processes.service.ts` | NestJS service for process scheduling | Implemented |
| `scripts/protocols/run-chronological-process.cjs` | CLI process runner | Implemented |
| `scripts/protocols/chronological-dispatch.cjs` | Dispatch according to catalog | Implemented |
| `data/protocols/chronological-process-catalog.json` | Process definitions | Data artifact |
| `data/protocols/chronological-dispatch-profiles.json` | Dispatch profiles | Data artifact |

---

## 4. Integration Map: Legacy → Current

### 4.1 What Was Built and Remains

| Legacy Concept | Current Implementation | Status |
|---|---|---|
| Multi-agent orchestration via WebSocket relay | `apps/relay-server/` | Active |
| Conversation state machine | `ConversationStateMachine` class | Active |
| Agent self-registration (MCP) | `MCPRegistryService`, `AgentModule` | Active |
| Dual auth (JWT + API Key) | `ServiceOrUserAuthGuard`, `JwtAuthGuard` | Active |
| Protocol alignment framework | `docs/PROTOCOL_ALIGNMENT_FRAMEWORK.md` | Archived |
| "Turn Zero" Mandate | Enforced in `LIVING_STATE.md`, Merkle tree | Active |
| Budget Sentinel | Referenced in `TNF_GOVERNANCE_TENETS.md` | Designed |
| Codebase Intelligence (indexer) | `CodebaseIndexerAgent.ts` | Designed |

### 4.2 What Was Planned but Incomplete

| Legacy Plan | Current Status | Gap |
|---|---|---|
| Phase 3 (MCP Enhancement): resources/list, prompts/list | `MCPBrokerService` has Redis pub/sub | Missing resource prompt handlers |
| Phase 4 (Cron Jobs): CodebaseIndexer cron, health monitoring | `tnf-cron-governance-protocol-v0.1.md` exists | Cron jobs need deployment |
| Phase 5 (Activation): CloudRuntime deployment, full monitoring | Infrastructure partially deployed | Monitoring incomplete |
| External entity registration (AI models, VS Code extensions) | Not found in current codebase | Not implemented |

### 4.3 Library ↔ Timeline Cross-Integration

| Connection | Description |
|---|---|
| Virtual Library → TimelineWall | 8-era TNF history displayed in 3D library UI |
| Virtual Library → StoryArchitect | Story questions persisted per session, timeline-linked |
| MemPalace → Executable Intelligence | Verbatim content routed to spatial storage, distilled to artifacts |
| Email Timeline → Unified Ledger | Email chronology synced to task ledger and PostgreSQL |
| GitHub Timeline → Personal Page | GitHub history imported to personal timeline page |
| Virtual Library → Supabase | All story/timeline/navigation state persisted with RLS |
| UTP → All Timeline Pages | Universal protocol for translating external timelines into TNF format |

---

## 5. Current Codebase State (from Systematic Review)

### 5.1 Review Status

| Metric | Value |
|---|---|
| Total nodes | 15,707 |
| Reviewed | 15,707 (100%) |
| Reconciled | 15,707 (100%) |
| Merkle Root | `e1e3232e2fb9462329d75a7d1a6546e15811e0f1045175d3bb31abc2ad9ef0f8` |
| Contradictions found | 1 (resolved: Freeze/Stop tiered system) |

### 5.2 Principles Corrected

| Old Principle | New Directive |
|---|---|
| "Least-Among-Us Barometer" (zero-cost only) | "Resource Efficiency Directive" (most performant, least costly) |
| "Sovereignty Gating" (local-only hardware) | Removed (general directive: justify and benchmark) |
| C++/Rust/LLVM prohibited except pre-compiled | C++/Rust/LLVM valid when superior performance/cost justified |

### 5.3 New Infrastructure

| Component | Status |
|---|---|
| Merkle Tree (sha256, 14 levels, 15,707 nodes) | Implemented |
| Merkle Tree Schema (`tnf-merkle-tree.schema.json`) | Created |
| 4-cycle Review System (discovery→adversarial→synthesis→reconciliation) | Complete |
| Human Gate Accumulator | Implemented |
| Audit Director | Implemented |
| Handoff Document (`TNF_AUDIT_DIRECTOR_HANDOFF.md`) | Created |

---

## 6. Next Steps

### 6.1 Immediate (from legacy incomplete plans)

1. **Deploy Phase 4 Cron Jobs**: Wire `CodebaseIndexerAgent` cron and health monitoring
2. **Implement Phase 3 MCP Enhancement**: Add `resources/list`, `resources/read`, `prompts/list`, `prompts/get` handlers
3. **Complete Phase 5 Activation**: CloudRuntime deployment, full monitoring, 72-hour verification

### 6.2 Medium Priority

4. **Implement external entity registration**: Catalog AI models, VS Code extensions via MCP tools
5. **Deploy librarian RLS blueprint**: Validate and apply `librarian_rls_blueprint_2026-05-05.sql`
6. **Complete UTP v1.0**: Move from draft to implementable, add error handling (done), add more translators

### 6.3 Strategic

7. **C++/Rust/LLVM transition**: Begin moving latency-critical paths to native compilation
8. **Federation gate enforcement**: Implement MCID validation in handoff publish path
9. **Library ↔ Codebase Map integration**: Link Virtual Library assets to codebase map nodes
10. **Merkle tree continuous verification**: Add cron job to re-compute and verify merkle root daily

---

## 7. Key Files Reference

### Legacy Repos
- `whodaniel/docs` (private) — Early architecture, plans, development log (672 KB)
- `whodaniel/the-new-fuse-docs-private` (private) — Comprehensive backup with protocol alignment, breakthrough docs (84 MB, 8,907 entries)

### Library
- `apps/virtual-library-blueprints/` — 3D WebGL library application
- `scripts/mempalace_router.ts` — Zero-cost spatial memory router
- `scripts/autonomy/virtual_library_surface_audit.py` — Surface canonicalization
- `scripts/autonomy/sync_virtual_library_mirror.sh` — Mirror sync

### Timeline
- `apps/frontend/src/pages/Timeline/index.tsx` — Personal timeline (874 lines)
- `apps/frontend/src/features/timeline/components/EnhancedTimelineView.tsx` — D3.js visualization
- `.github/workflows/github-history-timeline-sync.yml` — Daily sync workflow
- `scripts/timeline/` — 7 import/sync scripts
- `docs/protocols/UTP_SPEC_v1.0.md` — Universal Timeline Protocol

### Current State
- `docs/TNF_SYSTEMATIC_REVIEW_REPORT_v1.3.md` — Full review report
- `docs/TNF_GOVERNANCE_TENETS.md` — Corrected governance tenets
- `docs/protocols/schemas/tnf-merkle-tree.schema.json` — Merkle schema
- `data/reviews/codebase_merkle_tree.json` — Computed Merkle tree