# Acceptance Ledger — Reflect Amendments A1–A6

**Sealed**: 2026-08-09T22:37:30-04:00  
**Authority**: TNF Orchestrator (L2) after L3 Sub-Director + Staff Review  
**Seal status**: `SEALED` (both `SUBDIRECTOR_DECISIONS.json` and
`STAFF_REVIEW_VALIDATION.json` present)  
**Machine queue**: `IMPLEMENTATION_QUEUE.json`

## Sources

| Artifact          | Path                                | Role                                          |
| ----------------- | ----------------------------------- | --------------------------------------------- |
| Intake            | `00_INTAKE.md`                      | L5 proposals + doctrine                       |
| Sub-Director MD   | `01_SUBDIRECTOR_INTAKE_DECISION.md` | L3 rationale                                  |
| Sub-Director JSON | `SUBDIRECTOR_DECISIONS.json`        | Machine decisions + required edits            |
| Staff Review MD   | `02_STAFF_REVIEW_VALIDATION.md`     | StaffOps validation table                     |
| Staff Review JSON | `STAFF_REVIEW_VALIDATION.json`      | pass / pass_with_conditions + suggested order |
| Packets           | `packets/A1`…`A6`                   | Solution surfaces                             |

## Doctrine (binding)

1. Queue only **ACCEPT** / **ACCEPT_WITH_CHANGES** (Sub-Director) and Staff
   **pass** / **pass_with_conditions**.
2. **REJECT** / **fail** stay off the queue (none this cycle).
3. Every queued item is federated-autonomous: assignee role, exact first
   command, verify probe, rollback, `human_gate=false`.
4. Dual full-auto = adversarial **observe-only** — **no kill jobs** scheduled.
5. Sub-Director `required_packet_edits` and Staff `conditions` are written into
   queue notes (workers apply before claiming done).

## Accepted → queued

| ID  | Sub-Director        | Staff Review         | Priority | Owner             | Queue order |
| --- | ------------------- | -------------------- | -------- | ----------------- | ----------: |
| A6  | ACCEPT_WITH_CHANGES | pass                 | P0       | local-subdirector |           1 |
| A1  | ACCEPT_WITH_CHANGES | pass                 | P0       | local-subdirector |           2 |
| A5  | ACCEPT_WITH_CHANGES | pass_with_conditions | P0       | state-governor    |           3 |
| A2  | ACCEPT_WITH_CHANGES | pass_with_conditions | P0       | orchestrator      |           4 |
| A3  | ACCEPT              | pass                 | P1       | local-subdirector |           5 |
| A4  | ACCEPT_WITH_CHANGES | pass_with_conditions | P1       | state-governor    |           6 |

## Rejected

None.

## Done (not queued)

| Item                                        | Status           | Notes                                 |
| ------------------------------------------- | ---------------- | ------------------------------------- |
| Hygiene: swarm-context prune                | ACCEPTED_AS_DONE | Intake + Staff Review                 |
| Hygiene: PEM scrub                          | ACCEPTED_AS_DONE | Intake + Staff Review                 |
| Hygiene: retention / disk retention scripts | ACCEPTED_AS_DONE | Out of A1 scope per Sub-Director edit |

## Escalations

None (no Super Director elevates this cycle).

## Parallel ops (explicitly NOT on amendment queue)

- Close high-priority growth blockers (count=6) → `tnf-growth-blocker-auditor`
- Staffing architecture gap (count=1) → `tnf-staffops-staffing-director-01`

## Dual full-auto contention note

A3 is the only contention instrument. A1/A6 may fail-close ceremony/inspect but
**must not** stop/kill full-auto loops. Queue contains **zero** `kill` /
`--resolve-kill` jobs.

## Next hop

Federated assignees execute `IMPLEMENTATION_QUEUE.json` in order (parallel OK
only within non-conflicting file sets; prefer serial A6→A1→A5 before A2).
