# 🧠 THE NEW FUSE - INFORMATION SEQUENCING PROTOCOL

## Purpose

This document defines the **optimal order** in which information should be
presented to AI agents working on TNF. The sequence is critical because:

1. **Context window limitations** - Earlier information has more weight
2. **Coherence drift** - Without proper sequencing, agents lose track of goals
3. **Progressive understanding** - Complex systems require layered comprehension
4. **Handoff continuity** - Session-to-session consistency depends on proper
   priming

---

## 📊 THE MASTER SEQUENCE

### Phase 1: Orientation (ALWAYS READ FIRST)

```
┌────────────────────────────────────────────────────────────────┐
│                    PHASE 1: ORIENTATION                        │
│                    (Read before any task)                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. docs/TNF_AUTONOMOUS_SYSTEMS_ANALYSIS.md                   │
│     ├── Purpose: System architecture & vision                 │
│     ├── Sets: Mental model of the system                      │
│     └── Time: ~5 min read                                     │
│                                                                │
│  2. docs/VERIFIED_CODEBASE_AUDIT.md                           │
│     ├── Purpose: Current implementation status                │
│     ├── Sets: What exists vs what's stubbed                   │
│     └── Time: ~3 min read                                     │
│                                                                │
│  3. docs/protocols/reports/SESSION_HANDOFF_LATEST.json (if exists) │
│     ├── Purpose: Previous session context                     │
│     ├── Sets: Continuity from last session                    │
│     └── Time: ~1 min read                                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Phase 2: Protocol Loading (Based on Task Type)

```
┌────────────────────────────────────────────────────────────────┐
│                    PHASE 2: PROTOCOL LOADING                   │
│                    (Based on task type)                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  For DEVELOPMENT tasks:                                        │
│    4a. .claude/commands/README.md                             │
│    4b. .agent/HANDOFF_PROMPT.md                               │
│    4c. packages/core/src/services/DirectorService.ts          │
│                                                                │
│  For SELF-IMPROVEMENT tasks:                                   │
│    4a. .claude/commands/self-improve.md                       │
│    4b. packages/core/src/services/agent-swarm-orchestration   │
│    4c. packages/agent/src/bridges/cascade_bridge.ts           │
│                                                                │
│  For DEBUGGING tasks:                                          │
│    4a. Recent error logs/output                               │
│    4b. Relevant source files                                  │
│    4c. Test files for the module                              │
│                                                                │
│  For DOCUMENTATION tasks:                                      │
│    4a. Existing docs in the area                              │
│    4b. Source code being documented                           │
│    4c. Related API documentation                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Phase 3: Deep Context (Specific to Work Area)

```
┌────────────────────────────────────────────────────────────────┐
│                    PHASE 3: DEEP CONTEXT                       │
│                    (Specific to work area)                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  5. Primary source files for the task                         │
│     ├── Use: view_file_outline first                          │
│     ├── Then: view_file for specific functions                │
│     └── Note: Don't re-read what's already in context         │
│                                                                │
│  6. Related tests (if modifying code)                         │
│     └── Ensures changes don't break existing functionality    │
│                                                                │
│  7. Integration points                                        │
│     └── Files that import/use the files being modified        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 THE HANDOFF CYCLE

Every session must end with handoff documentation to maintain continuity:

```
SESSION START                          SESSION END
     │                                      │
     ▼                                      │
┌─────────────┐                       ┌─────────────┐
│ Read Handoff│◄──────────────────────│Write Handoff│
│   Notes     │                       │   Notes     │
└──────┬──────┘                       └──────▲──────┘
       │                                     │
       ▼                                     │
┌─────────────┐                       ┌─────────────┐
│  Load       │                       │  Summarize  │
│  Protocols  │                       │  Progress   │
└──────┬──────┘                       └──────▲──────┘
       │                                     │
       ▼                                     │
┌─────────────┐                       ┌─────────────┐
│   Execute   │─────────────────────►│  Capture    │
│   Tasks     │                       │  Learnings  │
└─────────────┘                       └─────────────┘
```

### Handoff Template

```markdown
## Session Handoff: [DATE]

### What Was Accomplished

1. [Task 1 - outcome]
2. [Task 2 - outcome]

### What Was Learned

- [Insight about codebase]
- [Pattern discovered]

### What Remains

1. [Next task - priority]
2. [Blocked item - why]

### Important Context

- [Critical state to remember]
- [Key decision made and why]

### Files Modified

- path/to/file1.ts
- path/to/file2.ts

### Recommended Next Steps

1. [Step 1]
2. [Step 2]
```

---

## 📋 WORK PLAN (PRD) PROTOCOL

For any significant work, create a PRD before starting:

### PRD Location

```
.agent/artifacts/prd-[task-name].md
```

### PRD Template

```markdown
# PRD: [Task Name]

## Overview

Brief description of what needs to be built/changed.

## Goals

1. Primary goal
2. Secondary goal

## Non-Goals

- What this does NOT include

## Current State

- What exists now
- Current limitations

## Proposed Solution

### Architecture

