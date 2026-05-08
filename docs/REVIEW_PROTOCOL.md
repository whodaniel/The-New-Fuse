# TNF Systematic Review Protocol v1.0
> "Nonprejudgest, Nonassuming"

## Purpose
Systematically review every node in `codebase_map.json` (15,707 nodes) and maintain an immutable record of each review cycle, including contradictions found, adversarial perspectives, and reconciliation status.

## Review Cycles

### Cycle 1: Discovery & Classification
**Goal**: Read the file. Determine what it is. Record its classification.

For each file, record:
- `cycle`: `discovery`
- `intent`: [from 7-Lens taxonomy]
- `scope`: [from 7-Lens taxonomy]
- `maturity`: [from 7-Lens taxonomy]
- `actionability`: [from 7-Lens taxonomy]
- `confidence`: 0.0–1.0 of correctness
- `notes`: Initial observations
- `reviewer`: Agent ID (e.g., `claude-v1`) or human
- `reviewed_at`: ISO timestamp

### Cycle 2: Adversarial Challenge
**Goal**: Assume the file is wrong. What's the strongest case against it?

For each file, record:
- `cycle`: `adversarial`
- `challenges`: Array of challenges raised
- `evidence_for`: What supports the challenge?
- `contradictions`: Array of IDs of contradictory nodes
- `severity`: `low` / `medium` / `high` / `critical`
- `reviewer`: Agent ID (must be different from Cycle 1)
- `reviewed_at`: ISO timestamp

### Cycle 3: Aligned Synthesis
**Goal**: Assume the file is correct. What's the strongest case integrating it with neighbors?

For each file, record:
- `cycle`: `synthesis`
- `integrations`: Array of node IDs this integrates with
- `assumptions`: What must we assume for this to be true?
- `gaps`: What is missing that would be useful?
- `reviewer`: Agent ID (must be different from both Cycles 1 & 2)
- `reviewed_at`: ISO timestamp

### Cycle 4: Final Reconciliation (Optional, Human-Driven)
**Goal**: Decide on contradictions (if any).

For each file with contradictions:
- `cycle`: `reconciliation`
- `resolution`: `confirmed` / `revised` / `deprecated` / `flagged_for_review`
- `rationale`: Why this resolution was chosen
- `reviewer`: Human (adversarial and synthesis agents must not reconcile — only humans)
- `reviewed_at`: ISO timestamp

## Rules

1. **No Suppression**: If a file contradicts another, both are flagged. Neither is suppressed.
2. **No Assumption**: If a file references a concept, the concept must be traced to its definition. No "I assume this means...".
3. **Multiple Perspectives**: At minimum 3 agent passes (discovery, adversarial, synthesis) before human reconciliation.
4. **Immutable Log**: Once a review is recorded, it is not deleted. Updates append new entries.
5. **Cross-Reference**: Every file must reference its parent, children, and any files it depends on.
6. **Confidence Tracking**: Every assertion carries a confidence score.
7. **Human Gate**: Only humans can resolve contradictions. Agents can flag; humans decide.
8. **Completeness**: Every node in `codebase_map.json` must pass through all 4 cycles before the review is complete.

## Status Tracking

```
UNREVIEWED → DISCOVERED → CHALLENGED → SYNTHESIZED → RECONCILED
     ↓            ↓           ↓            ↓              ↓
  (initial)   (intent,   (adversarial (aligned     (human
               scope,     issues       synthesis     decides)
               maturity,  raised)      complete)
               action-
               ability)
```

## Flags

Files may be flagged during any cycle:

| Flag | Meaning | Action |
|---|---|---|
| `contradiction` | File contradicts another file | Add to reconciliation queue |
| `orphan` | File references concepts with no definition | Trace to definition or flag as gap |
| `circular` | File A depends on B, which depends on A | Flag for architectural review |
| `stale` | File content doesn't match current implementation | Initiate update protocol |
| `duplicate` | File duplicates another file's purpose | Flag for consolidation |
| `missing` | Referenced file doesn't exist in codebase | Add to missing file registry |
| `sensitive` | File contains governance-critical logic | Lock behind SUPER_ADMIN |

## Tools

- `scripts/review/review_node.mjs` — Record a review cycle for a node
- `scripts/review/audit_review.mjs` — Check completeness and flag issues
- `scripts/review/contradiction_report.mjs` — Generate contradiction report
- `scripts/review/reconciliation_dashboard.mjs` — Build HTML dashboard

## Output Files

- `data/reviews/review_log.jsonl` — Append-only review log (one line per review event)
- `data/reviews/node_status.json` — Current status of each node
- `data/reviews/contradictions.json` — Active contradictions awaiting reconciliation
- `data/reviews/missing.json` — Referenced files that don't exist
- `reports/reviews/completion_report.json` — Overall progress

## Example Review Event

```json
{
  "event_id": "rev_2026-05-06_01_001",
  "node_id": "PROTO_14",
  "cycle": "adversarial",
  "intent": "governance",
  "scope": "system",
  "maturity": "stable",
  "actionability": "monitor",
  "confidence": 0.92,
  "challenges": [
    "Section 3.1 contradicts clause in TNF_CRON_GOVERNANCE regarding escalation timing",
    "Definition of 'emergency freeze' is ambiguous compared to incident response doc"
  ],
  "contradictions": ["PROTO_27"],
  "severity": "medium",
  "flags": ["contradiction", "ambiguous_definition"],
  "reviewer": "claude-v1",
  "reviewed_at": "2026-05-06T17:00:00Z"
}
```
