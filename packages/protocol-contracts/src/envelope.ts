import { z } from 'zod';

import { ResourceStrategySchema } from './resource.js';

/**
 * Message Types
 */
export const MessageTypeSchema = z.enum([
  'command', // Direct action request
  'event', // Fire-and-forget notification
  'task', // Requires ACK/result
  'handoff', // Targeted prompt/state transfer between agents
  'handoff-ack', // Acknowledgement for a handoff packet
  'state-sync', // State synchronization
  'query', // Information request
  'response', // Response to query/task
  'resource-negotiate', // Resource/Quota management
  'auction', // Broadcast for task bidding
  'bid', // Agent bid for a task
  'award', // Selection of an agent for a task
]);

export type MessageType = z.infer<typeof MessageTypeSchema>;

/**
 * Agent Identity
 */
export const AgentIdentitySchema = z
  .object({
    agentId: z.string().describe('Unique agent identifier'),
    canonicalEntityId: z.string().optional().describe('Canonical TNF identity for this agent'),
    operationalHandle: z.string().optional().describe('Operational routing handle for this agent'),
    runtimeSessionId: z.string().optional().describe('Runtime session identifier for this agent'),
    aliases: z.array(z.string()).optional().describe('Known aliases for this agent'),
    role: z.enum(['orchestrator', 'worker', 'coordinator', 'observer']).optional(),
    platform: z.string().optional().describe('Platform (e.g., "gemini", "claude", "terminal")'),
    capabilities: z.array(z.string()).optional().describe('Agent capabilities'),
  })
  .strict();

export type AgentIdentity = z.infer<typeof AgentIdentitySchema>;

/**
 * Message Context
 */
export const MessageContextSchema = z
  .object({
    workflowId: z.string().optional().describe('Parent workflow ID'),
    stepId: z.string().optional().describe('Workflow step ID'),
    sessionId: z.string().optional().describe('Conversation session ID'),
    channelId: z.string().optional().describe('Relay channel ID'),
    sequenceId: z.number().optional().describe('Message sequence number for ordering'),
    parentMessageId: z.string().optional().describe('ID of message this is responding to'),
  })
  .strict();

export type MessageContext = z.infer<typeof MessageContextSchema>;

/**
 * TNF Envelope - Unified Message Format
 */
export const TNFEnvelopeSchema = z
  .object({
    // Core metadata
    id: z.string().uuid().describe('Unique message ID'),
    version: z.string().default('1.0').describe('Protocol version'),
    traceId: z.string().min(1).describe('Correlation ID for debugging/tracing'),
    timestamp: z.string().datetime().describe('ISO-8601 timestamp'),

    // Message classification
    type: MessageTypeSchema,

    // Routing
    from: AgentIdentitySchema,
    to: AgentIdentitySchema.or(z.object({ broadcast: z.boolean() }).strict()),

    // Content
    payload: z.record(z.string(), z.unknown()).describe('Message-specific data'),

    // Context
    context: MessageContextSchema.optional(),

    // Resource Control (NEW PRIMITIVE)
    resource: ResourceStrategySchema.optional().describe(
      'Strategic resource/account handling instructions'
    ),

    // Metadata
    metadata: z.record(z.string(), z.unknown()).optional().describe('Additional metadata'),
  })
  .strict();

export type TNFEnvelope = z.infer<typeof TNFEnvelopeSchema>;

/**
 * Specific Message Payloads
 */

// Task payload
export const TaskPayloadSchema = z
  .object({
    action: z.string().describe('Action to perform'),
    parameters: z.record(z.string(), z.unknown()).optional(),
    timeout: z.number().optional().describe('Timeout in milliseconds'),
    priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  })
  .strict();

export type TaskPayload = z.infer<typeof TaskPayloadSchema>;

// Event payload
export const EventPayloadSchema = z
  .object({
    eventType: z.string().describe('Type of event'),
    data: z.record(z.string(), z.unknown()).optional(),
    source: z.string().optional().describe('Event source'),
  })
  .strict();

export type EventPayload = z.infer<typeof EventPayloadSchema>;

// State sync payload
export const StateSyncPayloadSchema = z
  .object({
    stateKey: z.string().describe('Redis key for state'),
    stateValue: z.unknown(),
    version: z.number().describe('State version for optimistic locking'),
    operation: z.enum(['set', 'update', 'delete', 'get']),
  })
  .strict();

export type StateSyncPayload = z.infer<typeof StateSyncPayloadSchema>;

// Response payload
export const ResponsePayloadSchema = z
  .object({
    success: z.boolean(),
    result: z.unknown().optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.unknown().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type ResponsePayload = z.infer<typeof ResponsePayloadSchema>;

// Auction payload
export const AuctionPayloadSchema = z
  .object({
    taskId: z.string().describe('ID of the task up for auction'),
    taskType: z.string().describe('Type of task (e.g. "code-generation")'),
    requirements: z.array(z.string()).describe('Required capabilities'),
    priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
    expiresAt: z.number().describe('Timestamp when the auction ends'),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type AuctionPayload = z.infer<typeof AuctionPayloadSchema>;

// Bid payload
export const BidPayloadSchema = z
  .object({
    taskId: z.string().describe('ID of the task being bid on'),
    suitability: z.number().min(0).max(1).describe('Score from 0-1 on how well the agent fits'),
    estimatedDuration: z.number().optional().describe('Estimated time to complete in ms'),
    status: z.string().optional().describe('Current agent status/load info'),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type BidPayload = z.infer<typeof BidPayloadSchema>;
