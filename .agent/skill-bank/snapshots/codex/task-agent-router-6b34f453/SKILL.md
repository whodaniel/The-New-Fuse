---
name: task-agent-router
description: Triage messy or ambiguous work requests, identify what actually needs to be done first, and select the best-fit agent or agent sequence for execution. Use when a user asks which tasks to work on, which agents to use, how to delegate work across multiple agents, or how to turn a broad goal into an executable multi-agent plan.
---

# Task Agent Router

Convert high-level goals into a prioritized task list and a clear agent deployment plan.

## Workflow

1. Parse the user request into candidate tasks.
2. Read [task-intake-signals.md](references/task-intake-signals.md) and extract:
   - Deliverable type
   - Urgency and deadline
   - Risk level (legal, financial, production-impacting)
   - Required systems or tools
3. Score and rank tasks by impact, urgency, and dependency:
   - Prioritize blockers and prerequisite work
   - Collapse duplicate or overlapping tasks
4. Read [agent-selection-matrix.md](references/agent-selection-matrix.md) and match each task to:
   - Primary agent (owner)
   - Optional supporting agents
   - Expected handoff order when multiple agents are needed
5. Score top candidate agents using [fit-scoring-rubric.md](references/fit-scoring-rubric.md):
   - Compute score out of 100 for each candidate
   - Select highest-scoring agent as primary
   - Keep second-best agent as backup when score gap is small
6. Produce an execution plan with explicit sequencing:
   - `Now`: start immediately
   - `Next`: dependent follow-up work
   - `Later`: optional optimization work
7. Confirm feasibility before executing:
   - Ensure every selected agent has a clear deliverable
   - Avoid redundant agents unless parallelism is necessary
   - Note assumptions when task scope is ambiguous

## Routing Rules

- Default to one primary agent per task.
- Add a second agent only if it materially improves output quality, speed, or compliance.
- Apply precedence in this order: objective match -> keyword override -> multi-agent chain.
- Route orchestration-heavy requests to `orchestrator-agent` first, then to specialists.
- Route legal, compliance, or policy-sensitive work to compliance-first agents before growth agents.
- Route ambiguous requests through a short clarification pass, then finalize routing.
- Reject weak matches: if confidence is below 70%, provide top 2 options with tradeoffs.
- If top two candidates are within 8 points, return both with a recommendation.

## Output Format

Return results in this exact structure:

```markdown
Task Triage
- Task 1: <clear task statement>
- Task 2: <clear task statement>

Priority Order
1. <task> - <why now>
2. <task> - <why second>

Agent Deployment
1. <task>
   Primary: <agent-name>
   Support: <agent-name or none>
   Fit Score: <0-100>
   Why: <one sentence>
2. <task>
   Primary: <agent-name>
   Support: <agent-name or none>
   Fit Score: <0-100>
   Why: <one sentence>

Execution Sequence
1. Now: <actions>
2. Next: <actions>
3. Later: <actions>

Assumptions / Risks
- <assumption or risk>
```

## Quality Bar

- Keep task statements concrete and testable.
- Keep rationale short and evidence-based.
- Prefer deterministic workflows over broad brainstorming.
- Flag missing inputs instead of guessing critical constraints.
