import { randomUUID } from 'crypto';

const FEDERATED_BASE58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeBase58(num: number): string {
  if (!Number.isFinite(num) || num <= 0) return FEDERATED_BASE58_ALPHABET[0];
  let remaining = Math.trunc(num);
  let encoded = '';
  while (remaining > 0) {
    encoded = FEDERATED_BASE58_ALPHABET[remaining % 58] + encoded;
    remaining = Math.floor(remaining / 58);
  }
  return encoded;
}

export function deterministicIdNumber(agentId: string): string {
  let h = 0x811c9dc5;
  // PROVISIONAL only — Phase 9 assigns real idNumbers sequentially via Redis
  // (FederatedIdentityService). Must match federation-identity.ts and
  // federation-protocol.cjs exactly. Widened from 10,000 values on 2026-08-09
  // after two live collisions in the 194-agent roster.
  const PROVISIONAL_ID_FLOOR = 1_000_000_000;
  const PROVISIONAL_ID_SPACE = 1_000_000_000;
  const id = String(agentId || 'agent');
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return `ID#:${encodeBase58(PROVISIONAL_ID_FLOOR + (h % PROVISIONAL_ID_SPACE))}`;
}

export function buildChannelBrokerRecoveryIdentity(channelId: string): {
  operationalHandle: string;
  canonicalEntityId: string;
  idNumber: string;
  daccRole: 'broker';
} {
  const channelKey = String(channelId || 'Green').trim();
  const normalized = channelKey.toUpperCase().replace(/\s+/g, '_');
  const handle = `BROKER-${channelKey.charAt(0).toUpperCase()}${channelKey.slice(1).toLowerCase()}`;

  return {
    operationalHandle: handle,
    canonicalEntityId: `TNF:LOCAL:AGENT:TNF:BROKER_${normalized}:001`,
    idNumber: deterministicIdNumber(handle),
    daccRole: 'broker',
  };
}

export interface StallRecoveryFrameInput {
  channelId: string;
  relaySessionId: string;
  conversationId?: string | null;
  attemptNumber: number;
  maxAttempts?: number;
  idleTimeMs: number;
  messageCount: number;
  participants?: string[];
  priorCorrelationId?: string | null;
  priorMcidId?: string | null;
}

function shortUuid(id: string | null | undefined): string {
  if (!id || typeof id !== 'string') return 'none';
  const trimmed = id.trim();
  if (trimmed.length <= 8) return trimmed;
  return `${trimmed.slice(0, 8)}…`;
}

function shortAgentId(agentId: string): string {
  if (agentId.length <= 18) return agentId;
  return `${agentId.slice(0, 10)}…${agentId.slice(-4)}`;
}

function formatIdleDuration(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder > 0 ? `${minutes}m${remainder}s` : `${minutes}m`;
}

function inferParticipantLabel(agentId: string): string {
  const lower = agentId.toLowerCase();
  if (lower.includes('glm') || lower.includes('z.ai') || lower.includes('zai')) return '@GLM';
  if (lower.includes('gemini')) return '@Gemini';
  if (lower.includes('chatgpt') || lower.includes('openai') || lower.includes('gpt')) {
    return '@GPT';
  }
  if (lower.includes('claude')) return '@Claude';
  if (lower.includes('browser')) return '@Browser';
  if (lower.includes('page-agent')) {
    const suffix = agentId.split('-').pop()?.slice(0, 4) || agentId.slice(-4);
    return `page-${suffix}`;
  }
  return agentId.length > 20 ? `${agentId.slice(0, 18)}…` : agentId;
}

function formatParticipants(participants: string[] | undefined): string {
  if (!participants?.length) return 'unknown';
  const labels = participants.map(
    (id) => `${inferParticipantLabel(id)}(${shortAgentId(id)})`
  );
  if (labels.length <= 4) return labels.join(', ');
  return `${labels.slice(0, 4).join(', ')} +${labels.length - 4} more`;
}

function recoveryActionForAttempt(
  attempt: number,
  maxAttempts: number,
  participants: string[]
): string {
  const roster =
    participants.length > 0
      ? participants.map(inferParticipantLabel).join(', ')
      : 'all channel agents';

  if (attempt >= maxAttempts) {
    return `Final recovery (${attempt}/${maxAttempts}): ${roster} — respond with the next federation step, ack with platform + ID#, or reply COMPLETE to end monitoring.`;
  }
  if (attempt === 1) {
    return `Stall detected — ${roster}: continue the active federation thread; reply with platform + ID# acknowledgment.`;
  }
  return `Escalation (${attempt}/${maxAttempts}): ${roster} still idle — state your next action or reply COMPLETE if the task is done.`;
}

