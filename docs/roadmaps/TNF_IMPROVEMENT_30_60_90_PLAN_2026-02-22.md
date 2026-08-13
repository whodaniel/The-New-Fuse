# TNF Improvement 30/60/90 Plan

Date: 2026-02-22
Scope: Execute the 15 TNF improvement priorities with measurable delivery gates.

## Operating Model

- Program owner: `orchestrator`
- Delivery cadence: weekly checkpoint + biweekly release
- Definition of done: each item must satisfy its exit gate and have a runbook/test artifact
- Risk rule: no autonomous behavior change ships without canary + rollback path

## Owner Map (Role-Level)

- `devops-engineer`: CloudRuntime, runtime, deployment, observability pipeline
- `backend-specialist`: config, idempotency, breakers, contracts
- `security-auditor`: secrets governance, scanning, policy
- `performance-optimizer`: SLO metrics, latency/cost instrumentation
- `test-engineer`: CI contracts, drills, verification packs
- `project-planner`: cross-team scheduling, dependency tracking

## 0-30 Days (Foundation + Safety)

### Milestone M1: Runtime Determinism

Priorities:
1. Lock provider strategy and defaults.
2. Build `swarm:doctor` preflight gate.
3. Separate runtime config by environment.
5. Stabilize CloudRuntime runner execution.
11. Consolidate setup/run scripts into canonical command set.

Deliverables:
- Provider policy module with enforced order: `exa -> tavily -> searxng`.
- `swarm:doctor` command integrated as mandatory supercycle gate.
- Environment profile schemas for `production`, `staging`, `local`.
- Single canonical runner selected and documented.
- Legacy scripts marked deprecated with warnings.

Exit gates:
- 100% of supercycle starts pass through `swarm:doctor`.
- Startup fails on missing/invalid env profile values.
- Zero references to removed provider branches in runtime paths.
- One-command start path documented and used in CI smoke check.

Owner: `devops-engineer` + `backend-specialist`

### Milestone M2: Secrets + Basic Observability

Priorities:
4. Add secret governance.
6. Add structured observability for supercycle.

Deliverables:
- Rotated exposed keys, vault-only secret sourcing policy.
- Secret scanning in pre-commit + CI.
- JSON log schema implemented (`runId`, `phase`, `provider`, `latencyMs`, `failure`, `auctionCount`).

Exit gates:
- CI hard-fails on leaked token patterns.
- Dashboard shows per-run trace for latest 7 days.
- At least one alert route configured for run failure spikes.

Owner: `security-auditor` + `devops-engineer`

## 31-60 Days (Resilience + Quality)

### Milestone M3: Failure-Resilient Execution

Priorities:
8. Productionize Crawl4AI runtime.
9. Add idempotency + dedupe guards.
10. Harden failure handling with circuit breakers.

Deliverables:
- Crawl4AI dependency baked into deployed runtime image with health endpoint.
- Idempotency keys + dedupe store for auctions/tasks/findings.
- Circuit breaker library/policy for Redis and provider clients.

Exit gates:
- Retry/replay test suite shows no duplicate downstream writes.
- Breaker trips and auto-recovers in staged fault injection tests.
- Crawl jobs meet target failure rate under configured concurrency caps.

Owner: `backend-specialist` + `test-engineer`

### Milestone M4: Provider Performance Management

Priorities:
7. Add provider-level SLOs.
12. Add end-to-end contract tests for routing + failover.

Deliverables:
- SLO definitions: success rate, p95 latency, quality score, cost/run.
- Provider scorecard and auto-demotion policy engine.
- Contract tests for adaptive routing and fallback paths in CI.

Exit gates:
- Automated demotion action triggers in staging when SLO is violated.
- CI blocks merges on contract test regressions.
- Weekly provider report generated automatically.

Owner: `performance-optimizer` + `test-engineer`

## 61-90 Days (Control + Scale)

### Milestone M5: Controlled Autonomy

Priorities:
13. Runbook-driven failure drills.
14. Cost guardrails + budget enforcement.
15. Release/rollback workflow for autonomous changes.

Deliverables:
- Monthly chaos-lite drills (provider outage, Redis outage, runner restart).
- Budget policies (per-run ceiling, provider ceiling, daily ceiling).
- Staged rollout process: canary -> wider rollout -> full release.
- One-command rollback and mandatory post-run report template.

Exit gates:
- MTTR tracked and improving across two drill cycles.
- Autonomous runs hard-stop on budget breach policy.
- Every behavioral release includes canary evidence + rollback verification.

Owner: `project-planner` + `devops-engineer` + `security-auditor`

## Dependency Sequence

1. `M1` must complete before `M3` and `M4`.
2. `M2` logging foundation is required for SLOs and drills.
3. `M3` idempotency is required before full autonomous rollout controls in `M5`.

## KPI Set (Program-Level)

- Reliability: supercycle successful completion rate
- Latency: p95 end-to-end run latency
- Quality: accepted scout outputs / total outputs
- Cost: average cost per successful run
- Safety: secret leak incidents, rollback frequency, MTTR

## Weekly Governance Template

- Week goal:
- Completed this week:
- Failed gate(s):
- Risk added:
- Risk retired:
- Next week commit:

## Immediate Next 7-Day Sprint (Kickoff)

1. Implement `SCOUT_PROVIDER=auto` policy and remove dead provider branches.
2. Ship initial `swarm:doctor` with CloudRuntime auth/env/Redis/provider checks.
3. Add environment profile schema enforcement at startup.
4. Pick and lock canonical CloudRuntime runner; document run command.
5. Enable JSON structured logs in supercycle pipeline.
