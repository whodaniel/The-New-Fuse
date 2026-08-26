# TNF Staff Master Calendar and Master Schedule

Generated: 2026-08-26T11:20:18.533Z

## Summary

- Total schedules: 20
- Enabled schedules: 20
- Disabled schedules: 0
- Locked schedules: 2
- Schedules with stale-run warning: 0
- Interrelationship edges: 31

## Schedule Table

| Schedule ID | Scope | Category | Owner | Cadence | TZ | Enabled | Runtime | Lock | Subroutine |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| tnf-swarm-stress-test | system_framework | self_improvement_core | tnf-swarm-supervisor | */10 * * * * | UTC | yes | running | open | scripts/orchestrator/swarm-stress-test.sh |
| tnf-twip-macro-board-refresh | system_framework | observability | twip-orchestration-bridge | */10 * * * * | UTC | yes | deferred | open | scripts/protocols/twip-macro-board.cjs |
| tnf-master-clock-super-cycle | system_framework | orchestration_gate | master-clock | */15 * * * * | UTC | yes | deferred | locked | scripts/protocols/synthetic-federation-gate-check.cjs |
| tnf-openclaw-runtime-sync | system_framework | observability | master-clock | */15 * * * * | UTC | yes | deferred | open | scripts/openclaw/tnf-openclaw-control.cjs |
| tnf-marketplace-curation-cycle | system_framework | system_framework | tnf-marketplace-curator | */30 * * * * | UTC | yes | healthy | open | scripts/orchestrator/marketplace-curation-agent.sh |
| tnf-process-health-watchdog | system_framework | observability | master-clock | */30 * * * * | UTC | yes | deferred | open | scripts/protocols/verify-process-health.cjs |
| tnf-terminal-awareness-reminder | system_framework | system_terminal_awareness | tnf-agent-director | */30 * * * * | UTC | yes | error | open | scripts/verify_frontload_state.sh |
| tnf-auto-git-push | system_framework | system_framework | tnf-agent-director | 0 * * * * | UTC | yes | healthy | open | scripts/orchestrator/auto-git-push.sh |
| tnf-growth-blocker-audit | system_framework | self_improvement_core | tnf-growth-blocker-auditor | 0 */4 * * * | UTC | yes | unknown | open | .skills/tnf-growth-blocker-auditor/scripts/run_growth_blocker_audit.cjs |
| tnf-llm-arena-intel-collector | system_framework | observability | tnf-llm-intel-collector | 0 */4 * * * | UTC | yes | unknown | open | scripts/llm-intel/llm-arena-intel-collector.cjs |
| tnf-llm-verified-fleet-cycle | system_framework | self_improvement_core | tnf-llm-intel-optimizer | 0 */6 * * * | UTC | yes | deferred | open | scripts/llm-intel/tnf-llm-verified-fleet-cycle.cjs |
| tnf-self-improvement-scorecard | system_framework | self_improvement_core | tnf-stack-self-improvement-loop | 0 */6 * * * | UTC | yes | deferred | locked | scripts/validate-protocol-schemas.cjs |
| tnf-staff-review-cycle | system_framework | staff_review | tnf-staff-review-agent | 15 */2 * * * | UTC | yes | deferred | open | .skills/tnf-staff-review-agent/scripts/run_staff_review_cycle.cjs |
| tnf-staff-role-call-and-scheduling | system_framework | staff_coordination | tnf-staff-scheduling-agent | */20 * * * * | UTC | yes | running | open | scripts/protocols/staffops-role-call.cjs |
| tnf-staffing-director-cycle | system_framework | staff_architecture | tnf-staffing-director-agent | 30 */6 * * * | UTC | yes | unknown | open | .skills/tnf-staffing-director-agent/scripts/run_staffing_director_cycle.cjs |
| tnf-director-resonance-cycle | system_framework | orchestration_gate | tnf-agent-director | manual | UTC | yes | unknown | open | n/a |
| tnf-llm-ranking-optimizer | system_framework | self_improvement_core | tnf-llm-intel-optimizer | 30 */4 * * * | UTC | yes | unknown | open | scripts/llm-intel/llm-ranking-optimizer.cjs |
| tnf-subdirector-codegen-worker | system_framework | orchestration_gate | tnf-subdirector-codegen | manual | UTC | yes | unknown | open | scripts/agents/subdirector-codegen-worker-cycle.sh |
| tnf-subdirector-infra-worker | system_framework | orchestration_gate | tnf-subdirector-infra | manual | UTC | yes | unknown | open | scripts/agents/subdirector-infra-worker-cycle.sh |
| tnf-terminal-heartbeat-pulse | system_framework | system_terminal_awareness | tnf-master-clock | * * * * * | UTC | yes | deferred | open | scripts/runtime/terminal-heartbeat-pulse.cjs |

