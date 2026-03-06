---
name: limitation-challenge-schema-loop
description: Convert ambiguous constraints into adaptive, node-based workflows with explicit data handoff schemas. Use when users describe a limitation, blocker, or failed approach and need a resilient execution design that maps node responsibilities, input/output contracts, and parsed-content transfer formats.
---

# Limitation Challenge Schema Loop

## Overview

Translate a limitation into a concrete challenge objective, then build a schema-first node workflow so each step passes structured, validated data to the next step.

## Core Principle

Use this framing at the start of the workflow:
- "This is the limitation I ran up against. So, this is the challenge we will overcome!"
- "Map out the specific data schemas these nodes will use to pass the parsed content back and forth."

Treat these as mandatory anchors for every plan.

## Workflow

1. Capture limitation and challenge
- Extract one explicit limitation statement.
- Rewrite it as an action-oriented challenge objective.
- Record assumptions and success criteria.

2. Define node map
- Split the workflow into small nodes with one responsibility each.
- Assign each node: objective, owner (if known), and failure modes.
- Keep topology simple first: linear chain, then add branches only if needed.

3. Specify handoff contracts
- Define input and output schema for every node boundary.
- Include required fields, optional fields, enums, and nullability.
- Require envelope fields (`trace_id`, `node_id`, `status`, `payload`) for observability and debugging.

4. Add adaptation hooks
- Add `confidence`, `errors`, and `next_action` fields so downstream nodes can adapt.
- Define fallback routes for low-confidence states.
- Preserve original parsed content under a stable key for reprocessing.

5. Validate with one end-to-end example
- Run one realistic payload through every node contract.
- Confirm no field is ambiguous at handoff points.
- Tighten schemas where interpretation drift appears.

## Quick Start

Generate a baseline workflow contract package:

```bash
python3 scripts/generate_workflow_contract.py \
  --limitation "Our parser output breaks downstream routing" \
  --challenge "Create resilient routing with schema-validated handoffs" \
  --nodes ingest parse normalize route execute verify
```

Write to a file:

```bash
python3 scripts/generate_workflow_contract.py \
  --limitation "Inconsistent extraction format" \
  --nodes ingest parse classify act verify \
  --out /tmp/workflow-contract.json
```

## Resources

- Use `references/node-schema-patterns.md` for canonical contract structure and naming rules.
- Use `scripts/generate_workflow_contract.py` to bootstrap a schema package that can be edited per domain.

## Output Standard

When applying this skill in a real task, produce:
1. Limitation and challenge statement.
2. Node list with responsibilities.
3. Per-edge input and output schema definitions.
4. Example payload showing one full pass through the workflow.
5. Adaptation logic for low-confidence and error states.
