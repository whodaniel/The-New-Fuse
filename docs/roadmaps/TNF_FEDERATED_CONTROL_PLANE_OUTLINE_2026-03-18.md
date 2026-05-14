# TNF Federated Control Plane Plan Outline

Date: 2026-03-18  
Status: Active execution outline  
Owner: TNF Local Director + Cloud Orchestrator

## 1. Purpose

Provide one trackable implementation outline to make TNF fully federated across:

1. local terminal awareness (`tnf-agent`, `tnf-cli-agent`, TWIP macro board),
2. federation channels (Chrome extension + relay),
3. network-wide orchestration gates (broker + policy API),
4. cloud runtime planes (Cloudflare, CloudRuntime, Supabase),
5. master cumulative ID lineage (MCID) across handoff, scheduling, and logs.

## 2. Fresh Context Snapshot

From `scripts/protocols/twip-macro-board.cjs` at `2026-03-18T22:52:59.905Z`:

1. Total terminals: 23
2. Active terminals: 5
3. Idle terminals: 18
4. Active deltas vs previous run: unchanged

Sanitized active work mix:

1. Codex + Exa-MCP sessions on multiple terminals
2. Gemini + `mcp-remote` observability session
3. Kilo session for parallel terminal tooling work

Web visualizer smoke check:

1. `https://thenewfuse.com/visualizations/terminals` returned HTTP `200` during
   this update cycle.

## 3. Current Runtime Path (Verified)

1. Chrome extension content/background scripts route channel messages and AI
   replies.
   - `apps/chrome-extension/src/v5/content/index.ts`
   - `apps/chrome-extension/src/v5/background/index.ts`
2. Extension relay endpoint defaults to local WebSocket relay.
   - `ws://localhost:3001/ws`
3. Relay + broker + master clock route work packets and runtime signals.
   - `packages/relay-core/src/standalone-relay.ts`
   - `packages/relay-core/src/broker-agent.ts`
   - `packages/relay-core/src/master-clock.ts`
4. API handoff publish path performs packet validation and optional external
   gate checks.
   - `apps/api/src/services/agent-handoff.service.ts`
5. Cloudflare shared-state worker now exposes policy endpoints.
   - `https://tnf-sharedstate.bizsynth.workers.dev/gates/*`

## 4. Control Objectives

1. Every broker-dispatched packet must carry valid MCID + gate decisions.
2. Every federation hop must pass a complete required gate chain.
3. System/framework cron writes remain super-admin controlled by policy.
4. Tenant cron writes remain owner-scoped and category-scoped.
5. Agent self-edits remain owner/path bounded with explicit approval for
   protected paths.
6. Terminal-awareness polling is formalized as governed cron categories.

## 5. Architecture Split (Cloud + Edge + Stateful)

1. Cloudflare (serverless control plane):
   - gate evaluation APIs (`/gates/federation/evaluate`, `/gates/cron/evaluate`,
     `/gates/self-edit/evaluate`)
   - policy evaluation at low latency near ingress points
2. CloudRuntime (stateful runtime plane):
   - relay, broker, orchestrator, long-running agent services
   - MCP-heavy and continuous execution workloads
3. Supabase (tenant data and governance plane):
   - tenant ownership, RLS policy model, audit/event persistence
   - schedule registry mirror and lineage query surfaces

## 6. Governance Extensions Added

1. Cron categories now include terminal-awareness classes:
   - `system_terminal_awareness`
   - `tenant_terminal_awareness`
2. Registry includes baseline reminder jobs:
   - `tnf-terminal-awareness-reminder`
   - `tenant-terminal-awareness-default`
3. MCID scheduler lineage fields are in schema:
   - `scope.cron_namespace`
   - `lineage.schedule_id`
   - `lineage.schedule_run_id`

## 7. Execution Tracks

### Track A: Federation Gate Enforcement

- [x] Broker supports `BROKER_FEDERATION_GATE_MODE=off|warn|enforce`
- [x] API handoff supports `TNF_GATE_POLICY_MODE=off|warn|enforce`
- [x] Cloudflare policy API endpoints deployed
- [x] Set broker/runtime envs to `warn` in production and collect deny telemetry
- [x] Promote broker/runtime envs to `enforce` after telemetry stabilization
- [x] Broker federation gates consume TWIP terminal context risk signals by
      `twid`

### Track B: Handoff + Logging Integrity

- [x] MCID + gate chain contracts documented and partially enforced in runtime
      paths
- [x] Mirror handoff gate outcomes into timeline events
      (`handoff_gate_evaluation`)
- [ ] Add denial reason dashboards by gate and category
- [ ] Add replay-safe handoff/audit correlation checks in CI

### Track C: Master Clock and Cron Governance

- [x] Scope/category schema and gate evaluator implemented
- [x] Super-admin restriction model documented and enforceable
- [x] Terminal-awareness cron categories added
- [ ] Route all cron mutation entry points through one policy API facade
- [ ] Add per-category rate limits and quota alerts

### Track D: Self-Improvement and Self-Edit Loops

- [x] Self-edit schema, bridge, and gate evaluator in place
- [x] Ownership registry implemented
- [ ] Expand owner profile packs for managed tenant clones
- [ ] Add strict telemetry counters for approve/deny/self-edit write attempts

### Track E: GTM Packaging (Days, Not Weeks)

- [x] Hosted/federated offer matrix drafted
- [ ] Template bundles for cloneable managed agents (persona + skills + MCP
      presets)
- [ ] One-click tenant bootstrap with safe defaults
- [ ] Design-partner launch with enforced policy and observability SLOs

## 8. Immediate Next Moves (Next 24 Hours)

1. Observe deny/quarantine telemetry under `enforce` mode and tune
   false-positive thresholds.
2. Publish operator dashboard cards for:
   - gate allow/deny/quarantine counts,
   - terminal-awareness cron job freshness,
   - MCID continuity failures.
3. Add deployment checklist for the visualizer route
   (`/visualizations/terminals`) with post-deploy smoke test.
4. Start template bootstrap contract for managed tenant clones (Cloudflare
   ingress + CloudRuntime runtime + Supabase tenant seed).

## 9. Done Definition

1. Gate chain enforcement is `enforce` in broker and API for all production
   handoffs.
2. Cron and self-edit mutations are policy-evaluated by one gate API contract.
3. Terminal-awareness reminders are active and visible in governance registry +
   dashboard.
4. MCID lineage is queryable end-to-end for handoff, schedule, and execution
   logs.
5. Managed tenant provisioning can spin up a policy-safe federated instance from
   template in one flow.

## 10. Progress Update (2026-03-19)

1. TWIP scans now capture sanitized terminal content context (tmux + macOS
   Terminal fallback).
2. Broker federation gates now ingest TWIP context signal data and enrich:
   - local gate decisions,
   - external policy payloads,
   - telemetry counters/events.
3. Bridge condition updated: `HIGH_RISK_RUNTIME_GATE` includes
   `twip_context_risk>=high`.
4. Latest macro board snapshot (`2026-03-19T00:45:54.106Z`) reports:
   - total terminals: `24`
   - active terminals: `6`
   - active with context visibility: `6`
5. Broker federation gate now emits TWIP context freshness telemetry and can
   enforce:
   - `BROKER_MAX_TWIP_CONTEXT_AGE_MS` stale threshold
   - `BROKER_REQUIRE_TWIP_CONTEXT_FOR_TERMINAL_BOUND=true` for strict
     terminal-bound context requirements
