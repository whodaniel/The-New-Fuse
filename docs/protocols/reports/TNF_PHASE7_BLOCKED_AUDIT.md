# TNF Phase 7 Blocked-Directive Audit

- Generated: `2026-06-15T22:50:00Z`
- Auditor:
  `Hermes (session: TNF, model: minimaxai/minimax-m3 via NVIDIA — note: throttled)`
- Trigger: Phase 7 batch 001 closed as `verified-empty-batch` despite
  `local-subdirector` being listed as the Resumption Checklist owner with
  `priority: high`
- Status: **DRAFT — Not promoted. No ledger mutation performed by this audit.**

## Question Posed

> Why are 658/689 Phase 7 directives blocked? Is the gate itself faulty, or are
> the blocked items empirically unsuitable for dispatch?

## TL;DR

The Phase 7 gate is working as designed. **622 of 658 blocked directives carry
`blockReason: irrelevant-context`** because Antigravity (acting as the upstream
triage pass on 2026-06-11) deliberately bulk-classified all `v2-extracted`
directives — i.e. those auto-extracted from YouTube tutorial transcripts during
the Phase 5 ingestion — as out-of-scope for the TNF orchestration stack. The
decision was conservative, blanket-applied at the _source-video_ level (not
directive-by-directive), and recorded as a completed audit entry on the active
task ledger.

Heuristic re-scoring of the 183 high+critical items inside that bulk-block
surfaces **~14 directives whose titles and descriptions name TNF components
directly** (Hermes, MCP, harness, A2A, evaluation framework, SearXNG, agentic
RAG). These are empirically TNF-scope under V2-style tutorial framing. The
upstream blanket is over-broad for that subset.

Concrete recommendation: a `dry-run`-only retriage script
(`scripts/autonomy/phase7_retriage_v2.py`) is provided that lists KEEP/REVERT
verdicts per directive. **Promotion (`state: ready`, clearing `blockReason`) is
intentionally NOT auto-applied.** The `promote_14.py` precedent excludes
`irrelevant-context` items by design; overriding that without explicit owner
direction would contradict established operational precedent.

## State Counts (Before Audit)

| State      | Count   |
| ---------- | ------- |
| `landed`   | 31      |
| `verified` | 0       |
| `running`  | 0       |
| `claimed`  | 0       |
| `ready`    | 0       |
| `blocked`  | **658** |
| `failed`   | 0       |
| **Total**  | **689** |

Conversion rate: `4.5%`. Source:
`data/ingestion-runs/ai5-phase7-directive-conversion-ledger.json` generated
2026-06-15T21:28:19.619787Z by `local-subdirector`.

## Block-Reason Distribution (All Blocked)

| `blockReason`                                 | Count   | Class                                |
| --------------------------------------------- | ------- | ------------------------------------ |
| `irrelevant-context`                          | **622** | Antigravity 2026-06-11 V2 bulk-block |
| `low-relevance`                               | 32      | Ingestion-time relevance filter      |
| `requires-interactive-botfather-registration` | 1       | Hard environmental requirement       |
| `deepsec-no-analyzed-files`                   | 1       | deepsec pipeline invariant           |
| `no-first-party-shopping-list-surface`        | 1       | First-party surface missing          |
| `no-first-party-agentars-surface`             | 1       | First-party surface missing          |
| **Total**                                     | **658** |                                      |

## State of the 622 `irrelevant-context` Items

Despite carrying `state: blocked`, every record in this bucket had originally
been classified `dispatchEligible: True` by the ingestion pipeline
(`data/ingestion-runs/ai5-new-may-2026-action-queue.json` reports
`dispatch_eligible_count: 651`, `execution_candidates: 651`,
`confidence_counts.high: 651`).

The reclassification happened during the 2026-06-11T18:25:53Z verification pass
that wrote `verification.blocker.type = "irrelevant-context"` with descriptions
such as:

> Requests integrating a tutorial's production.py into the project. TNF does not
> use this Python RAG backend.
>
> — act-07e35b7ed5edcfe2

> Requests launching Grok Build CLI. TNF uses Antigravity, OpenClaw, Hermes, and
> Jules, not Grok Build.
>
> — act-162efe8af5d21b6e

> Bulk blocked: Auto-extracted from YouTube tutorial. Irrelevant context for TNF
> repo.
>
> — act-189e0d0c8e462b6b (and 583 similar records)

