# TNF Comprehensive Legacy-to-Present Synthesis v1.0

**Date**: 2026-05-06
**Purpose**: Integrates legacy documentation repos, current systematic review, and Library/Timeline features into one coherent picture of TNF's evolution.
**Sources**: `whodaniel/docs`, `whodaniel/the-new-fuse-docs-private`, `The-New-Fuse` monorepo

---

## 1. Historical Timeline (Legacy → Current)

| Date | Milestone | Source |
|---|---|---|
| 2025-01-01 | Project initiated | timeline-demo.tsx |
| 2025-02-15 | Core architecture completed (MCP, routing) | timeline-demo.tsx |
| 2025-03-01 | UI component library + design system | timeline-demo.tsx |
| 2025-04-01 | Multi-agent chat launched | timeline-demo.tsx |
| 2025-05-01 | MCP self-registration plan drafted; API key auth implemented | `whodaniel/docs/PLANS.md` |
| 2025-05-20 | `whodaniel/docs` repo created (672 KB, 44 tree dirs) | GitHub API |
| 2026-01-15 | Multi-agent orchestration breakthrough — Gemini instances communicate via WebSocket relay | `the-new-fuse-docs-private/.agent/HANDOFF_PROMPT.md` |
| 2026-01-17 | Protocol alignment complete — 1,218 docs mapped, 115+ agents catalogued | `the-new-fuse-docs-private/.agent/ALIGNMENT_COMPLETE_2026-01-17.md` |
| 2026-01-18 | Phase 2 core infrastructure complete (AgentInbox, LifecycleManager, TNFRouter) | `the-new-fuse-docs-private/.agent/IMPLEMENTATION_STATUS.md` |
| 2026-02-15 | UTP (Universal Timeline Protocol) v1.0 drafted | `docs/protocols/UTP_SPEC_v1.0.md` |
| 2026-03-18 | TWIP v0.1 published (Terminal Window Identity Protocol) | `docs/protocols/draft-twip-0001.md` |
| 2026-03-18 | SGP v0.1 published (Spreadsheet Graph Protocol) | `docs/protocols/draft-sgp-0001.md` |
| 2026-03-18 | TWIP Federation + MCID state assessment | `docs/protocols/twip-federation-state-2026-03-18.md` |
| 2026-03-20 | `the-new-fuse-docs-private` repo created (84 MB, 8,907 tree entries, 31 open issues) | GitHub API |
| 2026-03-26 | Cursor Watch Learn timeline analysis runs | `apps/external/cursor-watch-learn/` |
| 2026-04-27 | Last push to `the-new-fuse-docs-private` | GitHub API |
| 2026-04-29 | Dirty Work Tree incident — 38MB session crash, protocol transition | `docs/protocols/AUDIT_PROTOCOL_TRANSITION_2026_04_29.md` |
| 2026-04-30 | Emergency maintenance: freed 1.4GB disk space | `docs/protocols/AGENT_STATUS_LEDGER.md` |
| 2026-05-01 | Living State synchronized; Merkle Integration & Survival Protocol live | `docs/protocols/LIVING_STATE.md` |
| 2026-05-03 | INFORMATION_INTENTIONS.md generated | `docs/protocols/INFORMATION_INTENTIONS.md` |
| 2026-05-06 | **TNF Systematic Review v1.3 complete** — 15,707 nodes reconciled | This session |

---

## 2. Past Challenges (Resolved & Unresolved)

### Resolved

| Challenge | Solution | Source |
|---|---|---|
| Dirty Work Tree — agents resume stale tasks after crash | "Turn Zero" mandate; real-time state sync; LIVING_STATE.md | `AUDIT_PROTOCOL_TRANSITION_2026_04_29.md` |
| Auth complexity — JWT vs API Key dual auth | `ServiceOrUserAuthGuard` created | `whodaniel/docs/DEVELOPMENT_LOG.md` |
| Relay stall detection — idle conversations hang | Auto-recovery messages; self-prompting Chrome extension | `the-new-fuse-docs-private/.agent/HANDOFF_PROMPT.md` |
| Protocol fragmentation — 1,218 docs needing coherence | Protocol Alignment Framework + Priority Matrices | `the-new-fuse-docs-private/.agent/ALIGNMENT_COMPLETE_2026-01-17.md` |
| Merkle Hash undefined — handoff unverifiable | Defined sha256 algorithm + reference implementation | This session |
| PROTO_14 vs PROTO_27 timing conflict | Tiered resolution: 10-min Freeze / 15-min Stop | This session |

### Unresolved from Legacy

