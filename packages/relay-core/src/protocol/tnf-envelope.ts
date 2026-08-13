/**
 * TNF Unified Message Protocol
 * Based on Gemini's architectural recommendations
 *
 * This protocol works across:
 * - WebSocket Relay
 * - Redis Pub/Sub
 * - Orchestrator task delegation
 * - Workflow execution
 */

import crypto from 'crypto';

import {
  AgentIdentitySchema,
  AuctionPayloadSchema,
  BidPayloadSchema,
  EventPayloadSchema,
  MessageContextSchema,
  MessageTypeSchema,
  ResponsePayloadSchema,
  StateSyncPayloadSchema,
  TaskPayloadSchema,
  TNFEnvelopeSchema,
  type AgentIdentity as AgentIdentityType,
  type AuctionPayload as AuctionPayloadType,
  type BidPayload as BidPayloadType,
  type EventPayload as EventPayloadType,
  type MessageContext as MessageContextType,
  type MessageType as MessageTypeType,
  type ResponsePayload as ResponsePayloadType,
  type StateSyncPayload as StateSyncPayloadType,
  type TaskPayload as TaskPayloadType,
  type TNFEnvelope as TNFEnvelopeType,
} from '@the-new-fuse/protocol-contracts';

import {
  attachAuditTrace,
  createAuditTrace,
  extractAuditTrace,
  mergeAuditTrace,
  type TnfAuditTrace,
} from '../contracts/audit.js';
import { createAgentIdentityRecord } from '../contracts/identity.js';
import { assertNativeEnvelopeValid } from './native-envelope-validator.js';

// Re-export values and types with unified names for back-compat
export const MessageType = MessageTypeSchema;
export type MessageType = MessageTypeType;

export const AgentIdentity = AgentIdentitySchema;
export type AgentIdentity = AgentIdentityType;

export const MessageContext = MessageContextSchema;
export type MessageContext = MessageContextType;

export const TNFEnvelope = TNFEnvelopeSchema;
export type TNFEnvelope = TNFEnvelopeType;

export const TaskPayload = TaskPayloadSchema;
export type TaskPayload = TaskPayloadType;

export const EventPayload = EventPayloadSchema;
export type EventPayload = EventPayloadType;

export const StateSyncPayload = StateSyncPayloadSchema;
export type StateSyncPayload = StateSyncPayloadType;

export const ResponsePayload = ResponsePayloadSchema;
export type ResponsePayload = ResponsePayloadType;

export const AuctionPayload = AuctionPayloadSchema;
export type AuctionPayload = AuctionPayloadType;

export const BidPayload = BidPayloadSchema;
export type BidPayload = BidPayloadType;

export interface CreateTNFEnvelopeOptions {
  metadata?: Record<string, unknown>;
  traceId?: string;
  audit?: Partial<TnfAuditTrace>;
}

export interface ValidateTNFEnvelopeOptions {
  native?: boolean;
  requireNative?: boolean;
}

/**
 * Helper Functions
 */

function normalizeAgentIdentity(identity: AgentIdentity): AgentIdentity {
  const aliases = Array.isArray(identity.aliases) ? identity.aliases : [];

  try {
    const record = createAgentIdentityRecord({
      canonicalEntityId: identity.canonicalEntityId,
      operationalHandle: identity.operationalHandle || identity.agentId,
      runtimeSessionId: identity.runtimeSessionId || identity.agentId,
      aliases: [...aliases, identity.agentId],
    });

    return {
      ...identity,
      canonicalEntityId: record.canonicalEntityId || undefined,
      operationalHandle: record.operationalHandle,
      runtimeSessionId: record.runtimeSessionId || undefined,
      aliases: record.aliases,
    };
  } catch {
    return {
      ...identity,
      aliases: [
        ...new Set([identity.agentId, ...aliases].map((alias) => alias.trim()).filter(Boolean)),
      ],
    };
  }
}

function normalizeRecipient(
  recipient: AgentIdentity | { broadcast: boolean }
): AgentIdentity | { broadcast: boolean } {
  if ('broadcast' in recipient) {
    return recipient;
  }

  return normalizeAgentIdentity(recipient);
}