Confidence and relevance distributions on the 622 show they were not otherwise
low-quality items:

| Metric                  | Median | Mean | Min  | Max  |
| ----------------------- | ------ | ---- | ---- | ---- |
| Confidence score        | 0.90   | 0.89 | 0.60 | 1.00 |
| Relevance score (0-100) | 40     | 39   | 0    | 40   |

628 of 622 ≥ 0.7 confidence; **0 of 622 hit the `confidence.label == low`
heuristic.** None would have been blocked under the lower-confidence gate alone.

## Priority Breakdown of `irrelevant-context`

| Priority  | Count   |
| --------- | ------- |
| medium    | 429     |
| high      | 138     |
| critical  | 55      |
| **Total** | **622** |

The high+critical subset (183 records) is where empirical review found the most
genuine TNF-scope work.

## Lane Distribution of `irrelevant-context`

| Lane                       | Count |
| -------------------------- | ----- |
| `product-intel-activation` | 210   |
| `orchestration-runtime`    | 179   |
| `backend-contracts`        | 108   |
| `frontend-p0-truth`        | 86    |
| `security-audit`           | 28    |
| `platform-release`         | 26    |
| `performance-budget`       | 21    |

## Heuristic Re-scoring (High+Critical Subset, 183 records)

A combined heuristic was applied to the 183 high+critical `irrelevant-context`
items, scoring each on:

- `repoFitScore` (already computed by phase7 script; 30/50/70+ ladder)
- Lane affinity (`orchestration-runtime`, `performance-budget`,
  `backend-contracts`, `security-audit` weighted +1)
- Lexical presence of TNF-component terms (`agent loop`, `trace`, `evaluation`,
  `prompt`, `orchestrator`, `envelope`, `mcp`, `hermes`, `relay`, `broker`,
  `redis`, `rust`, `factory`, `tier`, `directive`, `relevance`,
  `confidence score`, `harness`, `dispatch`, `lane`)
- Negative penalty for signals of generic-tutorial content (`youtube`, `grok`,
  `tutorial` in title/description)

Score distribution:

| Score | Count | Class                                              |
| ----- | ----- | -------------------------------------------------- |
| -1    | 5     | Strongly-tuned-to-other-tooling (Grok, Runway)     |
| 0     | 4     | Generic content generation, mobile, video          |
| 1     | 1     | Marginal                                           |
| 2     | 48    | Lightly TNF-related but mostly tutorial            |
| 3     | 64    | Mixed-signal; not clearly scoped to TNF            |
| 4     | 47    | Notable TNF alignment but lower lexical confidence |
| 5     | 14    | Empirically TNF-scope under V2 framing             |

## 14 KEEP Candidates (Hypothetical Reclassification)

These are the highest-scoring items. **Verdict is heuristic, not authoritative.
None were promoted.**

| Score | Priority | Lane                  | ID                     | Title                                                       |
| ----- | -------- | --------------------- | ---------------------- | ----------------------------------------------------------- |
| 5     | critical | backend-contracts     | `act-c986b240a1097b6e` | Input Telegram Credentials and Start Bot Service            |
| 5     | critical | security-audit        | `act-f8e0537dc402cd7d` | Integrate Versa Labs for AI Security Testing                |
| 5     | high     | backend-contracts     | `act-1379d655a387b57e` | Implement Agentic RAG by Replacing Fixed Retrieval          |
| 5     | high     | orchestration-runtime | `act-2f6875662149bec5` | Implement Agent Output Evaluation Based on Business Rules   |
| 5     | high     | backend-contracts     | `act-3efcb13f76545c0b` | Integrate Hermes Agent with Messaging Platforms             |
| 5     | high     | orchestration-runtime | `act-4157c1eb323c81a6` | Develop and Integrate Multiple Evaluation Methods           |
| 5     | high     | backend-contracts     | `act-4ac367caa36e1f4d` | Implement LM Judges for Semantic Understanding              |
| 5     | high     | orchestration-runtime | `act-9bd19e9cfd37307c` | Assemble Agent with ESQL Skill Components                   |
| 5     | high     | orchestration-runtime | `act-c249bb82e9ad3dfa` | Implement Code Evals for Deterministic Checks               |
| 5     | high     | orchestration-runtime | `act-c6ef0132a57824fd` | Implement Multi-Step Evaluation for Agent Tool Calls        |
| 5     | high     | orchestration-runtime | `act-d138a0b08d99d321` | Integrate New MCP Server with Agent TAR                     |
| 5     | high     | orchestration-runtime | `act-ddcaac31378c33d8` | Fix Agent's Own Harness                                     |
| 5     | high     | backend-contracts     | `act-eef67d5509e1758f` | Enable and Use SearXNG Search Skill                         |
| 5     | high     | orchestration-runtime | `act-f5fc84e7ed208bde` | Instruct AI Agent to Process and Modify a GitHub Repository |

