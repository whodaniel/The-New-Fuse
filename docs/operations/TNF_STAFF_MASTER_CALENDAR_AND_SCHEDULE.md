# TNF Staff Master Calendar and Master Schedule

Generated: 2026-08-10T08:20:27.228Z

## Summary

- Total schedules: 35
- Enabled schedules: 35
- Disabled schedules: 0
- Locked schedules: 2
- Schedules with stale-run warning: 0
- Interrelationship edges: 130

## Schedule Table

| Schedule ID                                    | Scope            | Category                  | Owner                                            | Cadence         | TZ               | Enabled | Runtime  | Lock   | Subroutine                                                                  |
| ---------------------------------------------- | ---------------- | ------------------------- | ------------------------------------------------ | --------------- | ---------------- | ------- | -------- | ------ | --------------------------------------------------------------------------- |
| tnf-swarm-stress-test                          | system_framework | self_improvement_core     | tnf-swarm-supervisor                             | _/10 _ \* \* \* | UTC              | yes     | healthy  | open   | scripts/orchestrator/swarm-stress-test.sh                                   |
| tnf-twip-macro-board-refresh                   | system_framework | observability             | twip-orchestration-bridge                        | _/10 _ \* \* \* | UTC              | yes     | healthy  | open   | scripts/protocols/twip-macro-board.cjs                                      |
| tenant-loop-watchdog                           | tenant           | tenant_agent_loop         | auth-blocker-sentinel                            | _/15 _ \* \* \* | UTC              | yes     | healthy  | open   | scripts/protocols/chronological-dispatch.cjs                                |
| tenant-personal-archaeology-blocker-watch      | tenant           | tenant_agent_loop         | auth-blocker-sentinel                            | _/15 _ \* \* \* | UTC              | yes     | healthy  | open   | scripts/timeline/personal-archaeology-orchestrator.mjs                      |
| tnf-master-clock-super-cycle                   | system_framework | orchestration_gate        | master-clock                                     | _/15 _ \* \* \* | UTC              | yes     | healthy  | locked | scripts/protocols/synthetic-federation-gate-check.cjs                       |
| tnf-openclaw-runtime-sync                      | system_framework | observability             | master-clock                                     | _/15 _ \* \* \* | UTC              | yes     | healthy  | open   | scripts/openclaw/tnf-openclaw-control.cjs                                   |
| tenant-orchestrator-pulse                      | tenant           | tenant_agent_loop         | tnf-agent-director                               | _/30 _ \* \* \* | UTC              | yes     | healthy  | open   | scripts/protocols/chronological-dispatch.cjs                                |
| tenant-personal-archaeology-master-loop        | tenant           | tenant_agent_loop         | personal-archaeology-master-orchestrator         | _/30 _ \* \* \* | UTC              | yes     | healthy  | open   | scripts/timeline/personal-archaeology-orchestrator.mjs                      |
| tnf-marketplace-curation-cycle                 | system_framework | system_framework          | tnf-marketplace-curator                          | _/30 _ \* \* \* | UTC              | yes     | healthy  | open   | scripts/orchestrator/marketplace-curation-agent.sh                          |
| tnf-process-health-watchdog                    | system_framework | observability             | master-clock                                     | _/30 _ \* \* \* | UTC              | yes     | healthy  | open   | scripts/protocols/verify-process-health.cjs                                 |
| tnf-terminal-awareness-reminder                | system_framework | system_terminal_awareness | tnf-agent-director                               | _/30 _ \* \* \* | UTC              | yes     | error    | open   | scripts/verify_frontload_state.sh                                           |
| tenant-continuous-qa-loop                      | tenant           | tenant_automation         | qa-swarm-supervisor                              | 0 _/6 _ \* \*   | UTC              | yes     | healthy  | open   | scripts/protocols/chronological-dispatch.cjs                                |
| tenant-hourly-attribution-audit                | tenant           | tenant_automation         | analytics-and-reporting-agent                    | 0 \* \* \* \*   | UTC              | yes     | healthy  | open   | scripts/protocols/chronological-dispatch.cjs                                |
| tenant-knowledge-scout-sprint                  | tenant           | tenant_automation         | information-retrieval-agent                      | 0 _/4 _ \* \*   | UTC              | yes     | error    | open   | scripts/swarm/knowledge-scout-complete.cjs                                  |
| tenant-personal-archaeology-digest             | tenant           | tenant_automation         | personal-archaeology-narrative-team-orchestrator | 0 _/12 _ \* \*  | UTC              | yes     | healthy  | open   | scripts/timeline/personal-archaeology-orchestrator.mjs                      |
| tenant-self-improvement-loop                   | tenant           | tenant_agent_loop         | tnf-stack-self-improvement-loop                  | 0 _/2 _ \* \*   | UTC              | yes     | healthy  | open   | scripts/protocols/chronological-dispatch.cjs                                |
| tenant-terminal-awareness-default              | tenant           | tenant_terminal_awareness | tenant-agent-default                             | 0 \* \* \* \*   | UTC              | yes     | healthy  | open   | scripts/protocols/chronological-dispatch.cjs                                |
| tnf-auto-git-push                              | system_framework | system_framework          | tnf-agent-director                               | 0 \* \* \* \*   | UTC              | yes     | healthy  | open   | scripts/orchestrator/auto-git-push.sh                                       |
| tnf-growth-blocker-audit                       | system_framework | self_improvement_core     | tnf-growth-blocker-auditor                       | 0 _/4 _ \* \*   | UTC              | yes     | healthy  | open   | .skills/tnf-growth-blocker-auditor/scripts/run_growth_blocker_audit.cjs     |
| tnf-llm-arena-intel-collector                  | system_framework | observability             | tnf-llm-intel-collector                          | 0 _/4 _ \* \*   | UTC              | yes     | healthy  | open   | scripts/llm-intel/llm-arena-intel-collector.cjs                             |
| tnf-llm-verified-fleet-cycle                   | system_framework | self_improvement_core     | tnf-llm-intel-optimizer                          | 0 _/6 _ \* \*   | UTC              | yes     | healthy  | open   | scripts/llm-intel/tnf-llm-verified-fleet-cycle.cjs                          |
| tnf-runtime-log-rotation                       | system_framework | observability             | master-clock                                     | 0 _/4 _ \* \*   | UTC              | yes     | healthy  | open   | scripts/protocols/rotate-runtime-logs.cjs                                   |
| tnf-self-improvement-scorecard                 | system_framework | self_improvement_core     | tnf-stack-self-improvement-loop                  | 0 _/6 _ \* \*   | UTC              | yes     | healthy  | locked | scripts/validate-protocol-schemas.cjs                                       |
| tenant-personal-archaeology-investigator-pulse | tenant           | tenant_agent_loop         | personal-archaeology-source-team-orchestrator    | 15 _/2 _ \* \*  | UTC              | yes     | healthy  | open   | scripts/timeline/personal-archaeology-orchestrator.mjs                      |
| tnf-staff-review-cycle                         | system_framework | staff_review              | tnf-staff-review-agent                           | 15 _/2 _ \* \*  | UTC              | yes     | healthy  | open   | .skills/tnf-staff-review-agent/scripts/run_staff_review_cycle.cjs           |
| tnf-staff-role-call-and-scheduling             | system_framework | staff_coordination        | tnf-staff-scheduling-agent                       | _/20 _ \* \* \* | UTC              | yes     | running  | open   | scripts/protocols/staffops-role-call.cjs                                    |
| tnf-staffing-director-cycle                    | system_framework | staff_architecture        | tnf-staffing-director-agent                      | 30 _/6 _ \* \*  | UTC              | yes     | deferred | open   | .skills/tnf-staffing-director-agent/scripts/run_staffing_director_cycle.cjs |
| tenant-launch-validation                       | tenant           | tenant_experiment         | tnf-agent-director                               | manual          | UTC              | yes     | unknown  | open   | scripts/protocols/chronological-dispatch.cjs                                |
| tnf-director-resonance-cycle                   | system_framework | orchestration_gate        | tnf-agent-director                               | manual          | UTC              | yes     | unknown  | open   | n/a                                                                         |
| tnf-llm-ranking-optimizer                      | system_framework | self_improvement_core     | tnf-llm-intel-optimizer                          | 30 _/4 _ \* \*  | UTC              | yes     | deferred | open   | scripts/llm-intel/llm-ranking-optimizer.cjs                                 |
| tnf-subdirector-codegen-worker                 | system_framework | orchestration_gate        | tnf-subdirector-codegen                          | manual          | UTC              | yes     | unknown  | open   | scripts/agents/subdirector-codegen-worker-cycle.sh                          |
| tnf-subdirector-infra-worker                   | system_framework | orchestration_gate        | tnf-subdirector-infra                            | manual          | UTC              | yes     | unknown  | open   | scripts/agents/subdirector-infra-worker-cycle.sh                            |
| tnf-terminal-heartbeat-pulse                   | system_framework | system_terminal_awareness | tnf-master-clock                                 | \* \* \* \* \*  | UTC              | yes     | healthy  | open   | scripts/runtime/terminal-heartbeat-pulse.cjs                                |
| tenant-daily-priority-plan                     | tenant           | tenant_automation         | tnf-agent-director                               | 0 9 \* \* \*    | America/New_York | yes     | healthy  | open   | scripts/protocols/chronological-dispatch.cjs                                |
| tenant-nightly-maintenance                     | tenant           | tenant_automation         | tnf-agent-director                               | 30 3 \* \* \*   | America/New_York | yes     | deferred | open   | scripts/protocols/chronological-dispatch.cjs                                |

