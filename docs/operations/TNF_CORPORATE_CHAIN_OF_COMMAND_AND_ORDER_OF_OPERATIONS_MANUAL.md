# TNF Corporate Chain of Command and Order of Operations Manual

Status: Draft for Adoption  
Effective Date: 2026-03-26  
Owner: Super Director, TNF Development (Daniel Goldberg, owner@example.com)  
Audience: TNF StaffOps agents, TNF engineering operators, authorized automation
services

## 1. Purpose

Establish a formal command hierarchy and deterministic operating procedure for
TNF so:

1. authority is explicit,
2. dispatch and escalation are predictable,
3. autonomous loops remain governable,
4. LLM quota/resource continuity is maintained without task loss.

## 2. Official Operations Team Naming

Corporate operations organization name:

- `TNF Development Operations Command` (`TNF-DOC`)

Agent class name for official operations agents:

- `TNF StaffOps Agents`
- tag: `staffops`

Required canonical ID format:

- `tnf-staffops-<role>-<instance>`
- examples:
  - `tnf-staffops-super-director-01`
  - `tnf-staffops-local-subdirector-01`
  - `tnf-staffops-llm-api-runner-01`

## 3. Chain of Command

### Level 1: Strategic Authority

1. `Super Director` (human authority of TNF Development)
2. Final approval for:
   - policy
   - budget/cost posture
   - emergency overrides
   - structural org changes

### Level 2: Operational Authority

1. `Director` / global orchestration authority
2. Owns:
   - mission-level planning
   - multi-system priorities
   - cross-domain conflict resolution

### Level 3: Local Runtime Authority

1. `Local Sub-Director` (single owner terminal per host)
2. Owns:
   - local terminal coordination
   - heartbeat routing enforcement
   - local escalation dispatch
   - quota-trigger handoff to LLM API runner

### Level 4: Specialized Execution Authorities

1. `LLM API Runner` (provider failover and execution continuity)
2. `OpenClaw Provider Scouts` (discover candidate providers/options)
3. `Provider Test Harness Agent` (validate viability and quality)
4. `Email Custodian Agent` (quota expansion via account provisioning when
   approved)
5. `Protocol Growth Blocker Auditor` (detect stale controls and coordination
   constraints that reduce throughput)
6. `Staffing Director Agent` (discovers staffing niches and proposes new role +
   skill packages)
7. `Staff Review Agent` (periodically reviews recent work and proposes
   prioritized improvements)

### Level 5: Worker/Task Agents

1. domain and feature agents
2. execute scoped work under current command directives

## 4. Authority and Decision Matrix

| Decision Type                      | Super Director | Director | Local Sub-Director | LLM API Runner | Other Agents |
| ---------------------------------- | -------------- | -------- | ------------------ | -------------- | ------------ |
| Policy adoption/change             | A              | C        | I                  | I              | I            |
| Priority override (global)         | A              | R        | C                  | I              | I            |
| Priority override (local host)     | A              | C        | R                  | I              | I            |
| Heartbeat routing mode             | A              | C        | R                  | I              | I            |
| LLM provider swap during low quota | A              | C        | R (trigger)        | R (execute)    | I            |
| New paid provider approval         | A              | C        | I                  | C              | I            |
| Emergency freeze/resume            | A              | R        | R (local)          | I              | I            |

Legend: `A` Accountable, `R` Responsible, `C` Consulted, `I` Informed.

## 5. Order of Operations (Standard Cycle)

### Phase 0: Governance Guardrails

1. Load command policy and role registry.
2. Confirm single Local Sub-Director owner assignment.
3. Confirm staff-only access boundaries for StaffOps resources.

### Phase 1: Bootstrap and Context Integrity

1. Verify frontload/onboarding hooks.
2. Verify handoff freshness artifacts.
3. Verify master heartbeat, local-subdirector, and terminal-heartbeat health.
4. Verify frontload logging and prompt-handoff contract:
   - command/source of prompt handoff is logged,
   - recipient/target identity is logged,
   - handoff outcome (accepted/skipped/blocked) is logged.

### Phase 2: Intake and Prioritization

1. classify incoming requests as:
   - P0 emergency
   - P1 critical
   - P2 standard
   - P3 optimization
2. route ownership to command layer before worker dispatch.

### Phase 3: Dispatch and Execution

1. assign single accountable owner per task.
2. assign supporting agents only when required.
3. enforce no task-switch for active heartbeat lanes unless explicitly
   re-routed.
4. preserve tributary progression:
   - upstream outputs must map to downstream process inputs explicitly.
   - cross-team dependencies must be visible in the master schedule artifacts.

### Phase 4: Monitoring and Escalation

1. monitor blocked/conflicted/stalled states.
2. escalate through ladder in Section 8 if SLA thresholds are exceeded.
3. preserve audit logs for each escalation.
4. enforce attribution continuity:
   - downstream processes should emit dispatch/run evidence and source linkage.
   - missing attribution evidence is a reportable reliability defect.

### Phase 5: Continuity and Recovery

1. run deterministic service remediation for failed loops.
2. replay pending queue items where safe.
3. post recovery summary to operational logs.

## 6. LLM Quota and Provider Continuity SOP

### Policy

1. Local Sub-Director SHALL monitor its primary LLM quota periodically.
2. At `<= 10%` remaining quota, Local Sub-Director SHALL trigger the
   `LLM API Runner`.
3. Provider selection SHALL prefer free OAuth-capable options first, then
   approved paid fallbacks.
4. All routing decisions SHALL be logged to shared StaffOps ledger artifacts.

### Required Roles

1. `tnf-staffops-quota-warden-01` (or integrated into Local Sub-Director loop)
2. `tnf-staffops-llm-api-runner-01`
3. `tnf-staffops-provider-scout-01..N`
4. `tnf-staffops-provider-test-harness-01`

