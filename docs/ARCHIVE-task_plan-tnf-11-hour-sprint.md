# Task Plan: TNF 11-Hour Production Sprint

## Goal

Ship a production-trustworthy TNF web/app surface in 11 hours by eliminating
user-visible mocks/stubs in priority workflows, wiring unsurfaced backend
capabilities, and passing release gates.

## Current Phase

Phase 4 (Implementation) - in progress

## Project Type (TNF-Specific)

| Type          | Value                                               |
| ------------- | --------------------------------------------------- |
| Category      | WEB + BACKEND + INTEGRATION                         |
| Primary Agent | orchestrator + frontend-specialist + api-specialist |
| Tech Stack    | React/Vite + NestJS + Drizzle + Redis/Railway       |

## 11-Hour Command Window

| Window  | Focus                            | Exit Criteria                                                        |
| ------- | -------------------------------- | -------------------------------------------------------------------- |
| H00-H01 | Baseline + queue setup           | Current failures reproduced, lanes assigned, branch strategy set     |
| H01-H04 | Backend endpoint surfacing       | P0 missing/placeholder API surfaces implemented with tests           |
| H04-H07 | Frontend de-mock wiring          | P0 screens no longer use fallback/mock data                          |
| H07-H09 | Integration + E2E hardening      | Critical user journeys green in local smoke/E2E                      |
| H09-H11 | Release gates + deploy checklist | Build, typecheck, lint, smoke pass; handoff + rollback notes written |

## Swarm Lanes (Parallel)

| Lane   | Owner Profile         | Scope                                                                    | Allowed Paths                                                                                     |
| ------ | --------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Lane A | API Surface Agent     | Missing admin/analytics/system endpoints, remove placeholder controllers | `apps/api/src/controllers`, `apps/api/src/modules/**`, `apps/api/src/services/**`                 |
| Lane B | Data Integrity Agent  | Replace mock metric/service responses with real probes                   | `apps/api/src/controllers/system.controller.ts`, related services                                 |
| Lane C | Workflow/A2A Agent    | Remove workflow/A2A frontend mock fallbacks and connect to live APIs     | `apps/frontend/src/services/WorkflowService.ts`, `apps/frontend/src/hooks/useA2ACommunication.ts` |
| Lane D | Admin UI Wiring Agent | Remove mock fallback usage in admin pages/services                       | `apps/frontend/src/pages/Admin/**`, `apps/frontend/src/services/**`                               |
| Lane E | QA/Verification Agent | Tests, regression scans, release gate evidence                           | `apps/*/src/**/*.test*`, `e2e/**`, CI scripts                                                     |

## Phases

### Phase 1: Requirements & Discovery (ANALYSIS)

- [x] Confirm objective: production-ready core surfaces in 11 hours
- [x] Read TNF context and handoff (`resource-map`, `handoff_notes`)
- [x] Inventory mock/stub hotspots in frontend/backend
- [x] Capture findings in `findings.md`
- **Status:** complete
- **Code Allowed:** NO

### Phase 2: Planning & Structure (PLANNING)

- [x] Define swarm lanes and file ownership boundaries
- [x] Define 11-hour timeline with hard checkpoints
- [x] Define priority order based on user-visible impact
- [x] Define merge/review gate policy
- **Status:** in_progress
- **Code Allowed:** NO

### Phase 3: Solutioning (DESIGN)

- [x] Finalize API contracts for each frontend mock replacement
- [x] Produce lane-specific acceptance checks
- [x] Freeze P0 feature list (must-ship vs defer)
- **Status:** complete
- **Code Allowed:** NO

### Phase 4: Implementation

- [ ] Lane A/B backend changes with tests
- [ ] Lane C/D frontend changes with integration checks
- [ ] Remove or isolate unused placeholder controllers
- [ ] Keep commits small and lane-scoped
- **Status:** in_progress
- **Code Allowed:** YES

### Phase X: Verification

- [ ] Run lint/typecheck/build on changed packages
- [ ] Execute smoke tests for P0 flows
- [ ] Validate no user-facing mock fallbacks remain in P0 scope
- [ ] Update `.agent/handoff_notes.txt` with exact deployment/runbook status
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

