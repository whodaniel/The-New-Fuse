# Fit Scoring Rubric (0-100)

Use this rubric to rank candidate agents per task.

## Formula

`Fit Score = Objective Match + Domain Specialization + Execution Reliability + Risk Coverage + Tool/Data Readiness`

Total possible: 100 points.

## Criteria and Weights

1. Objective Match (0-30)
- 30: Agent directly owns the exact deliverable.
- 20: Agent is adjacent but still strong for the deliverable.
- 10: Agent is general-purpose for this objective.
- 0: Weak relevance.

2. Domain Specialization (0-20)
- 20: Agent is explicitly built for this domain.
- 12: Agent handles domain partially.
- 6: Generic capability only.
- 0: Not domain-aligned.

3. Execution Reliability (0-20)
- 20: Agent has deterministic or well-defined workflow for this task type.
- 12: Agent is usable but may need additional framing.
- 6: Mostly advisory output.
- 0: Unclear execution path.

4. Risk Coverage (0-20)
- 20: Agent fully covers key risks (legal/compliance/financial/production) for task.
- 12: Agent covers some critical risks.
- 6: Minimal risk awareness.
- 0: Risk blind for this task.

5. Tool/Data Readiness (0-10)
- 10: Required tools/data are available and aligned to agent.
- 6: Minor missing inputs.
- 3: Significant missing inputs.
- 0: Not executable with available context.

## Decision Rules

- Choose highest fit score as primary agent.
- Add support agent only when it raises risk coverage or execution reliability.
- If top two scores differ by 0-8 points, present both with recommendation.
- If all candidates score below 70, ask for missing constraints before committing.
