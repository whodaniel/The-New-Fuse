# Specialist Skill Backlog

Use this file to decide which niche expert skills/agents should be created next as planning gaps are discovered.

## Table of contents

1. Gap detection workflow
2. Existing coverage map
3. Gap severity rubric
4. Skill spec card template
5. Prioritization method

## 1) Gap detection workflow

1. List all capabilities required by the current plan.
2. Map each capability to available skills.
3. Label each capability:
   - `Covered`
   - `Partially covered`
   - `Not covered`
4. Create new skill cards for `Partially covered` and `Not covered` items.
5. Prioritize cards by risk and execution dependency.

## 2) Existing coverage map

Use this as a starting point (not exhaustive).

- Business model and monetization:
  - `business-model-architect-agent`
  - `monetization-strategy-agent`
  - `funnel-economics-analyst-agent`
  - `sales-funnel-architect-agent`
  - `value-ladder-architect-agent`
- Market and niche:
  - `niche-analyst-agent`
  - `competitive-intelligence-agent`
  - `keyword-research-agent`
- Audience and growth:
  - `audience-persona-architect-agent`
  - `audience-segmentation-agent`
  - `traffic-generation-agent`
  - `lead-capture-agent`
- Product and offer development:
  - `digital-product-creator-agent`
  - `digital-product-factory-agent`
  - `business-model-architect-agent`
- Operations and finance:
  - `financial-manager-agent`
  - `tax-compliance-agent`
  - `legal-compliance-agent`
- Cross-agent routing:
  - `task-agent-router`
  - `orchestrator-agent`

If a needed capability is not clearly covered by one of these, treat it as a candidate new skill.

## 3) Gap severity rubric

Score each gap from `1` to `5` on:

- Strategic impact if unresolved
- Time sensitivity
- Revenue or margin impact
- Risk exposure (legal/operational/financial)
- Reuse potential across future plans

Priority rules:

- `P0`: total score >= 20 or a blocking dependency
- `P1`: total score 14-19
- `P2`: total score <= 13

## 4) Skill spec card template

Use this exact template:

```markdown
Skill Spec Card
- Proposed name:
- Priority: P0 | P1 | P2
- Problem this skill solves:
- Trigger conditions:
- Inputs required:
- Outputs required:
- Workflow steps:
  1.
  2.
  3.
- Reusable resources needed:
  - scripts:
  - references:
  - assets:
- Validation checks:
- Dependencies (skills/tools/data):
```

Optional SKILL.md frontmatter starter for the new skill:

```yaml
---
name: proposed-skill-name
description: Briefly state what the skill does and exactly when to trigger it.
---
```

## 5) Prioritization method

Build a rolling backlog with these columns:

- `Skill name`
- `Priority`
- `Blocking which plan milestone`
- `Owner`
- `Target completion window`
- `Current status`

Re-rank backlog whenever a core assumption changes.