[Diagram or description]

### Implementation Steps

1. [ ] Step 1
2. [ ] Step 2
3. [ ] Step 3

### Files to Modify

- `path/file1.ts` - description
- `path/file2.ts` - description

### Files to Create

- `path/newfile.ts` - purpose

## Success Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Dependencies

- What must be done first
- External dependencies

## Risks

- Risk 1: mitigation
- Risk 2: mitigation

## Timeline Estimate

- Phase 1: X hours
- Phase 2: Y hours

## Acceptance Tests

1. Test case 1
2. Test case 2
```

---

## 🎯 DOCUMENT TYPE → SEQUENCE MAPPING

| Task Type               | Primary Documents                  | Secondary Documents                 |
| ----------------------- | ---------------------------------- | ----------------------------------- |
| **Feature Development** | PRD → Source Files → Tests         | Architecture docs, Related features |
| **Bug Fixing**          | Error logs → Source → Tests        | Git history, Related bugs           |
| **Refactoring**         | Source → Tests → Dependents        | Patterns doc, Style guide           |
| **Self-Improvement**    | self-improve.md → Swarm → Director | Metrics, Past improvements          |
| **Documentation**       | Source → Existing docs → API       | Examples, User feedback             |
| **Testing**             | Source → Existing tests → Coverage | Test patterns, Fixtures             |
| **Integration**         | Both systems' docs → Source        | Protocols, Schemas                  |

---

## 🔗 PROMPT CHAINS FOR ORCHESTRATION

### Chain 1: Initialize New Session

```
1. "Read HANDOFF_PROMPT.md to understand methodology"
2. "Read docs/protocols/reports/SESSION_HANDOFF_LATEST.json for previous context"
3. "Summarize: What is the current state?"
4. "What are the priority next steps?"
```

### Chain 2: Begin Development Task

```
1. "Review the PRD for [task]"
2. "Read source files: [file1], [file2]"
3. "Read related tests: [test1], [test2]"
4. "Before coding, summarize your understanding"
5. "Implement step [X] of the PRD"
```

### Chain 3: Complete Session

```
1. "Summarize what was accomplished"
2. "What did you learn about the codebase?"
3. "What remains to be done?"
4. "Update docs/protocols/reports/SESSION_HANDOFF_LATEST.json with this context"
```

### Chain 4: Self-Improvement Cycle

```
1. "Run /self-improve 'scope' 'false'"
2. "Analyze: What improvements were identified?"
3. "Prioritize: Which improvements have highest impact?"
4. "Implement: Execute top 3 improvements"
5. "Measure: What metrics improved?"
6. "Document: Update insights in handoff"
```

---

## 🚫 ANTI-PATTERNS TO AVOID

### ❌ Information Overload

**Problem**: Loading too many files at once **Solution**: Use progressive
disclosure, start with outlines

### ❌ Context Drift

**Problem**: Forgetting initial goals mid-task **Solution**: Reference
PRD/handoff regularly

### ❌ Circular Reading

**Problem**: Re-reading the same files **Solution**: Note what's in context,
don't re-view

### ❌ Unsequenced Loading

**Problem**: Reading implementation before architecture **Solution**: Always
follow the phase sequence

### ❌ Missing Handoff

**Problem**: Session ends without capturing context **Solution**: Always write
handoff before ending

---

## ✅ CHECKLIST: Before Starting Any Task

- [ ] Read orientation documents (Phase 1)
- [ ] Check for existing PRD or create one
- [ ] Review previous handoff notes
- [ ] Load task-appropriate protocols (Phase 2)
- [ ] Understand the full context before coding

## ✅ CHECKLIST: Before Ending Any Session

- [ ] Summarize what was accomplished
- [ ] Note any unexpected learnings
- [ ] Document what remains
- [ ] Update docs/protocols/reports/SESSION_HANDOFF_LATEST.json
- [ ] Create/update PRD if needed

---

## 📍 QUICK REFERENCE: FILE LOCATIONS

| Purpose               | Location                                                          |
| --------------------- | ----------------------------------------------------------------- |
| System Architecture   | `docs/TNF_AUTONOMOUS_SYSTEMS_ANALYSIS.md`                         |
| Implementation Status | `docs/VERIFIED_CODEBASE_AUDIT.md`                                 |
| Handoff Notes         | `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`              |
| Audit Methodology     | `.agent/HANDOFF_PROMPT.md`                                        |
| Workflows             | `.agent/workflows/*.md`                                           |
| Claude Commands       | `.claude/commands/*.md`                                           |
| Self-Improvement      | `.claude/commands/self-improve.md`                                |
| PRDs                  | `.agent/artifacts/prd-*.md`                                       |
| Director Service      | `packages/core/src/services/DirectorService.ts`                   |
| Swarm Orchestration   | `packages/core/src/services/agent-swarm-orchestration.service.ts` |
| Universal Bridge      | `packages/agent/src/bridges/universal_bridge.ts`                  |

---

_This protocol ensures AI agents maintain coherence across sessions and work
efficiently within context limitations._
