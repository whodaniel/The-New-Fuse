# TNF Proactive Goal-Achievement & Personal Wizarding Protocol

[CLASS:PRIME] [STATUS:ACTIVE]

**Canonical Location:**
`docs/protocols/TNF_PROACTIVE_GOAL_WIZARDING_PROTOCOL.md`  
**Last Revised:** 2026-08-06  
**Authority:** Sub-Director Swarm / Master System Architect

---

## Executive Vision

TNF's core mission is **to help others achieve their goals**.

Rather than acting as a passive command-line tool that waits for explicit, rigid
user prompts, TNF operates as a **Proactive Goal-Achievement Harness**. The
system actively engages the user through multi-step interactive "Wizarding"
routines to extract context, structure vague intents into trackable milestones,
schedule background executions, and provide continuous status updates.

---

## Multi-Tenant Architecture & Domain Scoping

TNF operates as a **strictly isolated Multi-Tenant Architecture**. The Proactive
Goal-Achievement Engine automatically binds every goal, wizarding session,
contextual asset, and fleet dispatch to the active tenant context:

- **Tenant Isolation:** Every goal record (`Goal`), telemetry event, and
  database entry strictly carries `tenantId`, `orgId`, and `userId` metadata,
  enforced via Supabase RLS policies and API Gateway middleware
  (`apps/api-gateway/src/guards/security.guard.ts`).
- **Tri-Fold Domain Adaptability:**
  1. **Core Dev Domain:** Focuses on framework compliance, system architecture,
     core performance, and strict protocol adherence.
  2. **Agency / Client Domain:** Focuses on client-specific SLAs, isolated
     tenant workspaces, custom branding, ROI/KPI metrics, and tenant-scoped
     credentials.
  3. **Personal Domain:** Focuses on user-centric goal extraction, proactive
     guidance, asset mapping, and personal productivity.

---

## The 5W1H Adaptive Context Matrix

The Wizarding Engine dynamically adjusts its dialogue, recommendations, and
execution plans based on the **5W1H Context Matrix**:

| Dimension | Question                         | Adaptive System Behavior                                                                       |
| :-------- | :------------------------------- | :--------------------------------------------------------------------------------------------- |
| **WHO**   | _Who is the tenant/user?_        | Scopes role permissions, tenant tier (`tenantId`), organization bounds, and target persona.    |
| **WHAT**  | _What is the objective & stack?_ | Discovers codebases, framework choices, required APIs, and technical dependencies.             |
| **WHY**   | _Why does this goal exist?_      | Extracts core business/personal motivation, success metrics, KPIs, and ROI requirements.       |
| **WHEN**  | _When is the deadline/cadence?_  | Configures milestone pacing, cron schedules (`CronExpression`), and urgency priorities.        |
| **WHERE** | _Where is the target surface?_   | Identifies deployment targets (Cloudflare Wasm, Railway, Supabase, local desktop, mobile).     |
| **HOW**   | _How will the work execute?_     | Maps subagent dispatching (`Kilo`, `DevOpsAgent`), verification gates, and D1/D9 safety rails. |

---

## The 5-Stage Wizarding Framework

When a user initiates a goal or when an agent detects an unfulfilled user
intent, the agent executes the **5-Stage Goal-Achievement Wizard**:

