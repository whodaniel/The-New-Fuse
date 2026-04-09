---
description:
  Activates the Protocol Alignment Framework and loads the appropriate
  procedural matrix for the current task.
---

1. **Load Context**:
   - Read `docs/PROTOCOL_ALIGNMENT_FRAMEWORK.md` to understand the 4-level
     protocol hierarchy.
   - Read `docs/PROCEDURAL_SKILL_MATRICES.md` to access the specific checklists.

2. **Analyze Context**:
   - Determine the **User Role**: Is this meant for a Human Developer
     (onboarding, manual coding) or an AI Agent (autonomous execution)?
   - Determine the **Task Type**:
     - New Feature Implementation
     - Bug Fixing / Debugging
     - Documentation
     - Multi-Agent Orchestration
     - System/Agent Optimization

3. **Select Matrix**:
   - Based on the User Role and Task Type, select the matching **Procedural
     Skill Matrix** (e.g., Matrix 5 for Feature Dev, Matrix 6 for Debugging).

4. **Initiate Protocol**:
   - Present the **Summary** of the selected matrix:
     - **Priority Level** (P0-P4)
     - **Time Estimate**
     - **Prerequisites**
   - Execute **Phase 1** of the selected matrix immediately.
   - Ask the user for confirmation to proceed to Phase 2.