## Interrelationships

- [shared-owner] tnf-master-clock-super-cycle -> tnf-openclaw-runtime-sync (Shared owner: master-clock)
- [shared-owner] tnf-master-clock-super-cycle -> tnf-process-health-watchdog (Shared owner: master-clock)
- [shared-owner] tnf-openclaw-runtime-sync -> tnf-process-health-watchdog (Shared owner: master-clock)
- [shared-owner] tnf-auto-git-push -> tnf-director-resonance-cycle (Shared owner: tnf-agent-director)
- [shared-owner] tnf-auto-git-push -> tnf-terminal-awareness-reminder (Shared owner: tnf-agent-director)
- [shared-owner] tnf-director-resonance-cycle -> tnf-terminal-awareness-reminder (Shared owner: tnf-agent-director)
- [shared-owner] tnf-llm-ranking-optimizer -> tnf-llm-verified-fleet-cycle (Shared owner: tnf-llm-intel-optimizer)
- [shared-category] tnf-growth-blocker-audit -> tnf-llm-ranking-optimizer (Shared category: self_improvement_core)
- [shared-category] tnf-growth-blocker-audit -> tnf-llm-verified-fleet-cycle (Shared category: self_improvement_core)
- [shared-category] tnf-growth-blocker-audit -> tnf-self-improvement-scorecard (Shared category: self_improvement_core)
- [shared-category] tnf-growth-blocker-audit -> tnf-swarm-stress-test (Shared category: self_improvement_core)
- [shared-category] tnf-llm-ranking-optimizer -> tnf-llm-verified-fleet-cycle (Shared category: self_improvement_core)
- [shared-category] tnf-llm-ranking-optimizer -> tnf-self-improvement-scorecard (Shared category: self_improvement_core)
- [shared-category] tnf-llm-ranking-optimizer -> tnf-swarm-stress-test (Shared category: self_improvement_core)
- [shared-category] tnf-llm-verified-fleet-cycle -> tnf-self-improvement-scorecard (Shared category: self_improvement_core)
- [shared-category] tnf-llm-verified-fleet-cycle -> tnf-swarm-stress-test (Shared category: self_improvement_core)
- [shared-category] tnf-self-improvement-scorecard -> tnf-swarm-stress-test (Shared category: self_improvement_core)
- [shared-category] tnf-llm-arena-intel-collector -> tnf-openclaw-runtime-sync (Shared category: observability)
- [shared-category] tnf-llm-arena-intel-collector -> tnf-process-health-watchdog (Shared category: observability)
- [shared-category] tnf-llm-arena-intel-collector -> tnf-twip-macro-board-refresh (Shared category: observability)
- [shared-category] tnf-openclaw-runtime-sync -> tnf-process-health-watchdog (Shared category: observability)
- [shared-category] tnf-openclaw-runtime-sync -> tnf-twip-macro-board-refresh (Shared category: observability)
- [shared-category] tnf-process-health-watchdog -> tnf-twip-macro-board-refresh (Shared category: observability)
- [shared-category] tnf-director-resonance-cycle -> tnf-master-clock-super-cycle (Shared category: orchestration_gate)
- [shared-category] tnf-director-resonance-cycle -> tnf-subdirector-codegen-worker (Shared category: orchestration_gate)
- [shared-category] tnf-director-resonance-cycle -> tnf-subdirector-infra-worker (Shared category: orchestration_gate)
- [shared-category] tnf-master-clock-super-cycle -> tnf-subdirector-codegen-worker (Shared category: orchestration_gate)
- [shared-category] tnf-master-clock-super-cycle -> tnf-subdirector-infra-worker (Shared category: orchestration_gate)
- [shared-category] tnf-subdirector-codegen-worker -> tnf-subdirector-infra-worker (Shared category: orchestration_gate)
- [shared-category] tnf-auto-git-push -> tnf-marketplace-curation-cycle (Shared category: system_framework)
- [shared-category] tnf-terminal-awareness-reminder -> tnf-terminal-heartbeat-pulse (Shared category: system_terminal_awareness)

## Potential Growth-Limiting Constraints

- tnf-master-clock-super-cycle: system-lock-review (enabled=true, lock=true, runtime=deferred)
- tnf-terminal-awareness-reminder: runtime-error (enabled=true, lock=false, runtime=error)
- tnf-self-improvement-scorecard: system-lock-review (enabled=true, lock=true, runtime=deferred)

