---
name: long-range-business-plan-architect
description: Build or refine an interactive long-range business plan (3-10 years) using staged user interviews, evidence-backed research, scenario modeling, and execution roadmapping. Use when a user asks for a business plan, long-term strategy, strategic clarity, business-model stress testing, or discovery of missing niche expert skills/agents needed to execute the plan.
---

# Long-Range Business Plan Architect

## Overview

Guide the user through a structured planning sequence that produces a decision-ready long-range business plan and a prioritized backlog of specialist skills/agents to build next.

## Workflow

1. Set the planning frame.
2. Run interactive discovery loops.
3. Form strategic hypotheses.
4. Run deep research loops.
5. Build the long-range plan package.
6. Discover specialist skill gaps and define new skill cards.
7. Finalize decisions and 90-day execution plan.

## 1) Set the planning frame

1. Confirm planning horizon (`3`, `5`, or `10` years).
2. Confirm business scope (single offer, multi-offer portfolio, platform, agency, media, etc.).
3. Confirm success definition (profit, cash flow, valuation, lifestyle constraints, impact goals).
4. If the user has no structure yet, generate a scaffold with:
   - `python scripts/build_plan_scaffold.py --business-name "<name>" --horizon-years 5`

## 2) Run interactive discovery loops

Use short rounds. Ask at most 3 focused questions per turn.

After each round, produce:
- `What I Heard`
- `Assumptions Logged`
- `Unknowns Remaining`
- `Next Questions (max 3)`

Use [references/question-bank.md](references/question-bank.md) to choose the next highest-leverage questions based on what is still unknown.

## 3) Form strategic hypotheses

Translate responses into explicit hypotheses before heavy research.

Minimum hypothesis set:
- Customer/problem hypothesis
- Offer/value hypothesis
- Business model hypothesis
- Growth channel hypothesis
- Unit economics hypothesis
- Capability/risk hypothesis

For each hypothesis, include:
- Confidence level (`high`, `medium`, `low`)
- Evidence currently available
- Evidence required to confirm/reject

## 4) Run deep research loops

Use [references/research-protocol.md](references/research-protocol.md).

For each low-confidence or high-impact hypothesis:
1. Define research question.
2. Collect evidence from primary or authoritative sources first.
3. Log source date, geography, and relevance.
4. Summarize findings and decision impact.
5. Update confidence level and planning assumptions.

When assumptions are time-sensitive (regulation, market rates, platform shifts, cost benchmarks), verify with current sources before recommending decisions.

## 5) Build the long-range plan package

Deliver a compact but complete package:

1. Executive summary
2. Strategic thesis and positioning
3. Customer and market model (TAM/SAM/SOM where possible)
4. Business model design (revenue streams, pricing logic, margin logic)
5. Growth model (acquisition, retention, expansion)
6. Operating model and capability roadmap
7. Financial scenarios (`base`, `upside`, `downside`)
8. Risk register with mitigations and trigger indicators
9. KPI tree and measurement cadence
10. 90-day action plan with sequencing

If a section is uncertain, mark it explicitly and attach required research next actions.

## 6) Discover specialist skill gaps

Use [references/specialist-skill-backlog.md](references/specialist-skill-backlog.md).

1. Compare required plan capabilities vs available skills.
2. Separate:
   - `Covered by existing skills`
   - `Partially covered`
   - `Not covered`
3. For each `Partially covered` or `Not covered` area, create a `Skill Spec Card` containing:
   - Proposed skill name
   - Trigger description
   - Workflow outline
   - Required resources (`scripts`, `references`, `assets`)
   - Validation criteria
   - Priority (`P0`, `P1`, `P2`)

Use this output to guide which niche expert skills/agents should be built next.

## 7) Finalize and iterate

Conclude each planning cycle with:
- Decisions made now
- Decisions deferred
- Evidence still required
- Next owner/action per item
- Date for next strategy checkpoint

Prefer rolling updates over one-time planning. Re-run this skill when assumptions change materially.

## Output format

Return output in this structure:

```markdown
Planning Frame
- Horizon:
- Scope:
- Success Criteria:

Discovery Snapshot
- What I Heard:
- Assumptions Logged:
- Unknowns Remaining:

Research Findings
- Key evidence:
- What changed:
- Confidence shifts:

Long-Range Plan
1. Executive summary
2. Strategic thesis
3. Market/customer model
4. Business model
5. Growth model
6. Operating model roadmap
7. Financial scenarios
8. Risk register
9. KPI tree
10. 90-day execution plan

Specialist Skill Backlog
- Existing skill coverage:
- Skill gaps:
- New skill spec cards:
```

## References

- [references/question-bank.md](references/question-bank.md)
- [references/research-protocol.md](references/research-protocol.md)
- [references/specialist-skill-backlog.md](references/specialist-skill-backlog.md)
- [references/niche-skill-seeds.md](references/niche-skill-seeds.md)
