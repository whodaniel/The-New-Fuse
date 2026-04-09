# Task Plan: Workflow Builder Module Audit + Completion

## Goal

Audit every module in the drag-and-drop workflow builders (modern + legacy +
enhanced), identify missing or partially wired features (UI → backend →
execution), complete the wiring, and fix UI layout/overlap issues so controls
and information remain usable across responsive sizes. Run QA against
production.

## Current Phase

Phase 1 (Requirements & Discovery) - in progress

## Project Type (TNF-Specific)

| Type          | Value                                          |
| ------------- | ---------------------------------------------- |
| Category      | WEB + BACKEND + INTEGRATION + UX               |
| Primary Agent | orchestrator                                   |
| Tech Stack    | React/Vite + NestJS + Railway + Postgres/Redis |

## Phases

### Phase 1: Requirements & Discovery (ANALYSIS)

- [ ] Confirm workflow builder scope and entry points (modern + legacy +
      enhanced routes/components).
- [ ] Identify all builder modules + their UI controls.
- [ ] Map each module to backend endpoints/data models/execution paths.
- [ ] Capture layout issues and missing wiring in `findings.md`.
- [ ] Capture MCP Tool server-list gap and marketplace integration requirement.
- **Status:** in_progress
- **Code Allowed:** ❌ NO

### Phase 2: Planning & Structure (PLANNING)

- [ ] Build a module inventory matrix with features/controls per module.
- [ ] Define audit checklist (UI behavior, persistence, execution, errors).
- [ ] Create `docs/PLAN-workflow-builder-audit.md` with per-module tasks.
- [ ] Define QA scenarios + acceptance criteria for each module.
- **Status:** pending
- **Code Allowed:** ❌ NO

### Phase 3: Solutioning (DESIGN)

- [ ] Decide instrumentation and tracing approach for end-to-end flows.
- [ ] Define UI layout fixes (grid, container constraints, overflow rules).
- [ ] Specify backend contract updates and migrations (if needed).
- [ ] Get user approval on scope and priorities before implementation.
- **Status:** pending
- **Code Allowed:** ❌ NO

### Phase 4: Implementation

- [ ] Complete backend wiring for missing module features.
- [ ] Fix UI layout/overlap issues and responsive behavior.
- [ ] Add/update tests or smoke checks for modules touched.
- [ ] Update `progress.md` after each module pass.
- **Status:** pending
- **Code Allowed:** ✅ YES

### Phase X: Verification

- [ ] Run lint/type checks and build for affected packages.
- [ ] Run targeted E2E or smoke flows for workflow builder.
- [ ] Verify each module's features behave end-to-end.
- [ ] Update `.agent/handoff_notes.txt` with final status.
- **Status:** pending
- **Code Allowed:** Scripts/tests only

## P0 Targets (Must Ship)

1. Workflow services/UI no longer return mock workflows on API failure path.
2. A2A communication hook no longer seeds hardcoded agents.
3. Admin/system observability endpoints return real health/metrics signals.
4. Placeholder/legacy API controller paths are either wired to real service or
   explicitly removed from runtime routing.
5. Core admin and agent management UI paths use backend truth, not local demo
   data.

## Priority Backlog (File Anchors)

| Priority | Item                                     | Files                                                                                         |
| -------- | ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| P0       | Workflow mock fallback removal           | `apps/frontend/src/services/WorkflowService.ts`                                               |
| P0       | A2A mock agent list removal              | `apps/frontend/src/hooks/useA2ACommunication.ts`                                              |
| P0       | Placeholder API controller audit/removal | `apps/api/src/controllers/AgentController.ts`, `apps/api/src/controllers/agent.controller.ts` |
| P0       | System mock response replacement         | `apps/api/src/controllers/system.controller.ts`                                               |
| P1       | Admin/user fallback mock cleanup         | `apps/frontend/src/pages/Admin/UserManagement.tsx` and related admin pages                    |
| P1       | Chat mock response path replacement      | `apps/api/src/modules/chat/chat.service.ts`                                                   |
| P2       | Non-critical demo pages/features cleanup | community/NFT/task demo surfaces                                                              |

## Key Questions

1. Which workflow builder variant is authoritative (Modern vs Enhanced vs
   legacy)?
2. What is the complete list of builder modules and their expected behaviors?
3. Which backend services are considered the source of truth for workflow
   execution and saving?
4. What production environment should be used for QA verification (production
   confirmed)?
5. Which MCP marketplace directory should be offered as the optional external
   source, and what should be the default/reset behavior?

## Decisions Made

| Decision                                                     | Rationale                                                 |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| Audit per-module with an explicit UI→API→execution checklist | Ensures end-to-end completeness and avoids partial wiring |
| Include modern + legacy + enhanced builders in audit scope   | Matches production reality and avoids missing regressions |
| QA against production                                        | Confirms live behavior and data wiring                    |
| Separate discovery/planning from implementation              | Prevents rework and captures scope before coding          |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
|       | 1       |            |

## TNF Integration Points

### Skills Used

| Skill               | Purpose                              | Location                                                                         |
| ------------------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| planning-with-files | Persistent planning + phase tracking | `.agent/skills/planning-with-files/`                                             |
| orchestrator-agent  | High-level plan + coordination       | `/Users/<owner>/.codex/skills/imported-claude-agents/orchestrator-agent/` |

### Agents Involved

| Agent               | Role                     | Status |
| ------------------- | ------------------------ | ------ |
| orchestrator        | Own timeline/checkpoints | active |
| api-specialist      | Lane A/B                 | queued |
| frontend-specialist | Lane C/D                 | queued |
| qa-verifier         | Lane E                   | queued |

### Jules Tasks (if delegated)

| Task ID | Description | Status |
| ------- | ----------- | ------ |
|         |             |        |

## Dependencies

| Dependency        | Status   | Notes                                                                  |
| ----------------- | -------- | ---------------------------------------------------------------------- |
| Local repo access | resolved | `/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse`          |
| Runtime env vars  | pending  | Need Railway/prod or local env configuration for end-to-end validation |
| UI access         | pending  | Need confirmation of target builder route(s) and module scope          |

## Files Created/Modified

| File         | Action  | Phase |
| ------------ | ------- | ----- |
| task_plan.md | updated | 1     |
| findings.md  | pending | 1     |
| progress.md  | pending | 1     |

## Notes

- Update phase status as you progress: pending → in_progress → complete
- Re-read this plan before major decisions
- Log ALL errors
- Use 2-Action Rule: Save findings after every 2 view/browser operations
- Update `.agent/handoff_notes.txt` before session end

---

_Template: planning-with-files v3.0.0-tnf (Manus + BMAD)_