## Interrelationships

- [shared-owner] tenant-loop-watchdog ->
  tenant-personal-archaeology-blocker-watch (Shared owner:
  auth-blocker-sentinel)
- [shared-owner] tnf-master-clock-super-cycle -> tnf-openclaw-runtime-sync
  (Shared owner: master-clock)
- [shared-owner] tnf-master-clock-super-cycle -> tnf-process-health-watchdog
  (Shared owner: master-clock)
- [shared-owner] tnf-master-clock-super-cycle -> tnf-runtime-log-rotation
  (Shared owner: master-clock)
- [shared-owner] tnf-openclaw-runtime-sync -> tnf-process-health-watchdog
  (Shared owner: master-clock)
- [shared-owner] tnf-openclaw-runtime-sync -> tnf-runtime-log-rotation (Shared
  owner: master-clock)
- [shared-owner] tnf-process-health-watchdog -> tnf-runtime-log-rotation (Shared
  owner: master-clock)
- [shared-owner] tenant-daily-priority-plan -> tenant-launch-validation (Shared
  owner: tnf-agent-director)
- [shared-owner] tenant-daily-priority-plan -> tenant-nightly-maintenance
  (Shared owner: tnf-agent-director)
- [shared-owner] tenant-daily-priority-plan -> tenant-orchestrator-pulse (Shared
  owner: tnf-agent-director)
