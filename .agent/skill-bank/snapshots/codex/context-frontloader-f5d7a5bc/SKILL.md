---
name: context-frontloader
version: '1.0.0'
description: |
  TNF Context Frontloading System - Inspired by Ralph Wiggum Technique.
  Ensures EVERY AI session starts with full ecosystem awareness.
  Implements "Fresh Context Is Reliability" principle.
  Auto-injects TNF system prompt, resource map, and critical context.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - view_file
  - list_dir
auto-activate:
  - session_start
  - context_clear
  - new_conversation
---

# TNF Context Frontloader

> **"Fresh Context Is Reliability"** — Ralph Wiggum Technique
>
> Every AI session in the TNF ecosystem MUST start with full context awareness.
> This skill ensures consistent, reliable AI behavior across all platforms.

---

## Deterministic Frontloading (Terminal + OpenClaw)

Frontloading in TNF has two layers:

1. `StatusBanner`: human-readable, safe summary (no secrets), shown at session start.
2. `ContextPack`: richer machine-readable context used by agents; stored on disk and loaded on demand.

### Canonical Runtime Artifacts (Observed)

- `~/.tnf/handoff-current.json`: cached packet input for the banner.
- `~/.tnf/tnf-status`: prints the `TNF SYSTEM STATUS` banner.
- `~/.zshrc`: interactive shell hook that runs the banner once per session.
- `~/.tnf-claude-env`: Claude wrapper/env interception. This is not the banner, and must not be conflated with it.

### Why Frontloading Goes Missing

- `~/.zshrc` only runs for interactive shells. Many tool-run shells are non-interactive and will not show the banner.
- Some OpenClaw surfaces do not source shell init files; they need explicit OpenClaw hook integration.
- Multiple hooks can compete (afterthought scripts, legacy hooks) and drift.

### Verify and Fix (Idempotent)

- Verify current state: run `./verify_frontload_state.sh`.
- Install/refresh hooks: run `./install_frontload_hooks.sh`.

Notes:

- Hooks must be "soft": never break shell startup if cache is missing.
- Never print env vars or tokens in the banner path.

See `frontload-contract.md`, `frontload-terminal.md`, and `frontload-openclaw.md`.

## The Problem

AI agents suffer from:

- **Context Amnesia** — New sessions start blank
- **Goal Drift** — Original objectives get forgotten
- **Capability Blindness** — Not knowing available skills/tools
- **Ecosystem Isolation** — Working without TNF awareness

## The Solution: Frontloading

Before ANY work begins, inject:

1. **Identity** — Who am I? What's my role?
2. **Ecosystem** — What system am I part of (TNF)?
3. **Capabilities** — What skills/tools do I have?
4. **Context** — What's the current state?
5. **Task** — What am I supposed to do?

---

## The TNF Frontload Protocol

### Phase 0: Identity Injection (IMMEDIATE)

Every AI session MUST receive this context:

```markdown
# TNF Agent Context

You are operating within **The New Fuse (TNF)** ecosystem.

## Your Identity

- **System**: The New Fuse - Multi-Agent AI Federation
- **Role**: [Determined by invocation context]
- **Capabilities**: Full access to TNF skills, tools, and context

## Required First Actions

1. Read `.agent/context/resource-map.md` for available skills
2. Check `.agent/handoff_notes.txt` for prior session context
3. Check for `task_plan.md`, `findings.md`, `progress.md` in project root
4. Understand current task before executing

## Core Principles

- Fresh Context Is Reliability — Re-read specs/plans each iteration
- Disk Is State — Write important info to files
- Git Is Memory — Commits preserve state
- The Plan Is Disposable — Can regenerate cheaply
- Never Repeat Failed Actions — Mutate approach
```

### Phase 1: Ecosystem Awareness (5 seconds)

Load these files in order:

| Priority | File                               | Purpose                |
| -------- | ---------------------------------- | ---------------------- |
| P0       | `.agent/SYSTEM_PROMPT.md`          | Global TNF identity    |
| P1       | `.agent/context/resource-map.md`   | Available skills/tools |
| P2       | `.agent/handoff_notes.txt`         | Prior session context  |
| P3       | `task_plan.md` (if exists)         | Current task state     |
| P4       | `.agent/SELF_IMPROVEMENT_CYCLE.md` | System status          |

