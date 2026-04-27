# Agent Network Hardening Plan (Phase 1)

Window: 2026-03-27 to 2026-04-02 (7 days) Repository:
`/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse`

## Baseline (Start of Phase)

- Registry agents: `178`
- Registry variants: `290`
- Collision groups: `111`
- Unknown tags: `1119` distinct / `1385` occurrences
- Typed graph coverage: `120/178` (`67.42%`)
- Graph alert status after expansion: `ALERT` (expected migration spike)

## Phase 1 Outcomes

1. Stabilize source governance so collisions are intentional, not accidental.
2. Cut unknown-tag noise via deterministic normalization.
3. Promote typed relationship contracts from graph heuristics into registry
   semantics.
4. Re-baseline temporal alerting after expansion while preserving steady-state
   sensitivity.

## Daily Execution Plan

### Day 1 (2026-03-27): Source Governance Freeze

- Decide canonical source precedence for duplicate agents.
- Codify source policy in registry import/build scripts.
- Produce a `collision allowlist` for intentional mirrors.

Deliverables:

- Updated source-precedence policy artifact.
- Machine-readable collision allowlist file.

Success metric:

- Collision groups triaged to `intentional` vs `needs merge` with 100%
  classification.

### Day 2 (2026-03-28): Tag Normalization v1

- Build normalization dictionary for top unknown tags (tools + capabilities +
  token variants).
- Apply normalization during build/check.
- Regenerate registry summary and measure deltas.

Deliverables:

- `tag-normalization-map` artifact in repo.
- Registry summary before/after diff.

Success metric:

- Unknown-tag occurrences reduced by at least `30%` from baseline.

### Day 3 (2026-03-29): Canonical Agent Merge Rules

- Add deterministic merge behavior for mirrored markdown definitions.
- Preserve provenance metadata while emitting one canonical operational record.
- Validate no parse regressions and no accidental drops.

Deliverables:

- Registry merge-rule implementation + validation output.

Success metric:

- Collision groups reduced from `111` to `<=40`.

### Day 4 (2026-03-30): Typed Relationship Contract v1

- Extend relationship generation logic to emit typed semantics in registry
  output.
- Map at least these typed classes: `delegates`, `depends_on`, `feeds`,
  `fallback`.
- Keep backward compatibility for consumers expecting similarity links.

Deliverables:

- Updated relationship schema + migration notes.
- Updated relationship artifact with type distribution.

Success metric:

- At least `50%` of active registry relationships carry a typed class.

### Day 5 (2026-03-31): Coverage and Routing Reliability

- Lift graph coverage to include missing high-value nodes from registry.
- Add router backstops for nodes with no inbound routes.
- Validate centrality spread does not collapse into one super-hub.

Deliverables:

- Refreshed graph + centrality report + coverage report.

Success metric:

- Coverage `>=75%` of registry.
- Zero singleton communities in full graph.

### Day 6 (2026-04-01): Alert Policy Re-baseline

- Add `migration mode` vs `steady-state mode` alert thresholds.
- Close expected migration alerts and verify green in steady-state dry-run.
- Preserve strict thresholds for unexpected drift.

Deliverables:

- Threshold policy config + runbook update.

Success metric:

- Latest alert status `OK` in steady-state mode for unchanged rerun.

### Day 7 (2026-04-02): Audit and Sign-off

- Run full pipeline (`registry build/check`, `graph:all`, visualization
  publish).
- Produce final scorecard against baseline and phase targets.
- Capture rollback and follow-on backlog items for Phase 2.

Deliverables:

- Signed Phase 1 scorecard.
- Phase 2 backlog and ownership map.

Success metric:

- All Phase 1 acceptance checks pass or have explicit waived rationale.

## Target Scorecard (End of Phase)

- Collision groups: `111 -> <=25`
- Unknown tag occurrences: `1385 -> <=700`
- Unknown distinct tags: `1119 -> <=500`
- Registry typed relationships: `0% -> >=60%` typed
- Graph coverage: `67.42% -> >=75%`
- Steady-state temporal alert: `OK`

## Risks and Mitigations

- Risk: aggressive dedupe may hide meaningful source differences.
  - Mitigation: preserve source provenance on canonical records.
- Risk: tag normalization may over-collapse nuanced capabilities.
  - Mitigation: maintain explicit exceptions list and audit samples.
- Risk: relationship typing heuristics may introduce false semantics.
  - Mitigation: add confidence scores and review low-confidence edges.