- [shared-owner] tenant-daily-priority-plan -> tnf-auto-git-push (Shared owner:
  tnf-agent-director)
- [shared-owner] tenant-daily-priority-plan -> tnf-director-resonance-cycle
  (Shared owner: tnf-agent-director)
- [shared-owner] tenant-daily-priority-plan -> tnf-terminal-awareness-reminder
  (Shared owner: tnf-agent-director)
- [shared-owner] tenant-launch-validation -> tenant-nightly-maintenance (Shared
  owner: tnf-agent-director)
- [shared-owner] tenant-launch-validation -> tenant-orchestrator-pulse (Shared
  owner: tnf-agent-director)
- [shared-owner] tenant-launch-validation -> tnf-auto-git-push (Shared owner:
  tnf-agent-director)
- [shared-owner] tenant-launch-validation -> tnf-director-resonance-cycle
  (Shared owner: tnf-agent-director)
- [shared-owner] tenant-launch-validation -> tnf-terminal-awareness-reminder
  (Shared owner: tnf-agent-director)
- [shared-owner] tenant-nightly-maintenance -> tenant-orchestrator-pulse (Shared
  owner: tnf-agent-director)
- [shared-owner] tenant-nightly-maintenance -> tnf-auto-git-push (Shared owner:
  tnf-agent-director)