### Deterministic Trigger Contract

1. Trigger condition:
   - `quota_remaining_percent <= 10`
2. Trigger payload minimum:
   - `actor_id`
   - `timestamp`
   - `current_provider`
   - `quota_remaining_percent`
   - `active_task_count`
   - `priority_class`
3. Required runner response:
   - selected provider/model
   - reason code
   - fallback chain
   - expected cost mode (`free-oauth` or `paid-approved`)

### Shared Staff-Only Artifacts (Required)

1. `data/staffops/llm-provider-catalog.json`
2. `data/staffops/llm-provider-test-results.json`
3. `data/staffops/llm-quota-state.template.json` (tracked template)
4. `data/staffops/llm-quota-state.json` (runtime-generated state artifact)
5. `logs/staffops-llm-routing.jsonl`

Access policy:

1. only agents tagged `staffops` and authorized by StaffOps role policy may
   read/write.
2. worker agents receive only filtered outputs, never full credential-bearing
   records.

## 6A. Corporation-Wide Coordination and Tributary Policy

1. TNF SHALL maintain a living master calendar and master schedule artifact that
   maps cron jobs, owners, categories, and interrelationships.
2. Every recurring process SHALL have:
   - accountable owner agent
   - protocol/runbook linkage
   - observable runtime state
3. Any policy that blocks, disables, freezes, or restricts execution SHALL be
   reviewed periodically by a designated auditor role.
4. Stale controls without current business justification SHALL be treated as
   growth blockers and scheduled for remediation.

Primary artifacts:

1. `data/protocols/tnf-staff-master-calendar.json`
2. `docs/operations/TNF_STAFF_MASTER_CALENDAR_AND_SCHEDULE.md`
3. `reports/protocols/growth-blocker-audit/growth-blocker-audit-latest.json`
4. `reports/protocols/growth-blocker-audit/growth-blocker-audit-latest.md`

## 6B. Frontloading and Prompt Handoff Reinforcement Policy

1. Frontloading SHALL reinforce:
   - logging discipline,
   - command attribution,
   - prompt handoff integrity.
2. Every StaffOps heartbeat or dispatch path SHALL emit:
   - `from_agent_id`
   - `to_agent_id` (or target channel)
   - `handoff_type` (`frontload`, `heartbeat`, `escalation`, `task`)
   - `handoff_result` (`delivered`, `skipped`, `blocked`, `deferred`)
3. Frontload validation SHALL run before critical autonomous loops and SHALL
   fail closed for missing handoff metadata in system-framework schedules.
4. Per-agent tenant frontloading and inter-agent prompt handoff pipelines are a
   planned next-step capability and SHALL be modeled as:
   - tenant profile specific frontload bundle,
   - per-agent relationship-aware handoff routes,
   - policy-enforced logging across each hop.

Reference artifacts:

1. `logs/staffops-staffing.jsonl`
2. `logs/staffops-review.jsonl`
3. `reports/protocols/staffing-director/staffing-director-latest.json`
4. `reports/protocols/staff-review/staff-review-latest.json`

## 7. Command Issuance Rules

1. Higher command level directives supersede lower-level directives.
2. Conflicting directives at same level require escalation, not local
   arbitration.
3. Emergency freeze command (`P0`) pauses non-critical autonomous loops except:
   - safety monitors
   - audit log writers
   - incident responders

## 8. Escalation Ladder and SLA

1. `L5 -> L4` (worker to specialist): immediate on hard block.
2. `L4 -> L3` (specialist to Local Sub-Director): within 2 minutes on unresolved
   block.
3. `L3 -> L2` (Local Sub-Director to Director): within 5 minutes for multi-lane
   conflict.
4. `L2 -> L1` (Director to Super Director): within 10 minutes for strategic or
   cost-risk decisions.

## 9. Logging and Evidence Requirements

Every critical operation SHALL emit:

1. command issuer + authority level
2. task/incident identifier
3. decision and reason code
4. before/after status
5. next action or escalation target

Minimum retention:

1. heartbeat and dispatch summaries: 14 days
2. incident and quota-routing logs: 30 days
3. policy change logs: permanent

## 10. Change Management for This Manual

1. Proposed edits must include:
   - section impacted
   - risk rationale
   - rollback plan
2. Approvals:
   - `Director` review required
   - `Super Director` approval required for Sections 3, 4, 6, 8
3. Every accepted change increments version metadata and appends a changelog
   entry.

## 11. Immediate Adoption Checklist

1. Confirm and register StaffOps canonical IDs for command-layer agents.
2. Create staff-only LLM resource catalog and test-result ledger.
3. Wire quota threshold trigger (`<=10%`) into Local Sub-Director runtime loop.
4. Route trigger actions to designated LLM API Runner.
5. Enforce logging contract for all provider switch decisions.
6. Validate escalation flow with a controlled dry-run incident.
7. Generate/update master calendar artifacts:
   - `node scripts/protocols/build-staff-master-calendar.cjs`
8. Run growth-blocker audit:
   - `node .skills/tnf-growth-blocker-auditor/scripts/run_growth_blocker_audit.cjs`
9. Run staffing director cycle:
   - `node .skills/tnf-staffing-director-agent/scripts/run_staffing_director_cycle.cjs`
10. Run staff review cycle:

- `node .skills/tnf-staff-review-agent/scripts/run_staff_review_cycle.cjs`

11. Enforce frontload handoff logging checks in recurring operations reviews.
12. Install StaffOps recurring cron runner bindings:

- `node scripts/protocols/staffops-schedule-sync.cjs install --json`

## 12. Version Metadata

- Version: `v0.2-draft`
- Last Updated: `2026-03-26`
- Next Review Window: `2026-04-02`
