---
name: planning-with-files
version: '3.0.0-tnf'
description: |
  Unified Manus-style + BMAD-inspired file-based planning for The New Fuse.
  Creates task_plan.md, findings.md, and progress.md for complex multi-step tasks.
  Integrates with TNF's meta-skills, agent inbox system, and perpetual improvement cycle.
  Supports session recovery, multi-agent orchestration, and context engineering.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - WebFetch
  - WebSearch
  - view_file
  - list_dir
  - run_command
  - mcp_memory_*
hooks:
  PreToolUse:
    - matcher: 'Write|Edit|Bash|Read|Glob|Grep'
      hooks:
        - type: command
          command: 'cat task_plan.md 2>/dev/null | head -30 || true'
  PostToolUse:
    - matcher: 'Write|Edit'
      hooks:
        - type: command
          command:
            "echo '[planning-with-files] File updated. If this completes a
            phase, update task_plan.md status.'"
  Stop:
    - hooks:
        - type: command
          command: |
            if command -v pwsh &> /dev/null && [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OS" == "Windows_NT" ]]; then
              pwsh -ExecutionPolicy Bypass -File "${CLAUDE_PLUGIN_ROOT}/scripts/check-complete.ps1" 2>/dev/null || powershell -ExecutionPolicy Bypass -File "${CLAUDE_PLUGIN_ROOT}/scripts/check-complete.ps1" 2>/dev/null || bash "${CLAUDE_PLUGIN_ROOT}/scripts/check-complete.sh"
            else
              bash "${CLAUDE_PLUGIN_ROOT}/scripts/check-complete.sh"
            fi
---

# Planning with Files - TNF Enhanced Edition

> **Unified framework combining Manus-style persistent planning with
> BMAD-inspired phased workflows.**
>
> Work like Manus: Use persistent markdown files as your "working memory on
> disk." Work like BMAD: Follow structured phases from ANALYSIS → PLANNING →
> SOLUTIONING → IMPLEMENTATION.

---

## TNF Integration Points

This skill integrates with TNF's existing infrastructure:

| TNF System                      | Integration Point                  |
| ------------------------------- | ---------------------------------- |
| **Library of Living Knowledge** | Auto-loaded as meta-context        |
| **Agent Inbox System**          | Tasks route through TNF's inbox    |
| **Skill Builder**               | Patterns extracted for new skills  |
| **Perpetual Improvement Cycle** | Findings feed the 6-hour cron      |
| **DACC-v1 Protocol**            | Multi-agent coordination supported |
| **Jules Delegation**            | Complex sub-tasks can delegate     |

---

## FIRST: Check for Previous Session (v3.0.0)

**Before starting work**, check for unsynced context from a previous session:

```bash
# Check for previous session context
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/session-catchup.py "$(pwd)"

# Also check TNF's session logs
ls -la .agent/session-logs/ 2>/dev/null || true
```

If catchup report shows unsynced context:

1. Run `git diff --stat` to see actual code changes
2. Read current planning files
3. Read `.agent/handoff_notes.txt` if exists
4. Update planning files based on catchup + git diff
5. Then proceed with task

---

## The 3-File Pattern + TNF Extensions

### Core Files (Manus Pattern)

| File           | Purpose                     | When to Update      |
| -------------- | --------------------------- | ------------------- |
| `task_plan.md` | Phases, progress, decisions | After each phase    |
| `findings.md`  | Research, discoveries       | After ANY discovery |
| `progress.md`  | Session log, test results   | Throughout session  |

### TNF Extension Files

| File                            | Purpose                        | When to Create     |
| ------------------------------- | ------------------------------ | ------------------ |
| `.agent/handoff_notes.txt`      | Cross-session context transfer | Before session end |
| `docs/PLAN-{task-slug}.md`      | BMAD-style detailed plan       | For major features |
| `.agent/session-logs/{date}.md` | Persistent session history     | Auto-logged        |

---

## 4-Phase Workflow (BMAD-Inspired)

### Phase Overview

| Phase | Name               | Focus                         | Output                            | Code?      |
| ----- | ------------------ | ----------------------------- | --------------------------------- | ---------- |
| 1     | **ANALYSIS**       | Research, brainstorm, explore | Decisions in `findings.md`        | ❌ NO      |
| 2     | **PLANNING**       | Create plan                   | `task_plan.md` + `docs/PLAN-*.md` | ❌ NO      |
| 3     | **SOLUTIONING**    | Architecture, design          | Design docs                       | ❌ NO      |
| 4     | **IMPLEMENTATION** | Code per plan                 | Working code                      | ✅ YES     |
| X     | **VERIFICATION**   | Test & validate               | Verified project                  | ✅ Scripts |

> 🔴 **Flow:** ANALYSIS → PLANNING → USER APPROVAL → SOLUTIONING → DESIGN
> APPROVAL → IMPLEMENTATION → VERIFICATION

---

## File Locations

| Location                                   | What Goes There                              |
| ------------------------------------------ | -------------------------------------------- |
| Skill directory (`${CLAUDE_PLUGIN_ROOT}/`) | Templates, scripts, reference docs           |
| Your project directory                     | `task_plan.md`, `findings.md`, `progress.md` |
| `docs/` directory                          | `PLAN-{task-slug}.md` for major features     |
| `.agent/` directory                        | Session logs, handoff notes, audits          |

---

## Quick Start

Before ANY complex task:

1. **Create `task_plan.md`** — Use
   [templates/task_plan.md](templates/task_plan.md) as reference
2. **Create `findings.md`** — Use [templates/findings.md](templates/findings.md)
   as reference
3. **Create `progress.md`** — Use [templates/progress.md](templates/progress.md)
   as reference
4. **Check TNF context** — Read `.agent/context/resource-map.md` for available
   skills
5. **Re-read plan before decisions** — Refreshes goals in attention window
6. **Update after each phase** — Mark complete, log errors

> **Note:** Planning files go in your project root, not the skill installation
> folder.

---

## The Core Pattern

```
Context Window = RAM (volatile, limited)
Filesystem = Disk (persistent, unlimited)

→ Anything important gets written to disk.
→ TNF's .agent/ directory is your persistent brain.
```

---

## Critical Rules

### 1. Create Plan First (BMAD Phase 2)

Never start a complex task without `task_plan.md`. Non-negotiable.

For major features, also create `docs/PLAN-{task-slug}.md`:

```bash
# Example naming:
# "e-commerce site" → docs/PLAN-ecommerce-site.md
# "add auth feature" → docs/PLAN-auth-feature.md
```

### 2. The 2-Action Rule

> "After every 2 view/browser/search operations, IMMEDIATELY save key findings
> to text files."

This prevents visual/multimodal information from being lost.

### 3. Read Before Decide (Context Engineering)

Before major decisions:

1. Read the plan file (`task_plan.md`)
2. Read `.agent/context/resource-map.md` for available skills
3. Read relevant `.agent/` documentation This keeps goals AND capabilities in
   your attention window.

### 4. Update After Act

After completing any phase:

- Mark phase status: `in_progress` → `complete`
- Log any errors encountered
- Note files created/modified
- Update `.agent/handoff_notes.txt` if significant

### 5. Log ALL Errors

Every error goes in the plan file. This builds knowledge and prevents
repetition.

```markdown
## Errors Encountered

| Error             | Attempt | Resolution             |
| ----------------- | ------- | ---------------------- |
| FileNotFoundError | 1       | Created default config |
| API timeout       | 2       | Added retry logic      |
```

### 6. Never Repeat Failures (3-Strike Protocol)

```
if action_failed:
    next_action != same_action
```

Track what you tried. Mutate the approach.

---

## The 3-Strike Error Protocol

```
ATTEMPT 1: Diagnose & Fix
  → Read error carefully
  → Identify root cause
  → Apply targeted fix

ATTEMPT 2: Alternative Approach
  → Same error? Try different method
  → Different tool? Different library?
  → NEVER repeat exact same failing action

ATTEMPT 3: Broader Rethink
  → Question assumptions
  → Search for solutions
  → Consider updating the plan
  → Check .agent/skills/ for relevant skills

AFTER 3 FAILURES: Escalate
  → Explain what you tried
  → Share the specific error
  → Consider delegating to Jules (see .agent/skills/jules-delegation/)
  → Ask user for guidance
```

---

## Read vs Write Decision Matrix

| Situation             | Action                          | Reason                        |
| --------------------- | ------------------------------- | ----------------------------- |
| Just wrote a file     | DON'T read                      | Content still in context      |
| Viewed image/PDF      | Write findings NOW              | Multimodal → text before lost |
| Browser returned data | Write to file                   | Screenshots don't persist     |
| Starting new phase    | Read plan/findings              | Re-orient if context stale    |
| Error occurred        | Read relevant file              | Need current state to fix     |
| Resuming after gap    | Read all planning files         | Recover state                 |
| Starting new session  | Read `.agent/handoff_notes.txt` | Get prior context             |

---

## The 5-Question Reboot Test

If you can answer these, your context management is solid:

| Question             | Answer Source                 |
| -------------------- | ----------------------------- |
| Where am I?          | Current phase in task_plan.md |
| Where am I going?    | Remaining phases              |
| What's the goal?     | Goal statement in plan        |
| What have I learned? | findings.md                   |
| What have I done?    | progress.md                   |

### TNF Extended Questions

| Question                 | Answer Source                    |
| ------------------------ | -------------------------------- |
| What skills do I have?   | `.agent/context/resource-map.md` |
| What patterns work?      | `.agent/META_SKILLS_GUIDE.md`    |
| Who can help?            | `.agent/agents/` directory       |
| What's the system state? | `.agent/SYSTEM_STATUS_REPORT.md` |

---

## When to Use This Pattern

**Use for:**

- Multi-step tasks (3+ steps)
- Research tasks
- Building/creating projects
- Tasks spanning many tool calls
- Anything requiring organization
- Cross-session work
- Multi-agent collaboration

**Skip for:**

- Simple questions
- Single-file edits
- Quick lookups

---

## Templates

Copy these templates to start:

- [templates/task_plan.md](templates/task_plan.md) — Phase tracking
  (TNF-enhanced)
- [templates/findings.md](templates/findings.md) — Research storage
- [templates/progress.md](templates/progress.md) — Session logging
- [templates/tnf_handoff.md](templates/tnf_handoff.md) — Cross-session handoff

---

## Scripts

Helper scripts for automation:

- `scripts/init-session.sh` — Initialize all planning files
- `scripts/check-complete.sh` — Verify all phases complete
- `scripts/session-catchup.py` — Recover context from previous session (v2.2.0+)

### TNF Integration Scripts

```bash
# Check TNF system status
cat .agent/SYSTEM_STATUS_REPORT.md

# View available skills
ls .agent/skills/

# Check agent inbox
# (Via TNF's AgentInbox system - see .agent/context/task-system.md)
```

---

## Advanced Topics

- **Manus Principles:** See [reference.md](reference.md)
- **Real Examples:** See [examples.md](examples.md)
- **TNF Meta-Skills:** See `.agent/META_SKILLS_GUIDE.md`
- **Agent Coordination:** See `.agent/context/task-system.md`
- **Perpetual Improvement:** See `.agent/SELF_IMPROVEMENT_CYCLE.md`

---

## Multi-Agent Workflow (TNF-Specific)

When working with multiple agents:

1. **Register with orchestrator** — Tasks route through TNF's inbox system
2. **Use DACC-v1 protocol** — Sign messages with [AGENT-XX]
3. **Delegate when appropriate** — Use Jules for complex async tasks
4. **Update shared context** — Write to `.agent/` for persistence

### Delegation Pattern

```markdown
## When to Delegate to Jules

| Scenario                  | Action                        |
| ------------------------- | ----------------------------- |
| Task takes >30 min        | Consider Jules delegation     |
| Complex implementation    | Use `jules new "description"` |
| Parallel execution needed | Use `jules new --parallel 4`  |
| Blocking on async work    | Delegate and continue         |
```

See `.agent/skills/jules-delegation/SKILL.md` for details.

---

## Anti-Patterns

| Don't                           | Do Instead                      |
| ------------------------------- | ------------------------------- |
| Use TodoWrite for persistence   | Create task_plan.md file        |
| State goals once and forget     | Re-read plan before decisions   |
| Hide errors and retry silently  | Log errors to plan file         |
| Stuff everything in context     | Store large content in files    |
| Start executing immediately     | Create plan file FIRST          |
| Repeat failed actions           | Track attempts, mutate approach |
| Create files in skill directory | Create files in your project    |
| Ignore TNF context              | Read `.agent/context/` first    |
| Work in isolation               | Use TNF's agent coordination    |

---

## Phase X: Verification (BMAD Final Phase)

> 🔴 **DO NOT mark project complete until ALL checks pass.**

### Verification Checklist

```bash
# P0: Lint & Type Check
npm run lint && npx tsc --noEmit

# P0: Security Scan (if .agent/skills/vulnerability-scanner exists)
python ~/.claude/skills/vulnerability-scanner/scripts/security_scan.py .

# P1: UX Audit (if frontend)
python ~/.claude/skills/frontend-design/scripts/ux_audit.py .

# P3: Lighthouse (requires running server)
python ~/.claude/skills/performance-profiling/scripts/lighthouse_audit.py http://localhost:3000

# P4: Build
npm run build
```

### Completion Marker

```markdown
## ✅ PHASE X COMPLETE

- Lint: ✅ Pass
- Security: ✅ No critical issues
- Build: ✅ Success
- Date: [Current Date]
- Handoff: ✅ .agent/handoff_notes.txt updated
```

---

## Session Handoff Protocol (TNF v3.0.0)

Before ending a session with incomplete work:

1. **Update task_plan.md** with current status
2. **Update progress.md** with today's actions
3. **Create/update `.agent/handoff_notes.txt`**:

```markdown
# Handoff Notes - [Date]

## Session Summary

[What was accomplished]

## Current State

- Phase: [X of Y]
- Last file modified: [path]
- Blocking issues: [if any]

## Next Steps

1. [Immediate next action]
2. [Following action]

## Context to Restore

- [Key decisions made]
- [Important findings]
- [Relevant file paths]
```

4. **Commit planning files** (optional but recommended)

---

## Related Documentation

- `.agent/META_SKILLS_GUIDE.md` — How TNF's meta-skills work
- `.agent/THE_PERPETUAL_SYSTEM.md` — System architecture
- `.agent/context/resource-map.md` — All available resources
- `.agent/context/agent-onboarding.md` — Progressive learning path
- `.agent/agents/project-planner.md` — BMAD workflow details

---

**Version:** 3.0.0-tnf  
**Last Updated:** January 22, 2026  
**Status:** Living Document (evolves with TNF)

---

_This skill combines the OthmanAdi/planning-with-files Manus-style approach with
TNF's BMAD-inspired methodology for a unified context engineering framework._
