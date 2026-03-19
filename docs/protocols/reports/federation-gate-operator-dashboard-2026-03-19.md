# Federation Gate Operator Dashboard Update

Date: 2026-03-19  
Status: Implemented

## Scope

Expose federated gate telemetry to operators through a single API endpoint and
the Super Admin dashboard.

## Backend

1. Added endpoint:
   - `GET /api/admin/metrics/federation-gates?hours=<1..168>&limit=<10..1000>`
2. Endpoint output includes:
   - `apiHandoff` summary from timeline events where:
     - `eventType=historical_event`
     - `actor=agent_handoff_service`
     - `payload.category=handoff_gate_evaluation`
   - `broker` counters from Redis hash:
     - default key `tnf:broker:federation-gate:metrics`
3. Module wiring:
   - `AdminModule` imports `UnifiedLedgerModule`
   - `CacheService` provided in `AdminModule` for broker counter reads

## Frontend

1. Updated Super Admin dashboard:
   - file: `apps/frontend/src/pages/Admin/ComprehensiveAdminDashboard.tsx`
2. Added "Federation Gate Health" panel:
   - allow/warn/deny counts from API handoff telemetry
   - top gate reason
3. Added "Broker Gate Counters" panel:
   - Redis availability status
   - aggregate allow/warn/deny counter values
   - TWIP context counters:
     - `twip_context_available:true|false`
     - `twip_context_stale:true|false`
     - `twip_context_risk:low|medium|high|critical`
     - high/critical combined total
4. Added alert rule:
   - warning/error banner when deny count is non-zero in selected window
5. Added alert rule:
   - warning/error banner when broker high/critical TWIP context risk counters
     are non-zero in selected window
6. Added alert rule:
   - warning/error banner when broker stale TWIP context counters are non-zero
     in selected window

## Validation

1. `pnpm --filter @the-new-fuse/api-server run type-check` ✅
2. `pnpm --filter @the-new-fuse/relay-core run type-check` ✅
3. `pnpm -C apps/frontend exec eslint src/pages/Admin/ComprehensiveAdminDashboard.tsx`
   ✅
4. `pnpm validate:federation-gate:synthetic` ✅
