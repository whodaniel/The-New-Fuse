# Task Plan: [Brief Description]

<!--
  WHAT: This is your roadmap for the entire task. Think of it as your "working memory on disk."
  WHY: After 50+ tool calls, your original goals can get forgotten. This file keeps them fresh.
  WHEN: Create this FIRST, before starting any work. Update after each phase completes.

  TNF INTEGRATION: This template follows BMAD-inspired phases and integrates with TNF's
  meta-skills, agent inbox, and perpetual improvement cycle.
-->

## Goal

<!--
  WHAT: One clear sentence describing what you're trying to achieve.
  WHY: This is your north star. Re-reading this keeps you focused on the end state.
  EXAMPLE: "Create a Python CLI todo app with add, list, and delete functionality."
-->

[One sentence describing the end state]

## Current Phase

<!--
  WHAT: Which phase you're currently working on (e.g., "Phase 1", "Phase 3").
  WHY: Quick reference for where you are in the task. Update this as you progress.
-->

Phase 1

## Project Type (TNF-Specific)

<!--
  WHAT: Categorize the project type for proper agent assignment.
  WHY: Ensures correct agents are used (see .agent/agents/project-planner.md)
-->

| Type          | Value                                         |
| ------------- | --------------------------------------------- |
| Category      | WEB / MOBILE / BACKEND / FEATURE / BUG-FIX    |
| Primary Agent | [e.g., frontend-specialist, mobile-developer] |
| Tech Stack    | [e.g., React, Next.js, NestJS]                |

## Phases

<!--
  WHAT: Break your task into 3-7 logical phases. Each phase should be completable.
  WHY: Breaking work into phases prevents overwhelm and makes progress visible.
  WHEN: Update status after completing each phase: pending → in_progress → complete

  BMAD ALIGNMENT:
  - Phase 1: ANALYSIS (Research, brainstorm - NO CODE)
  - Phase 2: PLANNING (Create plan - NO CODE)
  - Phase 3: SOLUTIONING (Architecture, design - NO CODE)
  - Phase 4: IMPLEMENTATION (Code per plan - YES CODE)
  - Phase X: VERIFICATION (Test & validate)
-->

### Phase 1: Requirements & Discovery (ANALYSIS)

<!--
  WHAT: Understand what needs to be done and gather initial information.
  WHY: Starting without understanding leads to wasted effort. This phase prevents that.
  BMAD: This is the ANALYSIS phase - NO CODE WRITING.
-->

- [ ] Understand user intent
- [ ] Identify constraints and requirements
- [ ] Check TNF context: `.agent/context/resource-map.md`
- [ ] Document findings in findings.md
- **Status:** in_progress
- **Code Allowed:** ❌ NO
<!--
  STATUS VALUES:
  - pending: Not started yet
  - in_progress: Currently working on this
  - complete: Finished this phase
-->

### Phase 2: Planning & Structure (PLANNING)

<!--
  WHAT: Decide how you'll approach the problem and what structure you'll use.
  WHY: Good planning prevents rework. Document decisions so you remember why you chose them.
  BMAD: This is the PLANNING phase - NO CODE WRITING.
-->

- [ ] Define technical approach
- [ ] Create file structure plan (don't create actual files yet)
- [ ] Document decisions with rationale
- [ ] Create `docs/PLAN-{task-slug}.md` for major features
- **Status:** pending
- **Code Allowed:** ❌ NO

### Phase 3: Solutioning (DESIGN)

<!--
  WHAT: Architecture, design, and technical specification.
  WHY: Clear design prevents implementation confusion.
  BMAD: This is the SOLUTIONING phase - NO CODE WRITING.
-->

- [ ] Design component/module architecture
- [ ] Specify interfaces and data flows
- [ ] Identify dependencies and integration points
- [ ] Get user approval if needed
- **Status:** pending
- **Code Allowed:** ❌ NO

### Phase 4: Implementation

<!--
  WHAT: Actually build/create/write the solution.
  WHY: This is where the work happens. Break into smaller sub-tasks if needed.
  BMAD: This is the IMPLEMENTATION phase - CODE WRITING ALLOWED.
-->

- [ ] Execute the plan step by step
- [ ] Write code to files before executing
- [ ] Test incrementally
- [ ] Update progress.md after each sub-task
- **Status:** pending
- **Code Allowed:** ✅ YES

### Phase X: Verification

<!--
  WHAT: Verify everything works and meets requirements.
  WHY: Catching issues early saves time. Document test results in progress.md.
  BMAD: This is the VERIFICATION phase - ALWAYS FINAL.
-->

- [ ] Run lint & type check: `npm run lint && npx tsc --noEmit`
- [ ] Run security scan (if applicable)
- [ ] Run build: `npm run build`
- [ ] Verify all requirements met
- [ ] Document test results in progress.md
- [ ] Update `.agent/handoff_notes.txt`
- **Status:** pending
- **Code Allowed:** ✅ Scripts only

## Key Questions

<!--
  WHAT: Important questions you need to answer during the task.
  WHY: These guide your research and decision-making. Answer them as you go.
  EXAMPLE:
    1. Should tasks persist between sessions? (Yes - need file storage)
    2. What format for storing tasks? (JSON file)
-->

1. [Question to answer]
2. [Question to answer]

## Decisions Made

<!--
  WHAT: Technical and design decisions you've made, with the reasoning behind them.
  WHY: You'll forget why you made choices. This table helps you remember and justify decisions.
  WHEN: Update whenever you make a significant choice (technology, approach, structure).
  EXAMPLE:
    | Use JSON for storage | Simple, human-readable, built-in Python support |
-->

| Decision | Rationale |
| -------- | --------- |
|          |           |

## Errors Encountered

<!--
  WHAT: Every error you encounter, what attempt number it was, and how you resolved it.
  WHY: Logging errors prevents repeating the same mistakes. This is critical for learning.
  WHEN: Add immediately when an error occurs, even if you fix it quickly.
  EXAMPLE:
    | FileNotFoundError | 1 | Check if file exists, create empty list if not |
    | JSONDecodeError | 2 | Handle empty file case explicitly |
-->

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
|       | 1       |            |

## TNF Integration Points

<!--
  TNF-SPECIFIC: Track integration with TNF's systems.
-->

### Skills Used

| Skill               | Purpose    | Location                             |
| ------------------- | ---------- | ------------------------------------ |
| planning-with-files | This skill | `.agent/skills/planning-with-files/` |
|                     |            |                                      |

### Agents Involved

| Agent | Role | Status |
| ----- | ---- | ------ |
|       |      |        |

### Jules Tasks (if delegated)

| Task ID | Description | Status                                     |
| ------- | ----------- | ------------------------------------------ |
|         |             | Monitor with `jules remote list --session` |

## Dependencies

<!--
  WHAT: External dependencies, blockers, or waiting items.
  WHY: Makes blockers visible and trackable.
-->

| Dependency | Status           | Notes |
| ---------- | ---------------- | ----- |
|            | pending/resolved |       |

## Files Created/Modified

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
