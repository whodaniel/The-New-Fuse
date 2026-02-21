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

import { z } from 'zod';

import { ResourceStrategy } from './resource-protocol';

/**
 * Message Types
 */
export const MessageType = z.enum([
  'command', // Direct action request
  'event', // Fire-and-forget notification
  'task', // Requires ACK/result
  'state-sync', // State synchronization
  'query', // Information request
  'response', // Response to query/task
  'resource-negotiate', // Resource/Quota management
  'auction', // Broadcast for task bidding
  'bid', // Agent bid for a task
  'award', // Selection of an agent for a task
]);

export type MessageType = z.infer<typeof MessageType>;

/**
 * Agent Identity
 */
export const AgentIdentity = z.object({
  agentId: z.string().describe('Unique agent identifier'),
  role: z.enum(['orchestrator', 'worker', 'coordinator', 'observer']).optional(),
  platform: z.string().optional().describe('Platform (e.g., "gemini", "claude", "terminal")'),
  capabilities: z.array(z.string()).optional().describe('Agent capabilities'),
});

export type AgentIdentity = z.infer<typeof AgentIdentity>;

/**
 * Message Context
 */
export const MessageContext = z.object({
  workflowId: z.string().optional().describe('Parent workflow ID'),
  stepId: z.string().optional().describe('Workflow step ID'),
  sessionId: z.string().optional().describe('Conversation session ID'),
  channelId: z.string().optional().describe('Relay channel ID'),
  sequenceId: z.number().optional().describe('Message sequence number for ordering'),
  parentMessageId: z.string().optional().describe('ID of message this is responding to'),
});

export type MessageContext = z.infer<typeof MessageContext>;

/**
 * TNF Envelope - Unified Message Format
 */
export const TNFEnvelope = z.object({
  // Core metadata
  id: z.string().uuid().describe('Unique message ID'),
  version: z.string().default('1.0').describe('Protocol version'),
  traceId: z.string().uuid().describe('Correlation ID for debugging/tracing'),
  timestamp: z.string().datetime().describe('ISO-8601 timestamp'),

  // Message classification
  type: MessageType,

  // Routing
  from: AgentIdentity,
  to: AgentIdentity.or(z.object({ broadcast: z.boolean() })),

  // Content
  payload: z.record(z.string(), z.unknown()).describe('Message-specific data'),

  // Context
  context: MessageContext.optional(),

  // Resource Control (NEW PRIMITIVE)
  resource: ResourceStrategy.optional().describe(
    'Strategic resource/account handling instructions'
  ),

  // Metadata
  metadata: z.record(z.string(), z.unknown()).optional().describe('Additional metadata'),
});

export type TNFEnvelope = z.infer<typeof TNFEnvelope>;

/**
 * Specific Message Payloads
 */

// Task payload
export const TaskPayload = z.object({
  action: z.string().describe('Action to perform'),
  parameters: z.record(z.string(), z.unknown()).optional(),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
});

export type TaskPayload = z.infer<typeof TaskPayload>;

// Event payload
export const EventPayload = z.object({
  eventType: z.string().describe('Type of event'),
  data: z.record(z.string(), z.unknown()).optional(),
  source: z.string().optional().describe('Event source'),
});

export type EventPayload = z.infer<typeof EventPayload>;

// State sync payload
export const StateSyncPayload = z.object({
  stateKey: z.string().describe('Redis key for state'),
  stateValue: z.unknown(),
  version: z.number().describe('State version for optimistic locking'),
  operation: z.enum(['set', 'update', 'delete', 'get']),
});

export type StateSyncPayload = z.infer<typeof StateSyncPayload>;

// Response payload
export const ResponsePayload = z.object({
  success: z.boolean(),
  result: z.unknown().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    })
    .optional(),
});

export type ResponsePayload = z.infer<typeof ResponsePayload>;

// Auction payload
export const AuctionPayload = z.object({
  taskId: z.string().describe('ID of the task up for auction'),
  taskType: z.string().describe('Type of task (e.g. "code-generation")'),
  requirements: z.array(z.string()).describe('Required capabilities'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  expiresAt: z.number().describe('Timestamp when the auction ends'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AuctionPayload = z.infer<typeof AuctionPayload>;

// Bid payload
export const BidPayload = z.object({
  taskId: z.string().describe('ID of the task being bid on'),
  suitability: z.number().min(0).max(1).describe('Score from 0-1 on how well the agent fits'),
  estimatedDuration: z.number().optional().describe('Estimated time to complete in ms'),
  status: z.string().optional().describe('Current agent status/load info'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type BidPayload = z.infer<typeof BidPayload>;

/**
 * Helper Functions
 */

export function createTNFEnvelope(
  type: MessageType,
  from: AgentIdentity,
  to: AgentIdentity | { broadcast: boolean },
  payload: Record<string, unknown>,
  context?: MessageContext
): TNFEnvelope {
  return {
    id: crypto.randomUUID(),
    version: '1.0',
    traceId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    from,
    to,
    payload,
    context,
  };
}

export function validateTNFEnvelope(data: unknown): TNFEnvelope {
  return TNFEnvelope.parse(data);
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
    return TNFEnvelope.parse(this.envelope);
  }
}