function resolveEnvelopeAuditTrace(
  traceId: string,
  from: AgentIdentity,
  context?: MessageContext,
  metadata?: Record<string, unknown>,
  auditOverrides?: Partial<TnfAuditTrace>
): TnfAuditTrace {
  const actor = auditOverrides?.actor || from.operationalHandle || from.agentId;
  const source = auditOverrides?.source || from.platform || 'relay-core';
  const existing = extractAuditTrace(metadata?.audit);

  return (
    mergeAuditTrace(existing, auditOverrides, {
      traceId,
      source,
      actor,
      workflowId: context?.workflowId,
      channelId: context?.channelId,
      sessionId: context?.sessionId,
      parentId: context?.parentMessageId,
      canonicalEntityId: from.canonicalEntityId,
      operationalHandle: from.operationalHandle || from.agentId,
      runtimeSessionId: from.runtimeSessionId,
    }) ||
    createAuditTrace({
      traceId,
      source,
      actor,
      workflowId: context?.workflowId,
      channelId: context?.channelId,
      sessionId: context?.sessionId,
      parentId: context?.parentMessageId,
      canonicalEntityId: from.canonicalEntityId,
      operationalHandle: from.operationalHandle || from.agentId,
      runtimeSessionId: from.runtimeSessionId,
    })
  );
}

export function getTNFEnvelopeAuditTrace(
  envelope: Pick<TNFEnvelope, 'traceId' | 'from' | 'context' | 'metadata'>
) {
  return resolveEnvelopeAuditTrace(
    envelope.traceId,
    normalizeAgentIdentity(envelope.from),
    envelope.context,
    envelope.metadata
  );
}

export function normalizeTNFEnvelope(envelope: TNFEnvelope): TNFEnvelope {
  const from = normalizeAgentIdentity(envelope.from);
  const to = normalizeRecipient(envelope.to);
  const metadata = attachAuditTrace(
    envelope.metadata,
    getTNFEnvelopeAuditTrace({
      traceId: envelope.traceId,
      from,
      context: envelope.context,
      metadata: envelope.metadata,
    })
  );

  return TNFEnvelopeSchema.parse({
    ...envelope,
    from,
    to,
    metadata,
  });
}

export function createTNFEnvelope(
  type: MessageType,
  from: AgentIdentity,
  to: AgentIdentity | { broadcast: boolean },
  payload: Record<string, unknown>,
  context?: MessageContext,
  options?: CreateTNFEnvelopeOptions
): TNFEnvelope {
  const normalizedFrom = normalizeAgentIdentity(from);
  const normalizedTo = normalizeRecipient(to);
  const traceId =
    options?.traceId ||
    options?.audit?.traceId ||
    extractAuditTrace(options?.metadata?.audit)?.traceId ||
    crypto.randomUUID();

  return {
    id: crypto.randomUUID(),
    version: '1.0',
    traceId,
    timestamp: new Date().toISOString(),
    type,
    from: normalizedFrom,
    to: normalizedTo,
    payload,
    context,
    metadata: attachAuditTrace(
      options?.metadata,
      resolveEnvelopeAuditTrace(traceId, normalizedFrom, context, options?.metadata, options?.audit)
    ),
  };
}

export function validateTNFEnvelope(
  data: unknown,
  options: ValidateTNFEnvelopeOptions = {}
): TNFEnvelope {
  const envelope = normalizeTNFEnvelope(TNFEnvelopeSchema.parse(data));
  if (options.native !== false) {
    assertNativeEnvelopeValid(envelope, { required: options.requireNative });
  }
  return envelope;
}

export function isTaskMessage(envelope: TNFEnvelope): boolean {
  return envelope.type === 'task';
}

export function isEventMessage(envelope: TNFEnvelope): boolean {
  return envelope.type === 'event';
}

export function requiresResponse(envelope: TNFEnvelope): boolean {
  return envelope.type === 'task' || envelope.type === 'query';
}

/**
 * Message Builder
 */
export class TNFMessageBuilder {
  private envelope: Partial<TNFEnvelope> = {
    version: '1.0',
    id: crypto.randomUUID(),
    traceId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  type(type: MessageType): this {
    this.envelope.type = type;
    return this;
  }

  from(from: AgentIdentity): this {
    this.envelope.from = from;
    return this;
  }

  to(to: AgentIdentity | { broadcast: boolean }): this {
    this.envelope.to = to;
    return this;
  }

  payload(payload: Record<string, unknown>): this {
    this.envelope.payload = payload;
    return this;
  }

  context(context: MessageContext): this {
    this.envelope.context = context;
    return this;
  }

  metadata(metadata: Record<string, unknown>): this {
    this.envelope.metadata = metadata;
    return this;
  }

  traceId(traceId: string): this {
    this.envelope.traceId = traceId;
    return this;
  }

  build(): TNFEnvelope {
    return validateTNFEnvelope(this.envelope);
  }
}
