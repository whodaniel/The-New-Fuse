# TNF Federated Orchestration GTM Plan (72-Hour Outline)

Date: 2026-03-18  
Status: In Progress  
Scope: Federation completion + hosted product packaging + launch-ready controls

## 1) Context Snapshot (Latest)

1. TWIP macro scan (`2026-03-18T22:52:59.905Z`) reports:
   - 23 total terminals
   - 5 active work terminals
   - 3 terminals running approval-bypass flags
   - 1 terminal using remote MCP client
2. Federation and gate contracts are present at protocol layer:
   - `docs/protocols/bridges/twip-federation-orchestration-gates.yml`
   - `docs/protocols/bridges/tnf-cron-federation-gates.yml`
   - `docs/protocols/bridges/agent-self-edit-federation-gates.yml`
3. Master cumulative identity contract exists and already includes schedule
   lineage:
   - `docs/protocols/schemas/tnf-master-cumulative-id.schema.json`
4. Cron scope/category governance is defined:
   - `docs/protocols/schemas/tnf-cron-governance.schema.json`
   - `data/protocols/cron-jobs.registry.json`

## 2) Target Operating Model (Director + Orchestrator + Broker)

1. `tnf-agent` / `tnf-cli-agent` acts as **Local Director**:
   - polls TWIP inventory/macro telemetry
   - enforces local pre-gates for risky runtimes
   - publishes terminal-aware workstream signals
2. Cloud Orchestrator acts as **Global Planner**:
   - decomposes goals into tenant-safe assignments
   - attaches MCID lineage for every handoff
   - requires gate-complete packets before execution
3. Broker/Workflow Engine acts as **Execution Router**:
   - dispatches approved packets to agents/channels
   - mirrors execution logs to timeline
   - surfaces stuck-task and failover events
4. Federation channels are the transport fabric:
   - channel membership gate + tenant scope gate enforced on every hop
   - terminal-bound work must include `twid` + target `agentIds`

## 3) Platform Split (Cloudflare + Railway + Supabase)

1. Cloudflare (edge control plane + serverless policy):
   - Worker APIs for gate evaluation, ingress normalization, receipt projection
   - Durable Objects for low-latency gate state and lock/lease coordination
   - Queues for async fan-out/retry of non-blocking tasks
   - R2 for immutable receipt artifacts and report snapshots
2. Railway (stateful runtime plane):
   - relay server, orchestrator workers, OpenClaw runtime/gateway services
   - long-running task executors and MCP-heavy workloads
3. Supabase (tenant data plane):
   - tenant/user/agent ownership model + RLS
   - schedule registry mirror + audit timeline persistence
   - auth/session identity and product workspace metadata

## 4) Cron Governance and Category Policy

1. `system_framework` scope:
   - editable only by `SUPER_ADMIN` or explicit delegated approval
2. `tenant` scope:
   - editable by tenant user/agent with ownership match
3. Category model to keep:
   - system: `system_framework`, `orchestration_gate`, `federation_sync`,
     `self_improvement_core`, `observability`, `system_terminal_awareness`
   - tenant: `tenant_automation`, `tenant_agent_loop`, `tenant_experiment`,
     `tenant_terminal_awareness`
4. Required gate chain for schedule mutation:
   - tenant scope, trace continuity, channel membership,
     scope/category/ownership, rate limit, approval

## 5) Logging, Handoff, and Self-Edit Hardening

1. Mandatory on all handoffs:
   - `cumulative_id` (MCID) populated and validated
   - `gate_decisions[]` attached before broker acceptance
2. Timeline mirroring:
   - allow/deny/quarantine events logged for cron + self-edit gates
   - schedule lineage fields (`schedule_id`, `schedule_run_id`) persisted
3. Self-improvement/self-prompting loop controls:
   - agents may edit only owned docs from
     `data/protocols/agent-owned-docs.registry.json`
   - `approval_required_paths` enforce manual approval before write
   - all self-edit actions require request schema + gate evaluator pass

## 6) 72-Hour Execution Plan

### Day 0 (Today): Protocol Lock + Launch Track

- [x] Freeze v1 packet contract for federation handoff
      (`MCID + gate_decisions + twid rules`)
- [x] Add one orchestration runbook page that maps Director/Orchestrator/Broker
      responsibilities
- [x] Confirm terminal visualizer endpoint and data refresh job are in deploy
      artifact
- [x] Create launch SKUs and template matrix (hosted OpenClaw wrappers + TNF
      premium orchestration)

