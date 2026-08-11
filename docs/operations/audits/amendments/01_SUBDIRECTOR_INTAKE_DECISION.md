# Sub-Director Intake Decision — Reflect Amendments A1–A6

**Issued**: 2026-08-09T22:40:00-04:00  
**Authority**: Local Sub-Director (L3) — NFT `local-oss-5cf0356cd5d96efe`  
**Intake**: `docs/operations/audits/amendments/00_INTAKE.md`  
**Machine decisions**:
`docs/operations/audits/amendments/SUBDIRECTOR_DECISIONS.json`  
**Acceptance mode**: AI chain-of-command review/validation (no human OK
required)

## Doctrine applied

1. Accepted packets must be federated-autonomous: concrete files, steps, verify
   probes, rollback, `human_gate_required=false`.
2. Reject only if not autonomous OR conflicts with higher directive without dual
   path.
3. Dual full-auto loops remain an intentional adversarial test — **never**
   recommend collapsing either loop.
4. Hygiene items (swarm-context prune, PEM scrub, retention) remain **ACCEPTED
   as DONE** per intake — not re-queued.

## Context anchors

- **Audit exec verdict**: architecture coherent; operating truth false-green
  (establish≠operate). Prefer autopilot + disk + process + tip SHA.
- **Lessons 2026-08-09**: establish≠operate; orchestrate audit≠mutate; dual
  full-auto observe-only; reflect must not block on edge-flywheel; (PEM/swarm
  retention already patched).

## Decision table

| ID  | Decision            | Priority | Lane / Owner      | Summary rationale                                                                                            |
| --- | ------------------- | -------- | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| A1  | ACCEPT_WITH_CHANGES | P0       | local-subdirector | Operating-truth rollup + fail-closed inspect; pin `tnf autonomy health`; drop DONE retention file from scope |
| A2  | ACCEPT_WITH_CHANGES | P0       | orchestrator      | REPORT_ONLY classifier + artifact-before-SUCCESS; pin concrete orchestration modules                         |
| A3  | ACCEPT              | P1       | local-subdirector | Contention observer only; default never kill; matches adversarial dual-loop directive                        |
| A4  | ACCEPT_WITH_CHANGES | P1       | state-governor    | Flywheel timeout/skip; absolute `~/.agents` reflect path; macOS-safe timeout                                 |
| A5  | ACCEPT_WITH_CHANGES | P0       | state-governor    | Directive fence + tip/DRIFT honesty; concrete handoff scripts; artifact-only tip-align (no commit gate)      |
| A6  | ACCEPT_WITH_CHANGES | P0       | local-subdirector | Single `VERDICT:` line + matching exit; pin ProtocolInterceptor; no loop-collapse language                   |

## Rejects

None. All packets are implementable without a human gate and none require
collapsing dual full-auto loops. Items needing clarity were routed to
`ACCEPT_WITH_CHANGES` with exact JSON edits in `SUBDIRECTOR_DECISIONS.json`.

## Dual full-auto policy (binding)

- A3 is the canonical contention instrument.
- A1/A6 health/gate signals **observe and fail-closed ceremony** only.
- Auto-kill of either full-auto loop is **out of policy** unless a separate
  explicit policy ticket sets `--resolve-kill`.

## Next hop (not executed by this intake)

Staff Review validation → apply `required_packet_edits` → write
`IMPLEMENTATION_QUEUE.json` with exact commands + verify probes for accepted /
edited packets.
