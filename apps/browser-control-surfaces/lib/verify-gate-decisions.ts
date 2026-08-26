/**
 * verify-gate-decisions.ts
 *
 * `useTnfAuthorization.ts` and `useTerminalHeartbeat.ts` both import a
 * gate-decision verifier from this path; the file did not exist anywhere in
 * the monorepo (confirmed by search — `verifyTnfGateDecisions` had exactly
 * one reference: its own would-be caller). This was a genuine missing
 * module, not a wrong import path.
 *
 * This is NOT a fabricated "always allow" stub — that exact failure mode
 * (a gate check silently returning a mocked allow) is a known, documented
 * TNF anti-pattern elsewhere in this codebase. Instead this file adapts the
 * package's own already-implemented gate engine
 * (`./harness-protocol.ts#verifyGateDecision`, which has real logic for
 * TENANT_SCOPE_GATE / TRACE_CONTINUITY_GATE / CHANNEL_MEMBERSHIP_GATE and
 * fails closed — `allowed: false` — for anything else, including the
 * SECURITY_GATE this package's callers actually invoke) to the different
 * parameter shape `useTnfAuthorization.ts` calls it with.
 *
 * Net effect: gate checks made through this function are real (backed by
 * verifyGateDecision's actual logic), but SECURITY_GATE specifically still
 * resolves to `allowed: false` until verifyGateDecision grows a real case
 * for it — which is the honest, fail-closed behavior, not a regression
 * introduced here.
 */
import { verifyGateDecision, type TnfGateDecision } from './harness-protocol';

export interface GateVerificationRequest {
  gate: string;
  tenantScope: string;
  channelMembership?: string;
  agentId?: string;
}

export async function verifyTnfGateDecisions(
  request: GateVerificationRequest
): Promise<TnfGateDecision> {
  return verifyGateDecision(request.gate, {
    tenantId: request.tenantScope,
    agentId: request.agentId ?? 'browser-control-surface',
    operationId: request.gate,
    channelId: request.channelMembership,
  });
}
