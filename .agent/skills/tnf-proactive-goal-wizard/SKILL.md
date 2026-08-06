---
name: tnf-proactive-goal-wizard
description:
  Proactively engage with the user via multi-step interactive wizarding to
  surface goals, contextual assets, milestones, schedules, and task tracking.
  Use whenever the user expresses a high-level goal, asks for help structuring a
  project, or wants autonomous assistance tracking and achieving personal or
  system goals.
---

# TNF Proactive Goal-Achievement & Personal Wizarding Skill

This skill guides agents in **proactively assisting users to achieve their
personal and system goals** through structured, multi-step interactive
"Wizarding" routines.

---

## Operating Mandate

Agents utilizing this skill must **NEVER** remain passive. When a user states a
vague desire or initiates a project, the agent proactively guides the user
through the 5-Stage Wizarding Framework:

1. **Intent Extraction**: Ask targeted, non-repetitive questions to define the
   true underlying goal.
2. **Context Surface**: Discover workspace assets, codebases, APIs, and
   credentials needed for execution.
3. **Milestone Deconstruction**: Break the goal down into atomic, trackable
   tasks with explicit completion criteria.
4. **Autonomous Dispatch**: Delegate tasks to specialized fleet peers
   (`DevOpsAgent`, `DocImprover-Agent`, `CodeQuality-Agent`) and schedule
   background timers.
5. **Proactive Tracking**: Continuously update goal progress (0-100%) and
   re-engage the user at key milestones or when review/confirmation is required.

---

## The 5-Step Wizarding Dialogue Pattern

### Step 1: Goal Clarification Prompt

When the user states a goal (e.g., _"I want to launch TNF Agentic"_), respond
with a structured 3-part clarification:

- **Core Objective**: What does success look like?
- **Target Category**: `project`, `learning`, `infrastructure`, `marketing`,
  `personal`.
- **Target Deadline / Priority**: When is this needed? (`critical`, `high`,
  `medium`, `low`).

### Step 2: Resource & Asset Inventory

Before writing code, surface the required assets:

- Workspace repositories & file paths.
- Required credentials / environment variables.
- Active MCP tools or services needed.

### Step 3: Milestone Creation

Use `tnf goals` CLI or `GoalsService` to persist the goal:

```bash
tnf goals add "Launch TNF Agentic Campaign" --category marketing --priority high
```

Break the goal down into 3-5 concrete tasks with completion checkboxes.

### Step 4: Fleet Delegation & Scheduling

Assign tasks to specialized fleet agents:

- Code tasks $\rightarrow$ `Kilo` / `CodeQuality-Agent`
- Deployments $\rightarrow$ `DevOpsAgent`
- Documentation $\rightarrow$ `DocImprover-Agent`
- Timers $\rightarrow$ `schedule` tool (e.g., `DurationSeconds=600`)

### Step 5: Proactive Progress Report & Story Architect Voice Relay

When tasks complete or hit a milestone, update the user with a clean summary
banner:

```
=== TNF Goal Progress Update ===
Goal: Launch TNF Agentic Campaign (80% Complete)
  ✓ Task 1: Generate Marketing Pack (Done)
  ✓ Task 2: Polish Landing Page UX (Done)
  ✓ Task 3: Setup Self-Evolution Flywheel (Done)
  ~ Task 4: Execute Show HN & X Thread Launch (Pending Review)
Next Action: Ready for operator confirmation to push live.
================================
```

For hands-free interactive dialogue, trigger the **Story Architect AI Relay**
(`apps/virtual-library-blueprints/ai-relay` on port `:43120`) and KWS audio
pipeline (`:43110`) so the user can interact via voice.

---

## Proactive Rules

- **Story Architect Ubiquity**: Treat Story Architect narrative extraction as a
  foundational meta-evolution axiom. Transform dry task lists into meaningful
  personal milestones.
- **Do Not Guess**: Always verify workspace state using ripgrep, view_file, or
  `tnf` CLI tools before asking the user.
- **Respect Directives D1 & D9**: High-risk mutations (git pushes, process
  kills, financial actions) always require explicit operator confirmation.
- **Keep Progress Fresh**: Sync local goal status with
  `~/.tnf/goals/config.json` and the frontend `GoalsPanel`.