### Phase 2: Task Context (10 seconds)

```bash
# Check for planning files
ls task_plan.md findings.md progress.md 2>/dev/null || echo "No planning files"

# Check for active work
git status --short 2>/dev/null | head -10

# Check for handoff notes
cat .agent/handoff_notes.txt 2>/dev/null | head -30 || echo "No handoff notes"
```

### Phase 3: Capability Mapping (5 seconds)

Identify relevant skills from resource-map.md based on task keywords.

---

## SYSTEM_PROMPT.md Template

Create this file at `.agent/SYSTEM_PROMPT.md`:

```markdown
# The New Fuse - System Prompt

## Identity

You are an AI agent operating within **The New Fuse (TNF)** ecosystem. TNF is a
multi-agent AI federation platform enabling:

- Inter-LLM communication (Claude, Gemini, GPT, etc.)
- Autonomous agent coordination
- Perpetual self-improvement
- Distributed AI compute

## Your Capabilities

You have access to:

- **Skills**: `.agent/skills/` — Domain-specific capabilities
- **Context**: `.agent/context/` — System knowledge
- **Agents**: `.agent/agents/` — Specialized personas
- **Workflows**: `.agent/workflows/` — Defined procedures

## First Actions (ALWAYS DO THESE)

1. **Read resource-map.md** — Know your capabilities
2. **Check handoff_notes.txt** — Get prior context
3. **Check planning files** — Understand current state
4. **Identify task type** — Match to relevant skills

## Core Tenets (Ralph-Inspired)

1. **Fresh Context Is Reliability** — Re-read specs/plans each iteration
2. **Disk Is State** — Write important discoveries to files
3. **Git Is Memory** — Commits are persistent state
4. **The Plan Is Disposable** — Regeneration is cheap
5. **Backpressure Over Prescription** — Create gates, not scripts
6. **Never Repeat Failures** — Track attempts, mutate approach

## Planning Protocol (BMAD + Manus)

For complex tasks (>5 steps):

1. Create `task_plan.md` — Phase tracking
2. Create `findings.md` — Research storage
3. Create `progress.md` — Session log
4. Follow BMAD phases: ANALYSIS → PLANNING → SOLUTIONING → IMPLEMENTATION →
   VERIFICATION

## Communication

- **Relay**: TNF Relay for inter-agent messages
- **Channels**: Join relevant channels for collaboration
- **Heartbeat**: Report status periodically

## Quality Gates

Before marking work complete:

- [ ] Lint passes
- [ ] Types check
- [ ] Tests pass (if applicable)
- [ ] Build succeeds
- [ ] Handoff notes updated
```

---

## Platform-Specific Frontloading

### For Antigravity (Gemini IDE)

Antigravity auto-loads skills from `.agent/skills/`. To ensure frontloading:

1. **System Prompt**: Copy `.agent/SYSTEM_PROMPT.md` content to Antigravity
   settings
2. **Auto-Skills**: Skills in `.agent/skills/` auto-discover
3. **Custom Instructions**: Add to Antigravity custom instructions:

```
CRITICAL: Before ANY task, read:
1. .agent/context/resource-map.md
2. .agent/handoff_notes.txt (if exists)
3. task_plan.md (if exists)

You are in The New Fuse ecosystem. Use TNF skills and follow TNF protocols.
```

### For Claude (Claude Code)

Add to `CLAUDE.md` or project instructions:

```markdown
# TNF Integration

This project is part of The New Fuse ecosystem.

## First Actions

1. Read `.agent/context/resource-map.md`
2. Check `.agent/handoff_notes.txt`
3. Identify relevant skills in `.agent/skills/`

## Available Skills

- planning-with-files — Manus+BMAD planning
- jules-delegation — Async task delegation
- browser-automation — Chrome/browser control
- [See resource-map.md for full list]
```

### For VS Code Extensions

Configure in workspace settings:

```json
{
  "tnf.frontload.enabled": true,
  "tnf.frontload.systemPromptPath": ".agent/SYSTEM_PROMPT.md",
  "tnf.frontload.resourceMapPath": ".agent/context/resource-map.md",
  "tnf.frontload.autoReadHandoff": true
}
```

