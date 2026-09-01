import { randomUUID } from 'crypto';

export interface TnfMessageEnvelope {
  id: string;
  type: string;
  source: string;
  timestamp: number;
  payload: any;
  correlationId?: string;
  causationId?: string;
  replyTo?: string;
  tenantId?: string;
  channelId?: string;
}

export interface TnfGateDecision {
  gate: 'TENANT_SCOPE_GATE' | 'TRACE_CONTINUITY_GATE' | 'CHANNEL_MEMBERSHIP_GATE' | 'PERMISSION_GATE' | 'SECURITY_GATE';
  allowed: boolean;
  reason?: string;
  evidence?: any;
  timestamp: number;
  agentId?: string;
}

export function createMessageEnvelope(params: {
  type: string;
  source: string;
  payload: any;
  correlationId?: string;
  causationId?: string;
  replyTo?: string;
  tenantId?: string;
  channelId?: string;
}): TnfMessageEnvelope {
  return {
    id: randomUUID(),
    type: params.type,
    source: params.source,
    timestamp: Date.now(),
    payload: params.payload,
    correlationId: params.correlationId,
    causationId: params.causationId,
    replyTo: params.replyTo,
    tenantId: params.tenantId,
    channelId: params.channelId
  };
}

export async function verifyGateDecision(gate: string, context: {
  tenantId: string;
  agentId: string;
  operationId: string;
  channelId?: string;
}): Promise<TnfGateDecision> {
  switch (gate) {
    case 'TENANT_SCOPE_GATE':
      return {
        gate: 'TENANT_SCOPE_GATE',
        allowed: !!context.tenantId,
        reason: context.tenantId ? 'Within tenant scope' : 'Missing tenant ID',
        timestamp: Date.now(),
        agentId: context.agentId
      };
    
    case 'TRACE_CONTINUITY_GATE':
      return {
        gate: 'TRACE_CONTINUITY_GATE',
        allowed: !!context.operationId,
        reason: context.operationId ? 'Trace continuity maintained' : 'Missing operation ID',
        timestamp: Date.now(),
        agentId: context.agentId
      };
    
    case 'CHANNEL_MEMBERSHIP_GATE':
      return {
        gate: 'CHANNEL_MEMBERSHIP_GATE',
        allowed: !!context.channelId,
        reason: context.channelId ? 'Channel membership verified' : 'Missing channel ID',
        timestamp: Date.now(),
        agentId: context.agentId
      };
    
    default:
      return {
        gate: gate as any,
        allowed: false,
        reason: `Unknown gate: ${gate}`,
        timestamp: Date.now(),
        agentId: context.agentId
      };
  }
}

export function withCorrelation(chain: string[]): { correlationId: string; causationId: string | undefined } {
  return {
    correlationId: chain[chain.length - 1],
    causationId: chain.length > 1 ? chain[chain.length - 2] : undefined
  };
}

export function buildTrace(correlationId: string, causationId?: string): TnfMessageEnvelope {
  return createMessageEnvelope({
    type: 'TRACE',
    source: 'tnf-harness',
    payload: { correlationId, causationId },
    correlationId,
    causationId
  });
}