export function buildStallRecoveryFederationMetadata(input: {
  channelId: string;
  relaySessionId: string;
  conversationId?: string | null;
  attemptNumber?: number;
  priorCorrelationId?: string | null;
  priorMcidId?: string | null;
}): Record<string, unknown> {
  const issuedAt = new Date().toISOString();
  const broker = buildChannelBrokerRecoveryIdentity(input.channelId);
  const correlationId = randomUUID();
  const causationId =
    input.priorMcidId ||
    (typeof input.priorCorrelationId === 'string' && input.priorCorrelationId.includes('-')
      ? input.priorCorrelationId
      : null) ||
    (typeof input.conversationId === 'string' && input.conversationId.includes('-')
      ? input.conversationId
      : null);

  const mcid = {
    spec: 'tnf/mcid/0.1',
    id: randomUUID(),
    scope: {
      tenant_id: process.env.TENANT_ID || 'tnf-local',
      session_key: input.relaySessionId,
      workflow_id: null,
      channel_id: input.channelId,
    },
    lineage: {
      trace_id: null,
      correlation_id: correlationId,
      causation_id: causationId,
      handoff_packet_id: null,
      twid: null,
      task_id: input.conversationId || null,
    },
    federation: {
      domain: process.env.TENANT_ID || 'tnf-local',
      route: ['standalone-relay', 'stall-detector', 'recovery'],
      hop_count: 1,
      gate_decisions: [
        { gate: 'STALL_RECOVERY_GATE', decision: 'allow', at: issuedAt },
        { gate: 'CHANNEL_MEMBERSHIP_GATE', decision: 'allow', at: issuedAt },
      ],
    },
    issued_at: issuedAt,
  };

  return {
    operationalHandle: broker.operationalHandle,
    runtimeSessionId: input.relaySessionId,
    canonicalEntityId: broker.canonicalEntityId,
    idNumber: broker.idNumber,
    daccRole: broker.daccRole,
    correlationId,
    mcid,
    federation: {
      canonicalEntityId: broker.canonicalEntityId,
      idNumber: broker.idNumber,
      mcid,
    },
    recoveryAttempt: input.attemptNumber ?? null,
    conversationId: input.conversationId ?? null,
    bridgedBy: broker.operationalHandle,
    eventType: 'stall_recovery',
  };
}

export function buildStallRecoveryContent(
  input: StallRecoveryFrameInput,
  metadata: Record<string, unknown>
): string {
  const maxAttempts = input.maxAttempts ?? 3;
  const attempt = Math.max(1, input.attemptNumber);
  const participants = input.participants ?? [];
  const brokerHandle = String(metadata.operationalHandle || 'BROKER');
  const idNumber = String(metadata.idNumber || 'ID#:???');
  const mcid =
    typeof metadata.mcid === 'object' && metadata.mcid
      ? (metadata.mcid as Record<string, unknown>)
      : null;
  const lineage =
    mcid && typeof mcid.lineage === 'object' && mcid.lineage
      ? (mcid.lineage as Record<string, unknown>)
      : {};

  const lines = [
    `[TNF:STALL_RECOVERY] channel=${input.channelId} attempt=${attempt}/${maxAttempts} idle=${formatIdleDuration(input.idleTimeMs)} msgs=${input.messageCount}`,
    `from=${brokerHandle} ${idNumber} dacc=broker entity=${String(metadata.canonicalEntityId || 'unknown')}`,
    `participants: ${formatParticipants(participants)}`,
    `lineage: mcid=${shortUuid(typeof mcid?.id === 'string' ? mcid.id : null)} corr=${shortUuid(typeof lineage.correlation_id === 'string' ? lineage.correlation_id : null)} caus=${shortUuid(typeof lineage.causation_id === 'string' ? lineage.causation_id : null)} task=${shortUuid(input.conversationId)}`,
    `action: ${recoveryActionForAttempt(attempt, maxAttempts, participants)}`,
    'gates: STALL_RECOVERY_GATE=allow CHANNEL_MEMBERSHIP_GATE=allow',
  ];

  return lines.join('\n');
}

export function buildStallRecoveryFrame(input: StallRecoveryFrameInput): {
  content: string;
  metadata: Record<string, unknown>;
} {
  const metadata = buildStallRecoveryFederationMetadata({
    channelId: input.channelId,
    relaySessionId: input.relaySessionId,
    conversationId: input.conversationId,
    attemptNumber: input.attemptNumber,
    priorCorrelationId: input.priorCorrelationId,
    priorMcidId: input.priorMcidId,
  });

  const content = buildStallRecoveryContent(input, metadata);

  return {
    content,
    metadata: {
      ...metadata,
      attemptNumber: input.attemptNumber,
      maxAttempts: input.maxAttempts ?? 3,
      idleTimeMs: input.idleTimeMs,
      messageCount: input.messageCount,
      participants: input.participants ?? [],
    },
  };
}