- [shared-owner] tenant-nightly-maintenance -> tnf-director-resonance-cycle
  (Shared owner: tnf-agent-director)
- [shared-owner] tenant-nightly-maintenance -> tnf-terminal-awareness-reminder
  (Shared owner: tnf-agent-director)
- [shared-owner] tenant-orchestrator-pulse -> tnf-auto-git-push (Shared owner:
  tnf-agent-director)
- [shared-owner] tenant-orchestrator-pulse -> tnf-director-resonance-cycle
  (Shared owner: tnf-agent-director)
- [shared-owner] tenant-orchestrator-pulse -> tnf-terminal-awareness-reminder
  (Shared owner: tnf-agent-director)
- [shared-owner] tnf-auto-git-push -> tnf-director-resonance-cycle (Shared
  owner: tnf-agent-director)
- [shared-owner] tnf-auto-git-push -> tnf-terminal-awareness-reminder (Shared
  owner: tnf-agent-director)
- [shared-owner] tnf-director-resonance-cycle -> tnf-terminal-awareness-reminder
  (Shared owner: tnf-agent-director)
- [shared-owner] tenant-self-improvement-loop -> tnf-self-improvement-scorecard
  (Shared owner: tnf-stack-self-improvement-loop)
- [shared-owner] tnf-llm-ranking-optimizer -> tnf-llm-verified-fleet-cycle
  (Shared owner: tnf-llm-intel-optimizer)