| Issue | Status | Source |
|---|---|---|
| Phase 3: MCP Enhancement | 0% complete (resources/list, resources/read handlers needed) | `the-new-fuse-docs-private/.agent/IMPLEMENTATION_STATUS.md` |
| Phase 4: Cron Jobs deployment | 80% (code ready, not deployed) | `the-new-fuse-docs-private/.agent/IMPLEMENTATION_STATUS.md` |
| Phase 5: Activation (CloudRuntime deploy) | 0% complete | `the-new-fuse-docs-private/.agent/IMPLEMENTATION_STATUS.md` |
| Orchestrator Integration | Needs final integration | `the-new-fuse-docs-private/.agent/IMPLEMENTATION_STATUS.md` |
| 31 open issues | Unresolved | `the-new-fuse-docs-private` GitHub |
| Phase 2-6 of SGP reference implementation | Not started | `docs/protocols/draft-sgp-0001.md` |
| Phase 1-4 of TWIP rollout | Not started | `docs/protocols/draft-twip-0001.md` |

---

## 3. Library Feature — Current Status

### What It Is
The TNF Virtual Library is a **story forge persistence layer** built on Supabase, with:
- Story Architect sessions (5-ring question system)
- Note cards (captured discoveries)
- Timeline events (linked to sessions)
- Library navigation (shelf code + DDC classification)
- Agent access control (per-session permissions)

### Key Components

| Component | Path | Status |
|---|---|---|
| Supabase schema | `apps/virtual-library-blueprints/supabase/migrations/001_virtual_library_schema.sql` | ✅ Deployed (7 tables) |
| Surface audit | `scripts/autonomy/virtual_library_surface_audit.py` | ✅ Implemented |
| Mirror sync | `scripts/autonomy/sync_virtual_library_mirror.sh` | ✅ Implemented |
| Route state verification | `scripts/library/verify-library-route-state.mjs` | ✅ Implemented |
| Canonical repo | `~/Projects/virtual-library-blueprints` | ✅ Active |
| Monorepo mirror | `apps/virtual-library-blueprints` | ✅ Active |
| Runtime surfaces | `~/.gemini`, `~/.kilo`, `~/.opencode` | ✅ Active (non-authoritative) |
| Surface map | `docs/protocols/storage/tnf-virtual-library-surface-map.json` | ✅ Generated |

### Data Model (7 Tables)
1. `story_sessions` — Owner-scoped session container
2. `story_answers` — Question/answer pairs per session
3. `note_cards` — Captured discoveries
4. `timeline_events` — Time-ordered events linked to sessions
5. `library_navigation` — Shelf code + DDC routing
6. `story_session_agent_access` — Per-agent access grants
7. `timeline_synthesis_audit` — Audit trail for timeline ingestion

### Privacy Enforcement
- `owner_principal_id` — Who owns the data
- `visibility_scope` — Who can see it
- `release_state` — Whether it's released or sealed
- `agent_allowlist` — Which agents can access it

---

## 4. Timeline Feature — Current Status

### What It Is
The TNF Timeline feature provides **full-stack timeline management** with:
- Events, branches, workflows, notes, and ranges
- GitHub history import + narrative graph generation
- Email timeline synthesis with plotline extraction
- Chronological process dispatch via cron
- Frontend timeline visualization

### Key Components

#### Core Types
| Component | Path | Status |
|---|---|---|
| Timeline types (events, branches, workflows, ranges, notes) | `packages/feature-suggestions/src/types/timeline.ts` | ✅ Implemented |
| Shared types | `packages/types/src/types/timeline.ts` | ✅ Implemented |

#### Services & APIs
| Component | Path | Status |
|---|---|---|
| Timeline service interface (events, branches, workflows) | `packages/feature-suggestions/src/services/timeline.service.ts` | ✅ Interface defined |
| Frontend timeline service | `apps/frontend/src/features/timeline/services/timeline.service.tsx` | ✅ Implemented |
| Frontend API client | `apps/frontend/src/api/timeline.ts` | ✅ Implemented |
| API Gateway module | `apps/api-gateway/src/gateway/timeline-gateway.module.ts` | ✅ Implemented |
| API Gateway controller | `apps/api-gateway/src/gateway/timeline-gateway.controller.ts` | ✅ Implemented |
| Chronological processes service | `apps/api/src/modules/admin/chronological-processes.service.ts` | ✅ Tests passing |

#### Integration Scripts
| Component | Path | Status |
|---|---|---|
| GitHub history import | `scripts/timeline/import-github-history-to-timeline.mjs` | ✅ Implemented |
| Email timeline synthesis | `scripts/timeline/synthesize-email-timeline-plotlines.mjs` | ✅ Implemented |
| Email timeline validation | `scripts/timeline/validate-email-supabase-timeline.mjs` | ✅ Implemented |
| Email timeline sync payload | `scripts/timeline/build-supabase-email-timeline-sync-payload.mjs` | ✅ Implemented |
| Timeline draft to ledger import | `scripts/timeline/import-timeline-draft-to-ledger.mjs` | ✅ Implemented |
| Life chronology curation | `scripts/timeline/curate-email-life-chronology.mjs` | ✅ Implemented |
| Chronological process dispatch | `scripts/protocols/chronological-dispatch.cjs` | ✅ Tests passing |
| Chronological process runner | `scripts/protocols/run-chronological-process.cjs` | ✅ Tests passing |