Caveats the auditor wants surfaced:

- The `Versa Labs` and `Telegram Credentials` items should be manually reviewed
  against actual TNF credentials availability and reachable endpoints before any
  promotion.
- `Implement Agentic RAG by Replacing Fixed Retrieval` and
  `ESQL Skill Components` reference Elasticsearch-flavored idioms that are _not_
  present in current TNF code.
- `Implement Agent Output Evaluation Based on Business Rules` and
  `Implement LM Judges for Semantic Understanding` are conceptually adjacent to
  `multi_agent_system_evaluator.py` but reference no concrete integration paths
  to it.
- The remaining items (Hermes, MCP, harness, SearXNG, code evals) are the
  strongest matches.

## Lower-Tier Notes

Items at score 4 (47 records) include some real TNF work but each contains
generic-tutorial phrasing that warranted the upstream block. They are not
recommended for blind promotion. The lowest-signal items (scores -1 to 0, ~9
records) are unambiguously out-of-scope: Grog/Runway/mobile/generic-content
directives.

## Operational Precedent

`scripts/autonomy/promote_14.py` (line 7) explicitly excludes
`irrelevant-context` items from promotion candidates:

```python
items = [x for x in d.get('records', []) if isinstance(x, dict) and x.get('state') == 'blocked' and x.get('blockReason', '') != 'irrelevant-context']
```

This is a deliberate earlier operator decision (from a prior Antigravity curator
run). Overriding it requires either:

1. Updating `promote_14.py` to additionally exclude only the _lower-confidence_
   subset of `irrelevant-context` items, **OR**
2. Clearing `verification.blocker.type` on the 14 candidates after manual owner
   review.

Neither was done in this audit because:

- The session chat-path model (NVIDIA `minimaxai/minimax-m3`) is throttled (HTTP
  429); under the _AGENTS.md_ operating loop heuristic ("verify before assuming
  success"), mutating the ledger without absolute confidence is not appropriate.
- `local-subdirector` is the named Resumption Checklist owner. The audit
  recommends deferring the final promote/revert decision to that owner or a
  future explicit user-issued instruction.

## Recommended Next Actions

1. **Manual review** the 14 KEEP-candidate titles against current TNF state.
   Confirm Hermes/MCP/harness integration claims match real code paths.
2. **If 14 are confirmed in-scope,** modify `promote_14.py` (or write a v2) to
   include them, then re-run.
3. **Re-batch 001**: even with all 14 promoted, batch 001 will only have 14
   records. Sub-batch sizing may want to lift to handle this.
4. **Phase 8 design:** the broader issue is that the V2-extracted feed is
   consistently producing tutorial-flavored titles with light TNF overlap.
   Either tune the ingestion classifier (so the upstream triage here is
   cheaper), or move Phase 7 throughput onto a different feed (project-specific
   notes, YouTube targets you curate).

## Reproducing This Audit

```bash
# Dry-run (default — prints KEEP/REVERT verdicts, mutates nothing):
python3 scripts/autonomy/phase7_retriage_v2.py

# Apply promotion (only after explicit owner sign-off):
python3 scripts/autonomy/phase7_retriage_v2.py --apply
```

Dry-run prints the same 14 KEEP candidates and score distribution reported
above, without mutating any file.

`--apply` rewrites
`data/ingestion-runs/ai5-phase7-directive-conversion-ledger.json` (promotes the
14 KEEP candidates from `state: blocked` to `state: ready`, clears their
`blockReason`, and updates the summary counts) and produces
`data/ingestion-runs/ai5-phase7-tight-loop-batch-001.json`. The previous
batch-001 file is preserved as `*.bak`. **Run only after explicit owner
direction.**
