# Task Intake Signals

Use this checklist to detect what needs attention and prevent shallow routing.

## 1) Deliverable Signal

- Detect concrete nouns: `plan`, `report`, `post`, `script`, `deployment`, `audit`.
- Detect verbs indicating action: `build`, `fix`, `review`, `launch`, `optimize`.
- Extract expected output format if present (`markdown`, `code`, `spreadsheet`, `video`, `workflow`).

## 2) Priority Signal

Score each task from 1-5:

- Impact: how much business or technical value the task unlocks.
- Urgency: time sensitivity or deadline pressure.
- Dependency pressure: how many other tasks are blocked by this task.

Priority Score = `(Impact * 0.5) + (Urgency * 0.3) + (Dependency * 0.2)`

## 3) Risk Signal

Escalate priority and tighten routing when requests mention:

- Legal/compliance words: `FTC`, `contract`, `tax`, `copyright`, `policy`.
- Revenue-critical words: `sponsorship`, `ads`, `conversion`, `checkout`.
- Production-critical words: `deploy`, `incident`, `failing`, `broken`.

## 4) Scope Signal

Classify request complexity:

- `Single-task`: one clear deliverable, one domain.
- `Multi-task`: multiple deliverables, same domain.
- `Cross-domain`: multiple domains requiring orchestration and handoffs.

## 5) Readiness Signal

Before selecting agents, verify:

- Success criteria are explicit.
- Constraints are known (deadline, budget, platform, channel).
- Inputs are available (files, links, data, credentials if needed).

If not ready, request the minimum missing inputs in one concise block.
