---
description:
  Activates the Context Frontloading System to ensure full ecosystem awareness
  at the start of a session.
---

# /frontload - Context Frontloading Protocol

> **"Fresh Context Is Reliability"** — Ralph Wiggum Technique

Use this command at the start of every session or when switching contexts to
ensure you are fully aligned with the TNF ecosystem.

## 🔴 Execution Steps

1. **Load Global Identity**:
   - Read `.agent/SYSTEM_PROMPT.md` to establish core identity and principles.

2. **Discover Capabilities**:
   - Read `.agent/context/resource-map.md` to map available skills and tools.

3. **Restore Session State**:
   - Read `.agent/handoff_notes.txt` for previous session context.
   - Read `task_plan.md`, `findings.md`, and `progress.md` if they exist in the
     project root.

4. **Synchronize Memories**:
   - Read `.agent/memories.md` to load accumulated wisdom and codebase patterns.

5. **Verify Context**:
   - Confirm you understand:
     - ❓ Current Task (from `task_plan.md`)
     - ❓ Available Skills (from `resource-map.md`)
     - ❓ Previos Failures/Successes (from `memories.md` and
       `handoff_notes.txt`)

---

## 🟢 Expected Outcome

After running this command, the agent will:

- Know exactly WHO they are (TNF Agent)
- Know exactly WHERE they are (Current task phase)
- Know exactly WHAT they can do (Available skills)
- Be ready to execute with "Fresh Context" reliability.

---

## Usage

```
/frontload
```

_This command is highly recommended for multi-agent federation and cross-session
work._
