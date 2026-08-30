# TNF Swarm Master Schedule and Master Schedule

Generated: 2026-08-30T19:27:32.251Z

## Summary

- Total schedules: 21
- Enabled schedules: 21
- Disabled schedules: 0
- Locked schedules: 2
- Schedules with stale-run warning: 0
- Interrelationship edges: 38

## Schedule Table

| Schedule ID                        | Scope            | Category                  | Owner                           | Cadence         | TZ  | Enabled | Runtime | Lock   | Subroutine                                                              |
| ---------------------------------- | ---------------- | ------------------------- | ------------------------------- | --------------- | --- | ------- | ------- | ------ | ----------------------------------------------------------------------- |
| tnf-swarm-stress-test              | system_framework | self_improvement_core     | tnf-swarm-supervisor            | _/10 _ \* \* \* | UTC | yes     | healthy | open   | scripts/orchestrator/swarm-stress-test.sh                               |
| tnf-twip-macro-board-refresh       | system_framework | observability             | twip-orchestration-bridge       | _/10 _ \* \* \* | UTC | yes     | healthy | open   | scripts/protocols/twip-macro-board.cjs                                  |
| tnf-master-clock-super-cycle       | system_framework | orchestration_gate        | master-clock                    | _/15 _ \* \* \* | UTC | yes     | healthy | locked | scripts/protocols/synthetic-federation-gate-check.cjs                   |
| tnf-openclaw-runtime-sync          | system_framework | observability             | master-clock                    | _/15 _ \* \* \* | UTC | yes     | healthy | open   | scripts/openclaw/tnf-openclaw-control.cjs                               |
| tnf-marketplace-curation-cycle     | system_framework | system_framework          | tnf-marketplace-curator         | _/30 _ \* \* \* | UTC | yes     | healthy | open   | scripts/orchestrator/marketplace-curation-agent.sh                      |
| tnf-process-health-watchdog        | system_framework | observability             | master-clock                    | _/30 _ \* \* \* | UTC | yes     | healthy | open   | scripts/protocols/verify-process-health.cjs                             |
| tnf-terminal-awareness-reminder    | system_framework | system_terminal_awareness | tnf-agent-director              | _/30 _ \* \* \* | UTC | yes     | error   | open   | scripts/verify_frontload_state.sh                                       |
| tnf-auto-git-push                  | system_framework | system_framework          | tnf-agent-director              | 0 \* \* \* \*   | UTC | yes     | healthy | open   | scripts/orchestrator/auto-git-push.sh                                   |
| tnf-growth-blocker-audit           | system_framework | self_improvement_core     | tnf-growth-blocker-auditor      | 0 _/4 _ \* \*   | UTC | yes     | healthy | open   | .skills/tnf-growth-blocker-auditor/scripts/run_growth_blocker_audit.cjs |
| tnf-llm-arena-intel-collector      | system_framework | observability             | tnf-llm-intel-collector         | 0 _/4 _ \* \*   | UTC | yes     | error   | open   | scripts/llm-intel/llm-arena-intel-collector.cjs                         |
| tnf-llm-verified-fleet-cycle       | system_framework | self_improvement_core     | tnf-llm-intel-optimizer         | 0 _/6 _ \* \*   | UTC | yes     | healthy | open   | scripts/llm-intel/tnf-llm-verified-fleet-cycle.cjs                      |
| tnf-self-improvement-scorecard     | system_framework | self_improvement_core     | tnf-stack-self-improvement-loop | 0 _/6 _ \* \*   | UTC | yes     | healthy | locked | scripts/validate-protocol-schemas.cjs                                   |
| tnf-agent-review-cycle             | system_framework | agent_review              | tnf-agent-review-agent          | 15 _/2 _ \* \*  | UTC | yes     | healthy | open   | .skills/tnf-agent-review-agent/scripts/run_agent_review_cycle.cjs       |
| tnf-swarm-role-call-and-scheduling | system_framework | swarm_coordination        | tnf-swarm-scheduling-agent      | _/20 _ \* \* \* | UTC | yes     | healthy | open   | scripts/protocols/swarmops-role-call.cjs                                |
| tnf-swarm-director-cycle           | system_framework | swarm_architecture        | tnf-swarm-director-agent        | 30 _/6 _ \* \*  | UTC | yes     | healthy | open   | .skills/tnf-swarm-director-agent/scripts/run_swarm_director_cycle.cjs   |
| tnf-director-resonance-cycle       | system_framework | orchestration_gate        | tnf-agent-director              | manual          | UTC | yes     | unknown | open   | n/a                                                                     |
| tnf-llm-ranking-optimizer          | system_framework | self_improvement_core     | tnf-llm-intel-optimizer         | 30 _/4 _ \* \*  | UTC | yes     | healthy | open   | scripts/llm-intel/llm-ranking-optimizer.cjs                             |
| tnf-subdirector-codegen-worker     | system_framework | orchestration_gate        | tnf-subdirector-codegen         | manual          | UTC | yes     | unknown | open   | scripts/agents/subdirector-codegen-worker-cycle.sh                      |
| tnf-subdirector-infra-worker       | system_framework | orchestration_gate        | tnf-subdirector-infra           | manual          | UTC | yes     | unknown | open   | scripts/agents/subdirector-infra-worker-cycle.sh                        |
| tnf-terminal-heartbeat-pulse       | system_framework | system_terminal_awareness | tnf-master-clock                | \* \* \* \* \*  | UTC | yes     | healthy | open   | scripts/runtime/terminal-heartbeat-pulse.cjs                            |
| tnf-recursive-logic-sieve          | system_framework | self_improvement_core     | tnf-swarm-supervisor            | n/a             | UTC | yes     | unknown | open   | n/a                                                                     |