1. Which exact UI routes are release-blocking in this 11-hour window (P0 only)?
2. For unavailable external providers, should we hard-fail with clear UX
   messaging or soft-degrade with explicit "unavailable" states?

## Decisions Made

| Decision                                              | Rationale                                             |
| ----------------------------------------------------- | ----------------------------------------------------- |
| Optimize for P0 user-visible truth over broad cleanup | Maximizes production readiness impact per hour        |
| Assign strict lane file boundaries                    | Prevents merge contention across many agents          |
| Use hard checkpoints each 2-3 hours                   | Avoids late-stage integration collapse                |
| Do not touch unrelated dirty files                    | Preserves active ongoing work not part of this sprint |

## Errors Encountered

| Error                                             | Attempt | Resolution                                                              |
| ------------------------------------------------- | ------- | ----------------------------------------------------------------------- |
| Missing expected `system-metrics.service.ts` path | 1       | Pivoted to direct `system.controller.ts` scan and targeted file anchors |

## TNF Integration Points

### Skills Used

| Skill                   | Purpose                            | Location                                                  |
| ----------------------- | ---------------------------------- | --------------------------------------------------------- |
| framework-consciousness | System-wide orchestration strategy | `/path/to/.codex/skills/framework-consciousness/SKILL.md` |
| context-frontloader     | Session context bootstrapping      | `/path/to/.codex/skills/context-frontloader/SKILL.md`     |

### Agents Involved

| Agent               | Role                     | Status |
| ------------------- | ------------------------ | ------ |
| orchestrator        | Own timeline/checkpoints | active |
| api-specialist      | Lane A/B                 | queued |
| frontend-specialist | Lane C/D                 | queued |
| qa-verifier         | Lane E                   | queued |

### Jules Tasks (if delegated)

| Task ID | Description                            | Status     |
| ------- | -------------------------------------- | ---------- |
| pending | Create per-lane implementation tickets | to enqueue |

## Dependencies

| Dependency                     | Status  | Notes                                            |
| ------------------------------ | ------- | ------------------------------------------------ |
| Railway API reachability       | at-risk | Previous handoff notes mention DNS flakiness     |
| Redis/relay local availability | at-risk | Required for live orchestration queue operations |
| Auth tokens/env alignment      | pending | Needed for end-to-end admin route verification   |

## Files Created/Modified

- `task_plan.md` (rewritten to executable 11-hour map)

<!--
  WHAT: Track all files created or modified during this task.
  WHY: Helps with review and rollback if needed.
-->

| File         | Action  | Phase |
| ------------ | ------- | ----- |
| task_plan.md | created | 1     |
| findings.md  | created | 1     |
| progress.md  | created | 1     |
|              |         |       |

## Notes

<!--
  REMINDERS:
  - Update phase status as you progress: pending → in_progress → complete
  - Re-read this plan before major decisions (attention manipulation)
  - Log ALL errors - they help avoid repetition
  - Never repeat a failed action - mutate your approach instead
  - Read .agent/context/ for available TNF skills
  - Use 2-Action Rule: Save findings after every 2 view/browser operations
-->

- Update phase status as you progress: pending → in_progress → complete
- Re-read this plan before major decisions (attention manipulation)
- Log ALL errors - they help avoid repetition
- **TNF:** Check `.agent/context/resource-map.md` for available skills
- **TNF:** Update `.agent/handoff_notes.txt` before session end

---

## ✅ PHASE X COMPLETION MARKER

<!--
  Add this section when ALL verification checks pass.
  DO NOT mark complete until scripts have actually run.
-->
<!--
## ✅ PHASE X COMPLETE

- Lint: ✅/❌ [Result]
- Type Check: ✅/❌ [Result]
- Security: ✅/❌ [Result]
- Build: ✅/❌ [Result]
- Date: [Current Date]
- Handoff: ✅ .agent/handoff_notes.txt updated
-->

---

_Template: planning-with-files v3.0.0-tnf (Manus + BMAD)_