### Day 1: Control Plane Wiring

- [x] Implement serverless gate API (Cloudflare Worker) for cron + self-edit +
      federation packet validation
- [x] Mirror handoff gate outcomes to unified audit timeline
      (`handoff_gate_evaluation`)
- [x] Wire broker intake with gate enforcement modes (`off|warn|enforce`) for
      gate-complete execution control
- [x] Add “federation health + gate outcomes” operator dashboard widgets

### Day 2: Provisioning + Multi-Tenant Packaging

- [ ] Build tenant workspace bootstrap endpoint (cloneable preconfigured agent
      packs)
- [ ] Add template presets: model stack, enabled MCPs, persona/skills profile,
      sandbox policy
- [ ] Add per-tenant schedule namespace defaults + safe baseline cron pack
- [ ] Add one-click “spawn managed instance” flow backed by Railway service
      template/env profile

### Day 3: Market-Ready Validation + Rollout

- [ ] Run production checklist across Cloudflare/Railway/Supabase integration
      points
- [ ] Validate failover drills: relay outage, worker failure, schedule gate
      deny, self-edit deny
- [ ] Publish operator docs and customer-facing setup docs
- [ ] Roll out limited design-partner cohort and monitor p95 latency +
      success/error mix

## 7) Agent Deployment Sequence (Execution Ownership)

1. Task: federation rollout program management  
   Primary: `orchestrator-agent`  
   Support: `task-agent-router`  
   Fit Score: 96
2. Task: master clock schedule governance and trigger contracts  
   Primary: `tnf-master-clock-sync`  
   Support: `tnf-execution-audit-trail`  
   Fit Score: 94
3. Task: production execution/log pipeline hardening  
   Primary: `tnf-task-production-pipeline`  
   Support: `tnf-execution-audit-trail`  
   Fit Score: 93
4. Task: protocol bridge/gate interoperability enforcement  
   Primary: `interoperability-protocol-agent`  
   Support: `inter-agentic-workflow-definer`  
   Fit Score: 91

## 8) Go/No-Go Gates (Must Pass Before Broad Launch)

1. Every execution packet entering broker validates `tnf-master-cumulative-id`
   and gate chain.
2. System/framework cron mutation is denied without super-admin or explicit
   delegation.
3. Tenant-owned cron mutation succeeds only with ownership + scope/category
   alignment.
4. Agent self-edit deny path writes timeline/audit record with full correlation
   lineage.
5. Visualizer reflects current TWIP macro board state within expected refresh
   cadence.
6. First 20 pilot runs complete with no unresolved quarantine packets.

## 9) Risks and Mitigations

1. Risk: Gate logic split between services causes inconsistent decisions.  
   Mitigation: centralize gate evaluation contract in one serverless API and
   reuse everywhere.
2. Risk: Fast GTM introduces policy gaps in tenant automation.  
   Mitigation: fail-closed defaults, explicit allowlists, and approval-required
   path policy.
3. Risk: Operational noise from frequent loops.  
   Mitigation: category-based cron quotas and rate limits by tenant and by
   schedule owner.

## 10) Progress Tracker

- [x] Terminal macro board + active terminal telemetry
- [x] Federation gate protocol docs and baseline schemas
- [x] Cron governance schema and category registry
- [x] Agent self-edit schema and ownership registry
- [x] Director/Orchestrator/Broker runbook and launch SKU matrix
- [x] Terminal visualizer readiness verification script + passing check
- [x] Cloudflare gate API endpoints implemented in worker code (pending
      deployment)
- [x] API handoff service wired for external federation gate mode
      (`off|warn|enforce`)
- [x] Broker agent wired for local + external federation gate checks
      (`off|warn|enforce`)
- [x] Cloudflare gate API live (`https://tnf-sharedstate.bizsynth.workers.dev`)
- [x] Terminal-awareness cron categories added (`system_terminal_awareness`,
      `tenant_terminal_awareness`)
- [x] Railway production services `api` + `relay-server` switched to external
      gate `warn` mode
- [x] Broker runtime switched to `BROKER_FEDERATION_GATE_MODE=enforce`
- [x] API runtime switched to `TNF_GATE_POLICY_MODE=enforce`
- [x] Post-enforce telemetry hardening: broker gate counters + synthetic
      federation gate probe
- [x] Admin dashboard federation-gate panel +
      `/api/admin/metrics/federation-gates`
- [ ] Tenant cloneable managed-instance provisioning
- [ ] Pilot cohort launch with production SLO dashboard