- [shared-subroutine] tenant-continuous-qa-loop -> tenant-daily-priority-plan
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-continuous-qa-loop ->
  tenant-hourly-attribution-audit (Shared subroutine:
  scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-continuous-qa-loop -> tenant-launch-validation
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-continuous-qa-loop -> tenant-loop-watchdog (Shared
  subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-continuous-qa-loop -> tenant-nightly-maintenance
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-continuous-qa-loop -> tenant-orchestrator-pulse
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-continuous-qa-loop -> tenant-self-improvement-loop
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-continuous-qa-loop ->
  tenant-terminal-awareness-default (Shared subroutine:
  scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-daily-priority-plan ->
  tenant-hourly-attribution-audit (Shared subroutine:
  scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-daily-priority-plan -> tenant-launch-validation
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-daily-priority-plan -> tenant-loop-watchdog (Shared
  subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-daily-priority-plan -> tenant-nightly-maintenance
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-daily-priority-plan -> tenant-orchestrator-pulse
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-daily-priority-plan -> tenant-self-improvement-loop
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-daily-priority-plan ->
  tenant-terminal-awareness-default (Shared subroutine:
  scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-hourly-attribution-audit ->
  tenant-launch-validation (Shared subroutine:
  scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-hourly-attribution-audit -> tenant-loop-watchdog
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-hourly-attribution-audit ->
  tenant-nightly-maintenance (Shared subroutine:
  scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-hourly-attribution-audit ->
  tenant-orchestrator-pulse (Shared subroutine:
  scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-hourly-attribution-audit ->
  tenant-self-improvement-loop (Shared subroutine:
  scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-hourly-attribution-audit ->
  tenant-terminal-awareness-default (Shared subroutine:
  scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-launch-validation -> tenant-loop-watchdog (Shared
  subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-launch-validation -> tenant-nightly-maintenance
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-launch-validation -> tenant-orchestrator-pulse
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-launch-validation -> tenant-self-improvement-loop
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-launch-validation ->
  tenant-terminal-awareness-default (Shared subroutine:
  scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-loop-watchdog -> tenant-nightly-maintenance (Shared
  subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-loop-watchdog -> tenant-orchestrator-pulse (Shared
  subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-loop-watchdog -> tenant-self-improvement-loop
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-loop-watchdog -> tenant-terminal-awareness-default
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-nightly-maintenance -> tenant-orchestrator-pulse
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-nightly-maintenance -> tenant-self-improvement-loop
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-nightly-maintenance ->
  tenant-terminal-awareness-default (Shared subroutine:
  scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-orchestrator-pulse -> tenant-self-improvement-loop
  (Shared subroutine: scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-orchestrator-pulse ->
  tenant-terminal-awareness-default (Shared subroutine:
  scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-self-improvement-loop ->
  tenant-terminal-awareness-default (Shared subroutine:
  scripts/protocols/chronological-dispatch.cjs)
- [shared-subroutine] tenant-personal-archaeology-blocker-watch ->
  tenant-personal-archaeology-digest (Shared subroutine:
  scripts/timeline/personal-archaeology-orchestrator.mjs)
- [shared-subroutine] tenant-personal-archaeology-blocker-watch ->
  tenant-personal-archaeology-investigator-pulse (Shared subroutine:
  scripts/timeline/personal-archaeology-orchestrator.mjs)
- [shared-subroutine] tenant-personal-archaeology-blocker-watch ->
  tenant-personal-archaeology-master-loop (Shared subroutine:
  scripts/timeline/personal-archaeology-orchestrator.mjs)
- [shared-subroutine] tenant-personal-archaeology-digest ->
  tenant-personal-archaeology-investigator-pulse (Shared subroutine:
  scripts/timeline/personal-archaeology-orchestrator.mjs)
- [shared-subroutine] tenant-personal-archaeology-digest ->
  tenant-personal-archaeology-master-loop (Shared subroutine:
  scripts/timeline/personal-archaeology-orchestrator.mjs)
- [shared-subroutine] tenant-personal-archaeology-investigator-pulse ->
  tenant-personal-archaeology-master-loop (Shared subroutine:
  scripts/timeline/personal-archaeology-orchestrator.mjs)
- [shared-category] tnf-growth-blocker-audit -> tnf-llm-ranking-optimizer
  (Shared category: self_improvement_core)
- [shared-category] tnf-growth-blocker-audit -> tnf-llm-verified-fleet-cycle
  (Shared category: self_improvement_core)
- [shared-category] tnf-growth-blocker-audit -> tnf-self-improvement-scorecard
  (Shared category: self_improvement_core)
- [shared-category] tnf-growth-blocker-audit -> tnf-swarm-stress-test (Shared
  category: self_improvement_core)
- [shared-category] tnf-llm-ranking-optimizer -> tnf-llm-verified-fleet-cycle
  (Shared category: self_improvement_core)
- [shared-category] tnf-llm-ranking-optimizer -> tnf-self-improvement-scorecard
  (Shared category: self_improvement_core)
- [shared-category] tnf-llm-ranking-optimizer -> tnf-swarm-stress-test (Shared
  category: self_improvement_core)
- [shared-category] tnf-llm-verified-fleet-cycle ->
  tnf-self-improvement-scorecard (Shared category: self_improvement_core)
- [shared-category] tnf-llm-verified-fleet-cycle -> tnf-swarm-stress-test
  (Shared category: self_improvement_core)
- [shared-category] tnf-self-improvement-scorecard -> tnf-swarm-stress-test
  (Shared category: self_improvement_core)
- [shared-category] tnf-llm-arena-intel-collector -> tnf-openclaw-runtime-sync
  (Shared category: observability)
- [shared-category] tnf-llm-arena-intel-collector -> tnf-process-health-watchdog
  (Shared category: observability)
- [shared-category] tnf-llm-arena-intel-collector -> tnf-runtime-log-rotation
  (Shared category: observability)
- [shared-category] tnf-llm-arena-intel-collector ->
  tnf-twip-macro-board-refresh (Shared category: observability)
- [shared-category] tnf-openclaw-runtime-sync -> tnf-process-health-watchdog
  (Shared category: observability)
- [shared-category] tnf-openclaw-runtime-sync -> tnf-runtime-log-rotation
  (Shared category: observability)
- [shared-category] tnf-openclaw-runtime-sync -> tnf-twip-macro-board-refresh
  (Shared category: observability)
- [shared-category] tnf-process-health-watchdog -> tnf-runtime-log-rotation
  (Shared category: observability)
- [shared-category] tnf-process-health-watchdog -> tnf-twip-macro-board-refresh
  (Shared category: observability)
- [shared-category] tnf-runtime-log-rotation -> tnf-twip-macro-board-refresh
  (Shared category: observability)
- [shared-category] tenant-loop-watchdog -> tenant-orchestrator-pulse (Shared
  category: tenant_agent_loop)
- [shared-category] tenant-loop-watchdog ->
  tenant-personal-archaeology-blocker-watch (Shared category: tenant_agent_loop)
- [shared-category] tenant-loop-watchdog ->
  tenant-personal-archaeology-investigator-pulse (Shared category:
  tenant_agent_loop)
- [shared-category] tenant-loop-watchdog ->
  tenant-personal-archaeology-master-loop (Shared category: tenant_agent_loop)
- [shared-category] tenant-loop-watchdog -> tenant-self-improvement-loop (Shared
  category: tenant_agent_loop)
- [shared-category] tenant-orchestrator-pulse ->
  tenant-personal-archaeology-blocker-watch (Shared category: tenant_agent_loop)
- [shared-category] tenant-orchestrator-pulse ->
  tenant-personal-archaeology-investigator-pulse (Shared category:
  tenant_agent_loop)
- [shared-category] tenant-orchestrator-pulse ->
  tenant-personal-archaeology-master-loop (Shared category: tenant_agent_loop)
- [shared-category] tenant-orchestrator-pulse -> tenant-self-improvement-loop
  (Shared category: tenant_agent_loop)
- [shared-category] tenant-personal-archaeology-blocker-watch ->
  tenant-personal-archaeology-investigator-pulse (Shared category:
  tenant_agent_loop)
- [shared-category] tenant-personal-archaeology-blocker-watch ->
  tenant-personal-archaeology-master-loop (Shared category: tenant_agent_loop)
- [shared-category] tenant-personal-archaeology-blocker-watch ->
  tenant-self-improvement-loop (Shared category: tenant_agent_loop)
- [shared-category] tenant-personal-archaeology-investigator-pulse ->
  tenant-personal-archaeology-master-loop (Shared category: tenant_agent_loop)
- [shared-category] tenant-personal-archaeology-investigator-pulse ->
  tenant-self-improvement-loop (Shared category: tenant_agent_loop)
- [shared-category] tenant-personal-archaeology-master-loop ->
  tenant-self-improvement-loop (Shared category: tenant_agent_loop)
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
- [shared-category] tenant-continuous-qa-loop -> tenant-daily-priority-plan
  (Shared category: tenant_automation)
- [shared-category] tenant-continuous-qa-loop -> tenant-hourly-attribution-audit
  (Shared category: tenant_automation)
- [shared-category] tenant-continuous-qa-loop -> tenant-knowledge-scout-sprint
  (Shared category: tenant_automation)
- [shared-category] tenant-continuous-qa-loop -> tenant-nightly-maintenance
  (Shared category: tenant_automation)
- [shared-category] tenant-continuous-qa-loop ->
  tenant-personal-archaeology-digest (Shared category: tenant_automation)
- ... truncated 10 additional edges; see JSON artifact for full set.

## Potential Growth-Limiting Constraints

- tnf-master-clock-super-cycle: system-lock-review (enabled=true, lock=true,
  runtime=healthy)
- tnf-terminal-awareness-reminder: runtime-error (enabled=true, lock=false,
  runtime=error)
- tenant-knowledge-scout-sprint: runtime-error (enabled=true, lock=false,
  runtime=error)
- tnf-self-improvement-scorecard: system-lock-review (enabled=true, lock=true,
  runtime=healthy)