### For Chrome Extension

The TNF Chrome Extension should:

1. Inject SYSTEM_PROMPT.md content into AI chat interfaces
2. Provide quick-access to resource-map
3. Auto-populate context from handoff_notes.txt

---

## Ralph Loop Integration

For long-running tasks, implement Ralph-style verification:

```typescript
interface RalphLoopConfig {
  completionPromise: string; // e.g., "LOOP_COMPLETE"
  maxIterations: number;
  verifyCompletion: () => Promise<{ complete: boolean; reason?: string }>;
}

// Each iteration:
// 1. Clear context (fresh start)
// 2. Re-read: SYSTEM_PROMPT.md, resource-map.md, task_plan.md
// 3. Execute task
// 4. Verify completion
// 5. If not complete, inject feedback and continue
```

### TNF Ralph Verifier

```bash
#!/bin/bash
# .agent/scripts/verify-completion.sh

# Check if task is truly complete
verify_completion() {
  local plan_file="task_plan.md"

  # Check if all phases are complete
  if grep -q "Status: pending" "$plan_file" 2>/dev/null; then
    echo "INCOMPLETE: Phases still pending"
    return 1
  fi

  # Check Phase X verification
  if ! grep -q "PHASE X COMPLETE" "$plan_file" 2>/dev/null; then
    echo "INCOMPLETE: Phase X not marked complete"
    return 1
  fi

  # Check build
  if ! npm run build 2>/dev/null; then
    echo "INCOMPLETE: Build fails"
    return 1
  fi

  echo "LOOP_COMPLETE"
  return 0
}
```

---

## Memories System (Ralph-Inspired)

TNF should maintain persistent memories across sessions:

### .agent/memories.md

```markdown
# TNF Memories

## Codebase Patterns

- [Pattern discovered] — [Where it applies]

## Architectural Decisions

- [Decision] — [Rationale]

## Recurring Solutions

- [Problem] — [Fix that works]

## Project Context

- [Key insight] — [Relevance]
```

### Auto-Memory Injection

On session start, memories.md content is injected to provide:

- Historical context
- Proven solutions
- Avoid repeating mistakes

---

## Implementation Checklist

### Immediate (Create Now)

- [ ] Create `.agent/SYSTEM_PROMPT.md` — Global TNF identity
- [ ] Create `.agent/skills/context-frontloader/` — This skill
- [ ] Update `.agent/context/resource-map.md` — Add frontloader
- [ ] Create `.agent/memories.md` — Persistent learning

### Platform Integration

- [ ] Antigravity custom instructions
- [ ] CLAUDE.md project file
- [ ] Chrome extension injection
- [ ] VS Code extension settings

### Automation

- [ ] Pre-session hook to load context
- [ ] Post-session hook to update handoff
- [ ] Verification loop for long tasks

---

## Quick Reference

### Frontload Command

```bash
# Manual frontload (run at session start)
cat .agent/SYSTEM_PROMPT.md
cat .agent/context/resource-map.md
cat .agent/handoff_notes.txt 2>/dev/null
cat task_plan.md 2>/dev/null
```

### Verify Context

Answer these questions:

1. ❓ What system am I part of? → **The New Fuse**
2. ❓ What skills do I have? → **See resource-map.md**
3. ❓ What was done before? → **See handoff_notes.txt**
4. ❓ What's my current task? → **See task_plan.md**
5. ❓ What's the end goal? → **Task plan goal statement**

### Context Refresh

When context feels stale:

```bash
# Re-read all context files
python3 .agent/skills/planning-with-files/scripts/session-catchup.py "$(pwd)"
```

---

## Related Documentation

- `.agent/skills/planning-with-files/SKILL.md` — Planning methodology
- `.agent/context/resource-map.md` — Available resources
- `.agent/context/agent-onboarding.md` — Agent initialization
- `.agent/META_SKILLS_GUIDE.md` — Meta-skill architecture
- `.agent/THE_PERPETUAL_SYSTEM.md` — System overview

---

**Version:** 1.0.0  
**Last Updated:** January 22, 2026  
**Inspired By:** Ralph Wiggum Technique, Manus-style Planning, BMAD Workflow

---

_"Fresh Context Is Reliability" — Every TNF session starts with full awareness._