```
+-----------------------------------------------------------------------------------+
|                     TNF PROACTIVE GOAL-ACHIEVEMENT FLYWHEEL                        |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  STAGE 1: INTENT & GOAL EXTRACTION (Interactive Wizarding Dialogue)               |
|     ↓                                                                             |
|  STAGE 2: CONTEXTUAL ASSET DISCOVERY (Codebases, APIs, Docs, Credentials)         |
|     ↓                                                                             |
|  STAGE 3: MILESTONE DECONSTRUCTION (Breakdown into atomic GoalTasks)             |
|     ↓                                                                             |
|  STAGE 4: SCHEDULING & AUTONOMOUS DISPATCH (Cron, Subagents, Verification Gates)   |
|     ↓                                                                             |
|  STAGE 5: PROACTIVE TRACKING & RE-ENGAGEMENT (Status Probes, Progress Telemetry)  |
|     ↓ (Self-Evolving Feedback Loop)                                               |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## Stage Specifications

### Stage 1: Intent & Goal Extraction

- **Goal:** Transform ambiguous user desires (e.g., _"I want to launch my app"_)
  into structured, actionable goal records.
- **Wizard Routine:**
  - Ask targeted, non-repetitive clarifying questions (1-3 at a time).
  - Determine category: `project`, `learning`, `infrastructure`, `marketing`,
    `personal`.
  - Assign initial priority (`critical`, `high`, `medium`, `low`).

### Stage 2: Contextual Asset & Resource Discovery

- **Goal:** Surface all environment, codebase, dependency, and tool
  requirements.
- **Wizard Routine:**
  - Inspect local workspace paths, git repositories, and open tools.
  - Identify required MCP servers, API keys, or external service integrations.
  - Verify credential availability safely (prompting via secure CLI or browser
    auth bridge).

### Stage 3: Milestone Deconstruction

- **Goal:** Convert high-level goals into atomic `GoalTask` units.
- **Wizard Routine:**
  - Produce a structured task checklist with explicit completion criteria.
  - Link tasks to specific TNF CLI commands (`tnf build`, `tnf test`,
    `tnf deploy`).
  - Write goal record to `~/.tnf/goals/` and sync with unified cloud ledger
    (`listGoals`/`createGoal`).

### Stage 4: Autonomous Execution & Scheduling

- **Goal:** Delegate sub-tasks to the fleet without requiring manual user
  driving.
- **Wizard Routine:**
  - Assign tasks to specialized subagents (`DevOpsAgent`, `DocImprover-Agent`,
    `CodeQuality-Agent`).
  - Configure background timers (`schedule`) or recurring crons
    (`CronExpression`).
  - Enforce Directives D1 & D9: high-risk actions (process kills, financial
    transactions, git pushes) require operator confirmation.

### Stage 5: Proactive Tracking & Re-Engagement

- **Goal:** Keep the user informed and re-engage proactively when assistance or
  review is needed.
- **Wizard Routine:**
  - Monitor milestone completion and update progress indicators (0-100%).
  - Emit proactive progress summaries to the frontend `GoalsPanel` and terminal
    surfaces.
  - Re-engage user when a task stalls, hits a credential block, or completes a
    major milestone.

---

## Proactive Engagement Rules (Hygiene)

To ensure proactive outreach remains empowering rather than intrusive:

1. **High Leverage Only:** Proactive prompts must offer clear actionable value
   (e.g., _"Step 2 of 4 ready for review"_).
2. **Context Preservation:** Never ask the user for information that is already
   available in git status, `.env`, or workspace telemetry.
3. **Respect Focus:** Batch notifications during active development sessions;
   route non-urgent updates to the background `GoalsPanel`.

---

## Section 6: Integration of Story Architect & Library Voice Routines

The **Story Architect** agent (originating from the Virtual Library
`apps/virtual-library-blueprints` and AI relay `:43120`) provides foundational
routines for interactive goal wizarding and narrative extraction:

1. **Spatial & Narrative Goal Synthesis**: Translates static user tasks into
   living temporal narratives, mapping goals across past achievements, current
   sprint states, and long-term visions.
2. **Ubiquitous Voice & Dialogue Pipeline**: Integrates local STT/KWS (Keyword
   Spotting on `:43110`) and AI relay (`:43120`) to enable continuous hands-free
   voice wizarding ("Enable Voice" routine).
3. **Ubiquity as a Meta-Evolution Axiom**: The Story Architect routines are
   codified as a universal harness standard. Every TNF agent implicitly
   possesses the ability to invoke Story Architect dialogue patterns to guide
   users through personal context extraction and milestone alignment.

---

## Tooling & Command Integration

| Interface         | Command / Surface                | Function                                          |
| :---------------- | :------------------------------- | :------------------------------------------------ |
| **CLI Wizard**    | `tnf wizard`                     | Interactive terminal wizarding flow               |
| **Story Relay**   | `:43120` (`ai-relay`)            | Virtual Library Story Architect voice & AI engine |
| **Goal Create**   | `tnf goals add "<title>"`        | Programmatic goal record creation                 |
| **UI Dashboard**  | `/visualizations` & `GoalsPanel` | Visual milestone & progress tracking              |
| **Fleet Routing** | `tnf send --to <agentId>`        | Dispatch goal sub-tasks to fleet peers            |
| **Skill Bank**    | `tnf-proactive-goal-wizard`      | Agent prompt guidance & skill playbook            |