#### Frontend & E2E
| Component | Path | Status |
|---|---|---|
| Timeline demo page | `apps/frontend/src/pages/timeline-demo.tsx` | ✅ Implemented |
| E2E tests | `e2e/timeline.personal.spec.ts` | ✅ Implemented |

#### Bridges & Docs
| Component | Path | Status |
|---|---|---|
| Development journey reconstruction | `docs/protocols/bridges/tnf-development-journey-timeline-reconstruction.yml` | ✅ Proposed |
| GitHub timeline sync guide | `docs/integrations/github-timeline-sync.md` | ✅ Documented |
| GitHub history sync workflow | `.github/workflows/github-history-timeline-sync.yml` | ✅ Configured |

### Timeline Event Types
- `SUGGESTION` — Feature suggestions from agents
- `TODO` — Todo items
- `FEATURE` — Feature progress tracking
- `WORKFLOW_STEP` — Workflow step completions
- `AGENT` — Agent lifecycle events
- `NOTE` — Manual timeline notes
- `VIRTUAL` — Synthetic/inferred events
- `COMMENT` — Attached comments

---

## 5. Library ↔ Timeline Integration

The Library and Timeline features are integrated via:
- **Timeline events** stored in the Virtual Library database (`timeline_events` table)
- **Library navigation** providing shelf code + DDC routing for timeline events
- **Agent access** gated per-session (which agents can see which timeline data)
- **GitHub timeline sync** importing commit history as timeline events with narrative edges
- **Email timeline synthesis** extracting plotlines from email data into timeline events
- **Timeline synthesis audit** tracking when and how timeline data was ingested

### Integration Flow
```
GitHub History / Email Data
       ↓
Timeline Import Scripts (scripts/timeline/)
       ↓
Timeline Events + Narrative Edges
       ↓
Supabase: timeline_events table
       ↓
Library Navigation (shelf codes / DDC)
       ↓
Frontend Timeline Visualization (timeline-demo.tsx)
       ↓
E2E Tests (timeline.personal.spec.ts)
```

---

## 6. Legacy → Current Gap Analysis

| Legacy Promise | Current State | Gap |
|---|---|---|
| Phase 3: MCP Enhancement | Not started | Resources/prompts handlers still needed |
| Phase 4: Cron Jobs deployment | Code ready | Deployment pending |
| Phase 5: CloudRuntime activation | 0% | Full system not live |
| SGP Phase 1-6 | Phase 0 (schemas) done | Implement connectors, query service, change stream |
| TWIP Phase 1-4 | Phase 0 (schemas) done | Wire read-only MCP resources, signed publish flow |
| Agent self-registration | Plan documented | Integration with existing auth system |
| CodebaseIndexer cron | Code in place | Not deployed or verified |
| Orchestrator integration | Needs final wiring | Final integration tests pending |

---

## 7. Current State of Directives (Post-Correction)

| Directive | Status |
|---|---|
| **Resource Efficiency** ("Most Performant, Least Costly") | ✅ Active — replaced "Least-Among-Us Barometer" |
| **C++/Rust/LLVM compilation** | ✅ Restored as valid targets for next-gen transition |
| **Merkle Tree integrity** | ✅ Computed across all 15,707 nodes (root: `e1e3232e...`) |
| **Tiered emergency response** | ✅ 10-min Freeze / 15-min Stop |
| **5-department corporate structure** | ✅ Scout, Librarian, Forge, Governance, Connective Journaling |
| **Handoff verification** | ✅ sha256 Merkle Hash with reference implementation |
| **Meta-vetting** | ✅ Assigned to Governance & StaffOps |

---

## 8. Files to Resume Work

### Priority 1: Unresolved Legacy Issues
- `apps/api/src/modules/mcp/` — MCP Phase 3 enhancements
- `scripts/protocols/cron-governance-gate.cjs` — Cron deployment
- `apps/virtual-library-blueprints/` — SGP/TWIP integration

### Priority 2: Current Review Artifacts
- `docs/TNF_SYSTEMATIC_REVIEW_REPORT_v1.3.md` — Full review report
- `data/reviews/codebase_merkle_tree.json` — Merkle tree output
- `docs/protocols/schemas/tnf-merkle-tree.schema.json` — Merkle schema
- `docs/operations/TNF_AUDIT_DIRECTOR_HANDOFF.md` — Session handoff

### Priority 3: Library & Timeline
- `apps/virtual-library-blueprints/supabase/migrations/001_virtual_library_schema.sql` — Schema
- `packages/feature-suggestions/src/services/timeline.service.ts` — Service contract
- `docs/protocols/bridges/tnf-development-journey-timeline-reconstruction.yml` — Reconstruction bridge
- `scripts/timeline/` — All timeline import/synthesis scripts