## Interrelationships

- [shared-owner] tnf-recursive-logic-sieve -> tnf-swarm-stress-test (Shared
  owner: tnf-swarm-supervisor)
- [shared-owner] tnf-master-clock-super-cycle -> tnf-openclaw-runtime-sync
  (Shared owner: master-clock)
- [shared-owner] tnf-master-clock-super-cycle -> tnf-process-health-watchdog
  (Shared owner: master-clock)
- [shared-owner] tnf-openclaw-runtime-sync -> tnf-process-health-watchdog
  (Shared owner: master-clock)
- [shared-owner] tnf-auto-git-push -> tnf-director-resonance-cycle (Shared
  owner: tnf-agent-director)
- [shared-owner] tnf-auto-git-push -> tnf-terminal-awareness-reminder (Shared
  owner: tnf-agent-director)
- [shared-owner] tnf-director-resonance-cycle -> tnf-terminal-awareness-reminder
  (Shared owner: tnf-agent-director)
- [shared-owner] tnf-llm-ranking-optimizer -> tnf-llm-verified-fleet-cycle
  (Shared owner: tnf-llm-intel-optimizer)
- [shared-subroutine] tnf-director-resonance-cycle -> tnf-recursive-logic-sieve
  (Shared subroutine: unknown-subroutine)
- [shared-category] tnf-growth-blocker-audit -> tnf-llm-ranking-optimizer
  (Shared category: self_improvement_core)
- [shared-category] tnf-growth-blocker-audit -> tnf-llm-verified-fleet-cycle
  (Shared category: self_improvement_core)
- [shared-category] tnf-growth-blocker-audit -> tnf-recursive-logic-sieve
  (Shared category: self_improvement_core)
- [shared-category] tnf-growth-blocker-audit -> tnf-self-improvement-scorecard
  (Shared category: self_improvement_core)
- [shared-category] tnf-growth-blocker-audit -> tnf-swarm-stress-test (Shared
  category: self_improvement_core)
- [shared-category] tnf-llm-ranking-optimizer -> tnf-llm-verified-fleet-cycle
  (Shared category: self_improvement_core)
- [shared-category] tnf-llm-ranking-optimizer -> tnf-recursive-logic-sieve
  (Shared category: self_improvement_core)
- [shared-category] tnf-llm-ranking-optimizer -> tnf-self-improvement-scorecard
  (Shared category: self_improvement_core)
- [shared-category] tnf-llm-ranking-optimizer -> tnf-swarm-stress-test (Shared
  category: self_improvement_core)
- [shared-category] tnf-llm-verified-fleet-cycle -> tnf-recursive-logic-sieve
  (Shared category: self_improvement_core)
- [shared-category] tnf-llm-verified-fleet-cycle ->
  tnf-self-improvement-scorecard (Shared category: self_improvement_core)
- [shared-category] tnf-llm-verified-fleet-cycle -> tnf-swarm-stress-test
  (Shared category: self_improvement_core)
- [shared-category] tnf-recursive-logic-sieve -> tnf-self-improvement-scorecard
  (Shared category: self_improvement_core)
- [shared-category] tnf-recursive-logic-sieve -> tnf-swarm-stress-test (Shared
  category: self_improvement_core)
- [shared-category] tnf-self-improvement-scorecard -> tnf-swarm-stress-test
  (Shared category: self_improvement_core)
- [shared-category] tnf-llm-arena-intel-collector -> tnf-openclaw-runtime-sync
  (Shared category: observability)
- [shared-category] tnf-llm-arena-intel-collector -> tnf-process-health-watchdog
  (Shared category: observability)
- [shared-category] tnf-llm-arena-intel-collector ->
  tnf-twip-macro-board-refresh (Shared category: observability)
- [shared-category] tnf-openclaw-runtime-sync -> tnf-process-health-watchdog
  (Shared category: observability)
- [shared-category] tnf-openclaw-runtime-sync -> tnf-twip-macro-board-refresh
  (Shared category: observability)
- [shared-category] tnf-process-health-watchdog -> tnf-twip-macro-board-refresh
  (Shared category: observability)
- [shared-category] tnf-director-resonance-cycle -> tnf-master-clock-super-cycle
  (Shared category: orchestration_gate)
- [shared-category] tnf-director-resonance-cycle ->
  tnf-subdirector-codegen-worker (Shared category: orchestration_gate)
- [shared-category] tnf-director-resonance-cycle -> tnf-subdirector-infra-worker
  (Shared category: orchestration_gate)
- [shared-category] tnf-master-clock-super-cycle ->
  tnf-subdirector-codegen-worker (Shared category: orchestration_gate)
- [shared-category] tnf-master-clock-super-cycle -> tnf-subdirector-infra-worker
  (Shared category: orchestration_gate)
- [shared-category] tnf-subdirector-codegen-worker ->
  tnf-subdirector-infra-worker (Shared category: orchestration_gate)
- [shared-category] tnf-auto-git-push -> tnf-marketplace-curation-cycle (Shared
  category: system_framework)
- [shared-category] tnf-terminal-awareness-reminder ->
  tnf-terminal-heartbeat-pulse (Shared category: system_terminal_awareness)

## Potential Growth-Limiting Constraints

- tnf-master-clock-super-cycle: system-lock-review (enabled=true, lock=true,
  runtime=healthy)
- tnf-terminal-awareness-reminder: runtime-error (enabled=true, lock=false,
  runtime=error)
- tnf-llm-arena-intel-collector: runtime-error (enabled=true, lock=false,
  runtime=error)
- tnf-self-improvement-scorecard: system-lock-review (enabled=true, lock=true,
  runtime=healthy)
